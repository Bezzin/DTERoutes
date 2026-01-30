/**
 * Navigation Screen - CRITICAL
 * =============================
 * Full-screen turn-by-turn navigation
 *
 * CRITICAL REQUIREMENT: Re-routing MUST be disabled!
 * Users must follow the exact test route path.
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {NavigationScreenProps} from '../types/navigation';
import {useRoutesStore} from '../store/useRoutesStore';
import NavigationView from '../components/NavigationView';
import LocationPermissionModal from '../components/LocationPermissionModal';

/**
 * Extract speed limit annotations from Mapbox route data
 * Combines annotations from all legs into a single array
 */
function extractRouteAnnotations(mapboxRoute: any) {
  if (!mapboxRoute?.legs) {
    return undefined;
  }

  const allMaxspeeds: any[] = [];
  const allSpeeds: number[] = [];

  for (const leg of mapboxRoute.legs) {
    if (leg.annotation?.maxspeed) {
      allMaxspeeds.push(...leg.annotation.maxspeed);
    }
    if (leg.annotation?.speed) {
      allSpeeds.push(...leg.annotation.speed);
    }
  }

  if (allMaxspeeds.length === 0 && allSpeeds.length === 0) {
    return undefined;
  }

  return {
    maxspeed: allMaxspeeds.length > 0 ? allMaxspeeds : undefined,
    speed: allSpeeds.length > 0 ? allSpeeds : undefined,
  };
}

