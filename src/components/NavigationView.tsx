/**
 * Navigation View Component
 * ==========================
 * Full Mapbox Navigation with turn-by-turn voice guidance
 * Uses @pawan-pk/react-native-mapbox-navigation
 */

import React from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import MapboxNavigation from '@pawan-pk/react-native-mapbox-navigation';

interface NavigationViewProps {
  origin: [number, number]; // [longitude, latitude]
  destination: [number, number]; // [longitude, latitude]
  waypoints?: Array<[number, number]>; // Optional intermediate waypoints
  onCancelNavigation?: () => void;
  onArrive?: () => void;
  onError?: (error: any) => void;
}

export default function NavigationView({
  origin,
  destination,
  waypoints = [],
  onCancelNavigation,
  onArrive,
  onError,
}: NavigationViewProps) {
  // Convert [lng, lat] to {latitude, longitude} format
  const startOrigin = {
    latitude: origin[1],
    longitude: origin[0],
  };

  const destinationPoint = {
    latitude: destination[1],
    longitude: destination[0],
  };

  // Convert waypoints array
  const waypointsFormatted = waypoints.map(wp => ({
    latitude: wp[1],
    longitude: wp[0],
  }));

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
    Alert.alert(
      'Route Complete! 🎉',
      'You have successfully completed the test route.',
      [{ text: 'OK', onPress: onArrive }]
    );
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
