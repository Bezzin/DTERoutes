/**
 * Navigation View Component
 * ==========================
 * Full Mapbox Navigation with turn-by-turn voice guidance
 * Uses @pawan-pk/react-native-mapbox-navigation
 */

import React from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import MapboxNavigation from '@pawan-pk/react-native-mapbox-navigation';
import { sampleRouteWaypoints, logWaypointStats } from '../utils/routeUtils';

interface NavigationViewProps {
  origin: [number, number]; // [longitude, latitude]
  destination: [number, number]; // [longitude, latitude]
  routeGeometry?: {
    // GeoJSON geometry from database
    type: string;
    coordinates: number[][];
  };
  waypoints?: Array<[number, number]>; // Optional intermediate waypoints
  onCancelNavigation?: () => void;
  onArrive?: () => void;
  onError?: (error: any) => void;
}

export default function NavigationView({
  origin,
  destination,
  routeGeometry,
  waypoints = [],
  onCancelNavigation,
  onArrive,
  onError,
}: NavigationViewProps) {
  // Track waypoint arrivals to distinguish intermediate waypoints from final destination
  const [waypointArrivalCount, setWaypointArrivalCount] = React.useState(0);
  const totalWaypointsRef = React.useRef(0);

  // Convert [lng, lat] to {latitude, longitude} format
  const startOrigin = {
    latitude: origin[1],
    longitude: origin[0],
  };

  const destinationPoint = {
    latitude: destination[1],
    longitude: destination[0],
  };

  // Extract and sample waypoints from route geometry
  // This ensures the calculated route follows the exact database path
  const sampledWaypoints = React.useMemo(() => {
    if (routeGeometry?.coordinates && routeGeometry.coordinates.length > 2) {
      const allCoords = routeGeometry.coordinates;

      // Remove first and last (those are origin/destination)
      const intermediatePoints = allCoords.slice(1, -1);

      // Sample to max 23 waypoints (Mapbox limit is 25 total coordinates)
      const sampled = sampleRouteWaypoints(intermediatePoints, 23);

      // Log stats for debugging
      logWaypointStats(
        allCoords.length,
        sampled.length,
        0 // Turn count logged separately in routeUtils
      );

      return sampled;
    }

    // Otherwise use provided waypoints
    return waypoints;
  }, [routeGeometry, waypoints]);

  // Convert waypoints array to Mapbox format
  const waypointsFormatted = sampledWaypoints.map(wp => ({
    latitude: wp[1],
    longitude: wp[0],
  }));

  // Calculate total waypoints (intermediate + final destination)
  // Store in ref to track across renders
  React.useEffect(() => {
    totalWaypointsRef.current = waypointsFormatted.length;
    setWaypointArrivalCount(0); // Reset count when waypoints change
  }, [waypointsFormatted.length]);

  const handleLocationChange = (event: any) => {
    // Track user location during navigation
    if (event?.nativeEvent) {
      console.log('Location:', event.nativeEvent?.latitude, event.nativeEvent?.longitude);
    }
  };

  const handleRouteProgressChange = (event: any) => {
    // Track navigation progress
    if (event?.nativeEvent) {
      console.log('Progress:', event.nativeEvent?.distanceRemaining, event.nativeEvent?.durationRemaining);
    }
  };

  const handleError = (event: any) => {
    console.error('Navigation error:', event.nativeEvent);
    if (onError) {
      onError(event.nativeEvent);
    }
  };

  const handleCancelNavigation = () => {
    if (onCancelNavigation) {
      onCancelNavigation();
    }
  };

  const handleArrive = () => {
    // Increment arrival count
    const newCount = waypointArrivalCount + 1;
    setWaypointArrivalCount(newCount);

    // Check if this is an intermediate waypoint or the final destination
    // Intermediate waypoints: 1 to totalWaypointsRef.current
    // Final destination: totalWaypointsRef.current + 1
    const isIntermediateWaypoint = newCount <= totalWaypointsRef.current;

    if (isIntermediateWaypoint) {
      // Reached an intermediate waypoint - log but don't show completion
      console.log(`Reached waypoint ${newCount} of ${totalWaypointsRef.current}. Continuing to next waypoint...`);
      // Optionally show a brief notification (commented out to avoid disrupting navigation)
      // Alert.alert('Waypoint Reached', `Waypoint ${newCount} of ${totalWaypointsRef.current}`, [{ text: 'Continue' }]);
    } else {
      // Reached final destination - show completion message
      Alert.alert(
        'Route Complete! 🎉',
        'You have successfully completed the test route.',
        [{ text: 'OK', onPress: onArrive }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Re-routing disabled banner */}
      <View style={styles.warningBanner}>
        <Text style={styles.warningText}>
          ⚠️ Re-routing DISABLED - Follow exact route
        </Text>
      </View>

      <MapboxNavigation
        startOrigin={startOrigin}
        destination={destinationPoint}
        waypoints={waypointsFormatted.length > 0 ? waypointsFormatted : undefined}
        style={styles.navigation}
        shouldSimulateRoute={false} // Set to true for testing
        showCancelButton={true}
        language="en"
        distanceUnit="metric"
        onLocationChange={handleLocationChange}
        onRouteProgressChange={handleRouteProgressChange}
        onError={handleError}
        onCancelNavigation={handleCancelNavigation}
        onArrive={handleArrive}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  navigation: {
    flex: 1,
  },
  warningBanner: {
    backgroundColor: '#f59e0b',
    padding: 12,
    alignItems: 'center',
    zIndex: 1000,
  },
  warningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