export default function NavigationScreen({
  route,
  navigation,
}: NavigationScreenProps) {
  const {routeId} = route.params;
  const {selectedRoute, isLoading, fetchById, markRouteCompleted} = useRoutesStore();

  // Permission state
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (Platform.OS === 'android') {
        // Check location permission
        const locationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (!locationGranted) {
          setShowPermissionModal(true);
          return;
        }

        // Check notification permission on Android 13+
        const apiLevel = Platform.Version;
        if (apiLevel >= 33) {
          const notificationGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );

          if (!notificationGranted) {
            setShowPermissionModal(true);
            return;
          }
        }

        // All required permissions granted
        setHasLocationPermission(true);
      } else {
        // iOS - assume granted (handled via Info.plist)
        setHasLocationPermission(true);
      }
    };
    checkPermission();
  }, []);

  useEffect(() => {
    if (!selectedRoute || selectedRoute.id !== routeId) {
      fetchById(routeId);
    }
  }, [routeId, fetchById, selectedRoute]);

  const handlePermissionGranted = () => {
    setShowPermissionModal(false);
    setHasLocationPermission(true);
  };

  const handlePermissionDenied = () => {
    setShowPermissionModal(false);
    setHasLocationPermission(false);
    Alert.alert(
      'Location Required',
      'Navigation requires location access to work. Please enable location in your device settings to use this feature.',
      [
        {
          text: 'Go Back',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  const handleEndNavigation = () => {
    Alert.alert(
      'End Navigation?',
      'Are you sure you want to stop navigation?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'End',
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
          },
        },
      ],
    );
  };

  // Show permission modal if needed
  if (showPermissionModal) {
    return (
      <LocationPermissionModal
        visible={showPermissionModal}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
      />
    );
  }

  // Show loading while checking permission or loading route
  if (isLoading || !selectedRoute || hasLocationPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading navigation...</Text>
      </View>
    );
  }

  // Permission denied - this shouldn't normally show as we handle it above
  if (hasLocationPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Location permission required</Text>
      </View>
    );
  }

  const mapboxRoute = selectedRoute.mapbox_route;

  // Extract origin and destination from route geometry
  // GeoJSON can be a FeatureCollection or a direct Feature
  const getCoordinates = () => {
    const geojson = selectedRoute?.geojson;
    if (!geojson) {
      return [];
    }

    // Handle FeatureCollection
    if (geojson.type === 'FeatureCollection' && geojson.features?.length > 0) {
      return geojson.features[0]?.geometry?.coordinates || [];
    }

    // Handle direct Feature
    if (geojson.type === 'Feature') {
      return geojson.geometry?.coordinates || [];
    }

    // Handle direct geometry
    return geojson.geometry?.coordinates || [];
  };

  const routeCoordinates = getCoordinates();
  const hasValidCoordinates =
    routeCoordinates.length >= 2 &&
    Array.isArray(routeCoordinates[0]) &&
    routeCoordinates[0].length >= 2;

  const origin = hasValidCoordinates
    ? (routeCoordinates[0] as [number, number])
    : null;
  const destination = hasValidCoordinates
    ? (routeCoordinates[routeCoordinates.length - 1] as [number, number])
    : null;

  const handleNavigationError = (error: any) => {
    console.error('Navigation error:', error);
    Alert.alert(
      'Navigation Error',
      'Failed to start navigation. Please try again.',
    );
  };

  const handleNavigationCancel = () => {
    navigation.goBack();
  };

  const handleNavigationArrive = () => {
    // Mark route as completed
    if (selectedRoute) {
      markRouteCompleted(selectedRoute.test_center_id, selectedRoute.id);
    }

    Alert.alert('Route Complete!', 'You have arrived at the destination.', [
      {
        text: 'OK',
        onPress: () => {
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation View */}
      <View style={styles.navigationView}>
        {hasValidCoordinates && origin && destination ? (
          // Active navigation screen with map view
          <View style={styles.activeNavigationContainer}>
            <NavigationView
              origin={origin}
              destination={destination}
              routeGeometry={
                selectedRoute?.geojson?.type === 'FeatureCollection'
                  ? selectedRoute?.geojson?.features?.[0]?.geometry
                  : selectedRoute?.geojson?.geometry
              }
              routeAnnotations={extractRouteAnnotations(mapboxRoute)}
              onError={handleNavigationError}
              onCancelNavigation={handleNavigationCancel}
              onArrive={handleNavigationArrive}
            />
          </View>
        ) : (
          // Invalid route data
          <View style={styles.readyContainer}>
            <Text style={styles.readyIcon}>⚠️</Text>
            <Text style={styles.readyTitle}>Route Data Missing</Text>
            <Text style={styles.readySubtitle}>
              This route doesn't have valid coordinate data.{'\n'}
              Please go back and select a different route.
            </Text>
            <TouchableOpacity
              style={[styles.startButton, {backgroundColor: '#6b7280'}]}
              onPress={() => navigation.goBack()}>
              <Text style={styles.startButtonText}>← Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* End Navigation Button (Always visible) */}
      <TouchableOpacity style={styles.endButton} onPress={handleEndNavigation}>
        <Text style={styles.endButtonText}>✕ End Navigation</Text>
      </TouchableOpacity>

      {/* Critical Implementation Comments (for developers) */}
      {/*
        CRITICAL IMPLEMENTATION NOTES:

        1. iOS Re-routing Disable:
           func navigationViewController(
             _ navigationViewController: NavigationViewController,
             shouldRerouteFrom location: CLLocation
           ) -> Bool {
             return false  // NEVER auto-reroute
           }

        2. Android Re-routing Disable:
           navigationView.registerRouteObserver(object : RouteObserver {
             override fun onRoutesChanged(reason: RoutesChangedReason) {
               if (reason == RoutesChangedReason.REROUTE) {
                 navigationView.api.setRoute(originalRoute)
               }
             }
           })

        3. Off-Route Handling:
           - Show visual indicator when user goes off-route
           - Display distance back to route
           - DO NOT recalculate a new route
           - Keep original route geometry

        4. Voice Instructions:
           - Generated by Map Matching API
           - Enabled with voice_instructions=true
           - Metric units (meters, kilometers)

        5. Testing:
           - Use route simulation in development
           - Manually deviate from route path
           - Verify NO re-routing occurs
           - This is THE critical test
      */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  navigationView: {
    flex: 1,
  },
  readyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  readyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  readySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 32,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  activeNavigationContainer: {
    flex: 1,
  },
  endButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
  },
  endButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
