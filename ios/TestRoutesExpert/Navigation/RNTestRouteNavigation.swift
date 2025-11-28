import Foundation
import MapboxNavigation
import MapboxCoreNavigation
import MapboxDirections
import MapboxMaps

@objc(RNTestRouteNavigation)
class RNTestRouteNavigation: RCTEventEmitter {

  private var navigationViewController: NavigationViewController?
  private var originalRoute: Route?
  private var hasListeners = false

  override init() {
    super.init()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return [
      "onNavigationProgress",
      "onNavigationError",
      "onNavigationCancel",
      "onNavigationArrive",
      "onOffRoute"
    ]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc func startNavigation(_ origin: [Double],
                             destination: [Double],
                             waypoints: [[Double]],
                             resolver: @escaping RCTPromiseResolveBlock,
                             rejecter: @escaping RCTPromiseRejectBlock) {

    DispatchQueue.main.async {
      // Build coordinate array
      var coordinates: [CLLocationCoordinate2D] = []

      // Add origin
      coordinates.append(CLLocationCoordinate2D(latitude: origin[1], longitude: origin[0]))

      // Add waypoints
      for waypoint in waypoints {
        coordinates.append(CLLocationCoordinate2D(latitude: waypoint[1], longitude: waypoint[0]))
      }

      // Add destination
      coordinates.append(CLLocationCoordinate2D(latitude: destination[1], longitude: destination[0]))

      // Create waypoints for directions request
      let directionWaypoints = coordinates.map { Waypoint(coordinate: $0) }

      // Configure route options
      let routeOptions = NavigationRouteOptions(waypoints: directionWaypoints)
      routeOptions.profileIdentifier = .automobileAvoidingTraffic
      routeOptions.distanceMeasurementSystem = .metric
      routeOptions.includesSpokenInstructions = true

      // Request route from Mapbox
      Directions.shared.calculate(routeOptions) { [weak self] (session, result) in
        guard let self = self else { return }

        switch result {
        case .success(let response):
          guard let route = response.routes?.first else {
            rejecter("NO_ROUTE", "No route found", nil)
            return
          }

          // Store original route
          self.originalRoute = route

          // Create navigation service with re-routing DISABLED
          let navigationService = MapboxNavigationService(
            indexedRouteResponse: response,
            customRoutingProvider: nil,
            credentials: Credentials.shared,
            simulating: .never
          )

          // CRITICAL: Disable automatic re-routing
          navigationService.reroutesProactively = false

          // Configure navigation options
          let navigationOptions = NavigationOptions(
            navigationService: navigationService
          )

          // Create navigation view controller
          let navViewController = NavigationViewController(
            for: response,
            navigationOptions: navigationOptions
          )

          navViewController.delegate = self

          // Present navigation
          if let rootViewController = UIApplication.shared.keyWindow?.rootViewController {
            rootViewController.present(navViewController, animated: true) {
              self.navigationViewController = navViewController
              resolver(["success": true])
            }
          } else {
            rejecter("NO_ROOT_VC", "Could not find root view controller", nil)
          }

        case .failure(let error):
          rejecter("ROUTE_ERROR", "Failed to calculate route: \(error.localizedDescription)", error)
        }
      }
    }
  }

  @objc func stopNavigation(_ resolver: @escaping RCTPromiseResolveBlock,
                            rejecter: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      self.navigationViewController?.dismiss(animated: true) {
        self.navigationViewController = nil
        self.originalRoute = nil
        resolver(["success": true])
      }
    }
  }
}

// MARK: - NavigationViewControllerDelegate
extension RNTestRouteNavigation: NavigationViewControllerDelegate {

  // CRITICAL: Disable re-routing by always returning false
  func navigationViewController(_ navigationViewController: NavigationViewController,
                                shouldRerouteFrom location: CLLocation) -> Bool {
    // NEVER allow re-routing
    return false
  }

  // Monitor route progress
  func navigationViewController(_ navigationViewController: NavigationViewController,
                                didUpdate progress: RouteProgress,
                                with location: CLLocation,
                                rawLocation: CLLocation) {

    // Check if user is off route
    let isOffRoute = !progress.currentLegProgress.userIsOnRoute

    if hasListeners {
      sendEvent(withName: "onNavigationProgress", body: [
        "distanceRemaining": progress.distanceRemaining,
        "durationRemaining": progress.durationRemaining,
        "fractionTraveled": progress.fractionTraveled,
        "isOffRoute": isOffRoute
      ])

      if isOffRoute {
        sendEvent(withName: "onOffRoute", body: [
          "distanceFromRoute": progress.currentLegProgress.currentStepProgress.userDistanceToManeuverLocation
        ])
      }
    }
  }

  // Handle navigation cancellation
  func navigationViewControllerDidDismiss(_ navigationViewController: NavigationViewController,
                                         byCanceling canceled: Bool) {
    if hasListeners && canceled {
      sendEvent(withName: "onNavigationCancel", body: nil)
    }
    self.navigationViewController = nil
    self.originalRoute = nil
  }

  // Handle arrival
  func navigationViewController(_ navigationViewController: NavigationViewController,
                                didArriveAt waypoint: Waypoint) -> Bool {
    if hasListeners {
      sendEvent(withName: "onNavigationArrive", body: [
        "waypoint": waypoint.name ?? "Destination"
      ])
    }
    return true
  }
}
