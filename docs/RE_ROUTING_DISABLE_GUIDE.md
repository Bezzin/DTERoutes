# Re-Routing Disable Implementation Guide

## ⚠️ CRITICAL REQUIREMENT

For Test Routes Expert to work correctly, **re-routing MUST be disabled**. Users need to follow the exact GPS-traced test routes without any automatic route recalculation.

## Current Status

✅ **Navigation SDK Integrated** - `@pawan-pk/react-native-mapbox-navigation`
✅ **Route Data Ready** - 946 navigation points with 1055 turn instructions
⚠️ **Re-routing Disable** - Requires native module customization

---

## Implementation Options

### Option 1: Fork and Modify the Navigation Package (Recommended)

The `@pawan-pk/react-native-mapbox-navigation` package doesn't expose re-routing configuration. You'll need to:

1. **Fork the package:**
   ```bash
   git clone https://github.com/pawan-pk/react-native-mapbox-navigation.git
   cd react-native-mapbox-navigation
   ```

2. **Modify iOS Native Code** (ios/RNMapboxNavigation.swift or .m):
   ```swift
   // In NavigationViewController delegate
   func navigationViewController(
     _ navigationViewController: NavigationViewController,
     shouldRerouteFrom location: CLLocation
   ) -> Bool {
     // CRITICAL: Always return false to disable re-routing
     return false
   }

   // Optional: Show warning when user goes off-route
   func navigationViewController(
     _ navigationViewController: NavigationViewController,
     didUpdate progress: RouteProgress,
     with location: CLLocation,
     rawLocation: CLLocation
   ) {
     // Check if user is off route
     if let routeProgress = navigationViewController.routeController.routeProgress {
       let isOffRoute = !routeProgress.currentLegProgress.userIsOnRoute
       if isOffRoute {
         // Show warning banner (don't recalculate)
         showOffRouteWarning()
       }
     }
   }
   ```

3. **Modify Android Native Code** (android/src/main/java/.../RNMapboxNavigationModule.java):
   ```java
   // In RouteObserver implementation
   @Override
   public void onRoutesChanged(@NonNull RoutesChangedReason reason) {
     if (reason == RoutesChangedReason.REROUTE) {
       // CRITICAL: Prevent re-routing by resetting to original route
       mapboxNavigation.setRoutes(originalRoutes);

       // Show warning to user
       showOffRouteWarning();
     }
   }

   // Optional: Monitor off-route status
   @Override
   public void onOffRouteStateChanged(boolean offRoute) {
     if (offRoute) {
       // User has deviated from route - show warning
       sendEvent("onOffRoute", null);
     }
   }
   ```

4. **Install your forked package:**
   ```json
   {
     "dependencies": {
       "@pawan-pk/react-native-mapbox-navigation": "github:YOUR_USERNAME/react-native-mapbox-navigation#your-branch"
     }
   }
   ```

---

### Option 2: Use Mapbox Navigation SDK Directly

Instead of using the wrapper, integrate Mapbox Navigation SDK directly:

**iOS (Swift):**
```swift
import MapboxNavigation
import MapboxCoreNavigation
import MapboxDirections

class NavigationViewController: UIViewController, NavigationViewControllerDelegate {

    func startNavigation(route: Route) {
        let navigationService = MapboxNavigationService(
            route: route,
            routeIndex: 0,
            routeOptions: routeOptions,
            routingProvider: MapboxRoutingProvider(),
            credentials: Credentials.shared,
            simulating: .never // Use real GPS
        )

        // CRITICAL: Disable automatic re-routing
        navigationService.reroutesProactively = false

        let navigationOptions = NavigationOptions(
            navigationService: navigationService
        )

        let navViewController = NavigationViewController(
            for: route,
            routeIndex: 0,
            routeOptions: routeOptions,
            navigationOptions: navigationOptions
        )

        navViewController.delegate = self
        present(navViewController, animated: true)
    }

    // Delegate method - prevent re-routing
    func navigationViewController(
        _ navigationViewController: NavigationViewController,
        shouldRerouteFrom location: CLLocation
    ) -> Bool {
        return false // NEVER re-route
    }

    // Monitor off-route status
    func navigationViewController(
        _ navigationViewController: NavigationViewController,
        didUpdate progress: RouteProgress,
        with location: CLLocation,
        rawLocation: CLLocation
    ) {
        if !progress.currentLegProgress.userIsOnRoute {
            showWarning("You are off the test route. Return to the route path.")
        }
    }
}
```

