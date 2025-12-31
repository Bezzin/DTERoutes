/**
 * Navigation View Component
 * ==========================
 * Full Mapbox Navigation with turn-by-turn voice guidance
 * Uses @pawan-pk/react-native-mapbox-navigation
 * Includes speed limit warnings
 */

import React, {useState, useMemo} from 'react';
import {StyleSheet, View, Text, Alert} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import MapboxNavigation from '@pawan-pk/react-native-mapbox-navigation';
import {sampleRouteWaypoints, logWaypointStats} from '../utils/routeUtils';
import SpeedLimitDisplay from './SpeedLimitDisplay';

// Icons for the info bar
function ClockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke="#FF5722" strokeWidth={2} />
      <Path d="M12 6V12L16 14" stroke="#FF5722" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function RouteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L12 22M12 2L8 6M12 2L16 6" stroke="#FF5722" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={18} r={3} stroke="#FF5722" strokeWidth={2} />
    </Svg>
  );
}

function FlagIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12zM4 22v-7" stroke="#FF5722" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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

  // Track route progress for custom info bar
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  const [durationRemaining, setDurationRemaining] = useState<number | null>(null);

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
        0, // Turn count logged separately in routeUtils
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
    if (__DEV__ && event?.nativeEvent) {
      console.log(
        'Location:',
        event.nativeEvent?.latitude,
        event.nativeEvent?.longitude,
      );
    }
  };

  const handleRouteProgressChange = (event: any) => {
    // Track navigation progress
    if (event?.nativeEvent) {
      // Update progress for custom info bar
      if (event.nativeEvent.distanceRemaining !== undefined) {
        setDistanceRemaining(event.nativeEvent.distanceRemaining);
      }
      if (event.nativeEvent.durationRemaining !== undefined) {
        setDurationRemaining(event.nativeEvent.durationRemaining);
      }

      // Update segment index based on progress if available
      // This helps track which speed limit applies
      if (
        event.nativeEvent?.legIndex !== undefined &&
        event.nativeEvent?.stepIndex !== undefined
      ) {
        const newIndex =
          event.nativeEvent.legIndex * 10 + event.nativeEvent.stepIndex;
        if (newIndex !== currentSegmentIndex) {
          setCurrentSegmentIndex(newIndex);
        }
      }
    }
  };

  const handleSpeedUpdate = (speed: number, isOverLimit: boolean) => {
    if (__DEV__ && isOverLimit) {
      console.log(
        `Speed warning: ${speed.toFixed(0)} mph (limit: ${
          currentSpeedLimit ? Math.round(currentSpeedLimit * 0.621371) : '?'
        } mph)`,
      );
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

  // Format duration from seconds to readable string
  const formatDuration = (seconds: number): string => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  };

  // Format distance from meters to km
  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
  };

  // Calculate ETA
  const getETA = (seconds: number): string => {
    const eta = new Date(Date.now() + seconds * 1000);
    return eta.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
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
      if (__DEV__) {
        console.log(
          `Reached waypoint ${newCount} of ${totalWaypointsRef.current}. Continuing to next waypoint...`,
        );
      }
    } else {
      // Reached final destination - show completion message
      Alert.alert(
        'Route Complete! 🎉',
        'You have successfully completed the test route.',
        [{text: 'OK', onPress: onArrive}],
      );
    }
  };

  return (
    <View style={styles.container}>
      <MapboxNavigation
        startOrigin={startOrigin}
        destination={destinationPoint}
        waypoints={
          waypointsFormatted.length > 0 ? waypointsFormatted : undefined
        }
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

      {/* Overlay container for custom UI elements */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        {/* Speed Limit Display - bottom left corner */}
        <View style={styles.speedLimitContainer}>
          <SpeedLimitDisplay
            currentSpeedLimit={currentSpeedLimit}
            unit="mph"
            warningThreshold={5}
            onSpeedUpdate={handleSpeedUpdate}
          />
        </View>

        {/* Custom styled info bar overlay */}
        {durationRemaining !== null && distanceRemaining !== null && (
          <View style={styles.infoBarContainer}>
            <View style={styles.infoBar}>
              <View style={styles.infoItem}>
                <ClockIcon />
                <Text style={styles.infoValue}>{formatDuration(durationRemaining)}</Text>
                <Text style={styles.infoLabel}>remaining</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <RouteIcon />
                <Text style={styles.infoValue}>{formatDistance(distanceRemaining)}</Text>
                <Text style={styles.infoLabel}>to go</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <FlagIcon />
                <Text style={styles.infoValue}>{getETA(durationRemaining)}</Text>
                <Text style={styles.infoLabel}>arrival</Text>
              </View>
            </View>
          </View>
        )}
      </View>
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
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  speedLimitContainer: {
    position: 'absolute',
    bottom: 100,
    left: 8,
    zIndex: 9999,
    elevation: 20,
  },
  infoBarContainer: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    right: 12,
  },
  infoBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1.5,
    borderColor: '#FF5722',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 15,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
