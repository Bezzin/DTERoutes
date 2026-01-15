/**
 * Route Detail Screen
 * ====================
 * Displays route preview and allows starting navigation
 */

import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import {RouteDetailScreenProps} from '../types/navigation';
import {useRoutesStore} from '../store/useRoutesStore';
import RouteMapPreview from '../components/RouteMapPreview';

export default function RouteDetailScreen({
  route,
  navigation,
}: RouteDetailScreenProps) {
  const {routeId} = route.params;
  const {selectedRoute, isLoading, error, fetchById} = useRoutesStore();

  useEffect(() => {
    fetchById(routeId);
  }, [routeId, fetchById]);

  const handleStartNavigation = () => {
    if (!selectedRoute) {
      return;
    }

    // Check if route is processed (has Mapbox navigation data)
    if (!selectedRoute.is_processed || !selectedRoute.mapbox_route) {
      Alert.alert(
        'Route Not Ready',
        'This route has not been processed for navigation yet.',
        [{text: 'OK'}],
      );
      return;
    }

    // Navigate to navigation screen
    navigation.navigate('Navigation', {routeId});
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10b981';
      case 'moderate':
        return '#f59e0b';
      case 'challenging':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchById(routeId)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !selectedRoute) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading route...</Text>
      </View>
    );
  }

  const testCenter = selectedRoute.test_center;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Map Preview with Route */}
        <RouteMapPreview
          routeGeometry={
            // Handle FeatureCollection structure
            selectedRoute.geojson?.type === 'FeatureCollection'
              ? selectedRoute.geojson?.features?.[0]?.geometry
              : selectedRoute.geojson?.geometry
          }
        />

        {/* Route Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.routeHeader}>
            <Text style={styles.routeTitle}>
              Route {selectedRoute.route_number}
            </Text>
            <View
              style={[
                styles.difficultyBadge,
                {
                  backgroundColor:
                    getDifficultyColor(selectedRoute.difficulty) + '20',
                },
              ]}>
              <Text
                style={[
                  styles.difficultyText,
                  {color: getDifficultyColor(selectedRoute.difficulty)},
                ]}>
                {selectedRoute.difficulty}
              </Text>
            </View>
          </View>

          <Text style={styles.routeName}>{selectedRoute.name}</Text>

          {testCenter && (
            <Text style={styles.testCenterName}>📍 {testCenter.name}</Text>
          )}

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>📏</Text>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>
                {selectedRoute.distance_km} km
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>
                {selectedRoute.estimated_duration_mins} mins
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>📍</Text>
              <Text style={styles.statLabel}>Points</Text>
              <Text style={styles.statValue}>{selectedRoute.point_count}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={styles.statValue}>
                {selectedRoute.is_processed ? 'Ready' : 'Processing'}
              </Text>
            </View>
          </View>

          {/* Navigation Ready Status */}
          {selectedRoute.is_processed && selectedRoute.mapbox_route && (
            <View style={styles.readyBanner}>
              <Text style={styles.readyText}>
                ✅ Navigation ready with turn-by-turn instructions
              </Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>About This Route</Text>
          <Text style={styles.instructionsText}>
            This is an exact GPS trace of a real driving test route. During
            navigation, you'll receive turn-by-turn voice instructions just like
            in the actual test.
          </Text>
          <Text style={styles.instructionsText}>
            ⚠️ <Text style={styles.boldText}>Important:</Text> Follow the route
            exactly as shown. The app will not recalculate if you deviate from
            the path.
          </Text>
        </View>
      </ScrollView>

      {/* Start Navigation Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            (!selectedRoute.is_processed || !selectedRoute.mapbox_route) &&
              styles.startButtonDisabled,
          ]}
          onPress={handleStartNavigation}
          disabled={!selectedRoute.is_processed || !selectedRoute.mapbox_route}>
          <Text style={styles.startButtonText}>🧭 Start Navigation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  routeName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  testCenterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  readyBanner: {
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  readyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '700',
    color: '#1f2937',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  startButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