**Android (Kotlin):**
```kotlin
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.reroute.RerouteController
import com.mapbox.navigation.core.trip.session.RouteProgressObserver

class NavigationActivity : AppCompatActivity() {

    private lateinit var mapboxNavigation: MapboxNavigation
    private var originalRoutes: List<DirectionsRoute> = emptyList()

    fun startNavigation(routes: List<DirectionsRoute>) {
        originalRoutes = routes

        // Initialize navigation with custom reroute controller
        val navigationOptions = NavigationOptions.Builder(this)
            .rerouteController(NoRerouteController()) // Custom controller that does nothing
            .build()

        mapboxNavigation = MapboxNavigation(navigationOptions)

        // Set routes
        mapboxNavigation.setRoutes(routes)

        // Observe route progress
        mapboxNavigation.registerRouteProgressObserver(routeProgressObserver)

        // Observe route changes (to block re-routing)
        mapboxNavigation.registerRoutesObserver(routesObserver)

        // Start trip session
        mapboxNavigation.startTripSession()
    }

    private val routesObserver = object : RoutesObserver {
        override fun onRoutesChanged(result: RoutesUpdatedResult) {
            if (result.reason == RoutesExtra.ROUTES_UPDATE_REASON_REROUTE) {
                // CRITICAL: Block re-routing by resetting to original route
                mapboxNavigation.setRoutes(originalRoutes)
                showWarning("Re-routing disabled. Follow the exact test route.")
            }
        }
    }

    private val routeProgressObserver = object : RouteProgressObserver {
        override fun onRouteProgressChanged(routeProgress: RouteProgress) {
            // Check if user is off route
            val isOffRoute = routeProgress.currentState == RouteProgressState.OFF_ROUTE
            if (isOffRoute) {
                showWarning("You are off the test route. Return to the route path.")
            }
        }
    }
}

// Custom RerouteController that does nothing
class NoRerouteController : RerouteController {
    override fun reroute(callback: RerouteController.RoutesCallback) {
        // Do nothing - disable re-routing
    }

    override fun interrupt() {
        // Do nothing
    }
}
```

---

### Option 3: JavaScript-Level Monitoring (Temporary Workaround)

While not as robust as native implementation, you can monitor and alert users:

```typescript
// In NavigationView.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Alert } from 'react-native';

const NavigationView = ({ route, origin, destination }) => {
  const [isOffRoute, setIsOffRoute] = useState(false);
  const originalRouteRef = useRef(route);

  const handleRouteProgressChange = (progress) => {
    // Check if user is significantly off the original route
    const currentLocation = progress.location;
    const distanceFromRoute = calculateDistanceFromRoute(
      currentLocation,
      originalRouteRef.current
    );

    if (distanceFromRoute > 50) { // 50 meters threshold
      if (!isOffRoute) {
        setIsOffRoute(true);
        Alert.alert(
          'Off Route',
          'You have deviated from the test route. Please return to the route path.',
          [{ text: 'OK' }]
        );
      }
    } else {
      setIsOffRoute(false);
    }
  };

  // ... rest of component
};
```

**Note:** This is not a complete solution as it doesn't prevent Mapbox from recalculating routes internally.

---

## Recommended Approach

**For MVP/Testing:** Use Option 3 (JavaScript monitoring) to demonstrate the app functionality.

**For Production:** Implement Option 1 (Fork the package) or Option 2 (Direct SDK integration) to truly disable re-routing at the native level.

---

## Testing Re-routing Disable

### Test Plan:
1. Start navigation on a test route
2. Intentionally walk/drive off the route path
3. **Expected behavior:**
   - ❌ No new route should be calculated
   - ✅ Warning banner appears: "You are off route"
   - ✅ Original route remains visible on map
   - ✅ Navigation continues with original instructions
4. Return to the route
5. **Expected behavior:**
   - ✅ Warning disappears
   - ✅ Navigation resumes normally

### Verification:
```bash
# Enable simulation mode for testing
shouldSimulateRoute: true

# Or use real device and deliberately go off-route
```

---

## Priority

🔴 **HIGH PRIORITY** - This is the core feature that differentiates your app. Without re-routing disabled, users won't be able to practice the exact test routes.

---

## Next Steps

1. Decide on implementation approach (recommend Option 1 for balance of effort/reliability)
2. Fork the navigation package OR integrate Mapbox SDK directly
3. Implement native re-routing disable logic
4. Test thoroughly with real GPS deviations
5. Add visual indicators for off-route status

---

## Questions?

If you need help implementing any of these options, let me know which approach you'd like to take!
