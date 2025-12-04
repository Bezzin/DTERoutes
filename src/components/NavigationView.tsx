/**
 * Navigation View Component
 * ==========================
 * Full Mapbox Navigation with turn-by-turn voice guidance
 * Uses @pawan-pk/react-native-mapbox-navigation
 * Includes speed limit warnings
 */

import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import MapboxNavigation from '@pawan-pk/react-native-mapbox-navigation';
import { sampleRouteWaypoints, logWaypointStats } from '../utils/routeUtils';
import SpeedLimitDisplay from './SpeedLimitDisplay';

interface SpeedLimitData {
  speed?: number;
  unit?: string;
  unknown?: boolean;
}

interface NavigationViewProps {
  origin: [number, number]; // [longitude, latitude]
  destination: [number, number]; // [longitude, latitude]
  routeGeometry?: {
    // GeoJSON geometry from database
    type: string;
    coordinates: number[][];
  };
  routeAnnotations?: {
    // Speed limit annotations from Mapbox
    maxspeed?: SpeedLimitData[];
    speed?: number[];
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
  routeAnnotations,
  waypoints = [],
  onCancelNavigation,
  onArrive,
  onError,
}: NavigationViewProps) {
  // Track waypoint arrivals to distinguish intermediate waypoints from final destination
  const [waypointArrivalCount, setWaypointArrivalCount] = useState(0);
  const totalWaypointsRef = React.useRef(0);
  
  // Track current segment index for speed limit
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isSpeedWarning, setIsSpeedWarning] = useState(false);

  // Extract current speed limit from annotations
  const currentSpeedLimit = useMemo(() => {
    if (!routeAnnotations?.maxspeed || routeAnnotations.maxspeed.length === 0) {
      return undefined;
    }
    
    // Get speed limit for current segment
    const speedData = routeAnnotations.maxspeed[currentSegmentIndex];
    if (!speedData || speedData.unknown) {
      // If current segment unknown, try to find nearest known limit
      for (let i = currentSegmentIndex; i >= 0; i--) {
        const data = routeAnnotations.maxspeed[i];
        if (data && !data.unknown && data.speed) {
          return data.speed;
        }
      }
      return undefined;
    }
    
    return speedData.speed;
  }, [routeAnnotations, currentSegmentIndex]);

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
      
      // Update segment index based on progress if available
      // This helps track which speed limit applies
      if (event.nativeEvent?.legIndex !== undefined && event.nativeEvent?.stepIndex !== undefined) {
        const newIndex = event.nativeEvent.legIndex * 10 + event.nativeEvent.stepIndex;
        if (newIndex !== currentSegmentIndex) {
          setCurrentSegmentIndex(newIndex);
        }
      }
    }
  };

  const handleSpeedUpdate = (speed: number, isOverLimit: boolean) => {
    setIsSpeedWarning(isOverLimit);
    if (isOverLimit) {
      console.log(`⚠️ Speed warning: ${speed.toFixed(0)} mph (limit: ${currentSpeedLimit ? Math.round(currentSpeedLimit * 0.621371) : '?'} mph)`);
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
      <View style={[styles.warningBanner, isSpeedWarning && styles.speedWarningBanner]}>
        <Text style={styles.warningText}>
          {isSpeedWarning 
            ? '🚨 SLOW DOWN - Speed limit exceeded!'
            : '⚠️ Re-routing DISABLED - Follow exact route'}
        </Text>
      </View>

      {/* Speed Limit Display */}
      <View style={styles.speedLimitContainer}>
        <SpeedLimitDisplay
          currentSpeedLimit={currentSpeedLimit}
          unit="mph"
          warningThreshold={5}
          onSpeedUpdate={handleSpeedUpdate}
        />
      </View>

      {/* DEBUG: Waypoint progress counter - Remove before production */}
      <View style={styles.debugBanner}>
        <Text style={styles.debugText}>
          🧪 DEBUG: Waypoints {waypointArrivalCount}/{totalWaypointsRef.current}
          {waypointArrivalCount > 0 && waypointArrivalCount <= totalWaypointsRef.current && ' - CONTINUING ✓'}
          {waypointArrivalCount > totalWaypointsRef.current && ' - COMPLETED ✓'}
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
  speedWarningBanner: {
    backgroundColor: '#dc2626', // Red when speeding
  },
  warningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  speedLimitContainer: {
    position: 'absolute',
    top: 100,
    right: 16,
    zIndex: 1001,
  },
  debugBanner: {
    backgroundColor: '#8b5cf6', // Purple for debug
    padding: 10,
    alignItems: 'center',
    zIndex: 999,
  },
  debugText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
