/**
 * Test Center Screen
 * ===================
 * Displays list of routes for a selected test center
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { TestCenterScreenProps } from '../types/navigation';
import { useRoutesStore } from '../store/useRoutesStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { RouteRequestCard } from '../components/RouteRequestCard';

export default function TestCenterScreen({
  route,
  navigation,
}: TestCenterScreenProps) {
  const { testCenterId, testCenterName } = route.params;
  const { routes, isLoading, error, fetchByTestCenter } = useRoutesStore();
  const {
    isSubscribed,
    canAccessRoute,
    markRouteAsFirstFree,
    getFirstFreeRouteId,
    checkSubscription,
  } = useSubscriptionStore();

  useEffect(() => {
    fetchByTestCenter(testCenterId);
  }, [testCenterId]);

  // Handle route press with subscription check
  const handleRoutePress = async (routeId: string) => {
    // Check if user can access this route
    if (canAccessRoute(testCenterId, routeId)) {
      // Mark as first free route if applicable (only tracks for non-subscribers)
      await markRouteAsFirstFree(testCenterId, routeId);
      navigation.navigate('RouteDetail', { routeId });
    } else {
      // Show paywall for premium routes
      try {
        const result = await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: 'Test Routes Expert Unlimited',
        });

        // Check result and navigate if purchase/restore was successful
        if (
          result === PAYWALL_RESULT.PURCHASED ||
          result === PAYWALL_RESULT.RESTORED
        ) {
          // Refresh subscription status
          await checkSubscription();
          // Now navigate to the route
          navigation.navigate('RouteDetail', { routeId });
        }
        // CANCELLED, NOT_PRESENTED, ERROR - user didn't complete purchase
      } catch (error: any) {
        console.error('Paywall error:', error);
        Alert.alert(
          'Error',
          'Unable to show subscription options. Please try again.',
        );
      }
    }
  };

  // Check if a route is the free route for visual indicator
  const isFirstFreeRoute = (routeId: string): boolean => {
    if (isSubscribed) return false;
    const freeRouteId = getFirstFreeRouteId(testCenterId);
    // If no free route yet, the first one will be free
    if (!freeRouteId) {
      return routes.length > 0 && routes[0].id === routeId;
    }
    return freeRouteId === routeId;
  };

  // Check if route requires subscription
  const requiresSubscription = (routeId: string): boolean => {
    if (isSubscribed) return false;
    return !canAccessRoute(testCenterId, routeId);
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
          onPress={() => fetchByTestCenter(testCenterId)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading && routes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading routes...</Text>
      </View>
    );
  }

  if (routes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No routes available</Text>
        <Text style={styles.emptySubtext}>
          Routes for this test center haven't been added yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Available Routes</Text>
          <Text style={styles.headerSubtitle}>
            {routes.length} {routes.length === 1 ? 'route' : 'routes'} available
          </Text>
        </View>
      </View>

      <RouteRequestCard
        testCenterId={testCenterId}
        testCenterName={testCenterName}
        routeCount={routes.length}
      />

      <FlatList
        data={routes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isFree = isFirstFreeRoute(item.id);
          const isPremium = requiresSubscription(item.id);

          return (
            <TouchableOpacity
              style={styles.routeCard}
              onPress={() => handleRoutePress(item.id)}
            >
              <View style={styles.routeHeader}>
                <View style={styles.routeNumberBadge}>
                  <Text style={styles.routeNumberText}>Route {item.route_number}</Text>
                </View>
                <View style={styles.headerBadges}>
                  {/* Free or Premium badge */}
                  {!isSubscribed && (
                    <View
                      style={[
                        styles.accessBadge,
                        isFree ? styles.freeBadge : styles.premiumBadge,
                      ]}
                    >
                      <Text style={styles.accessBadgeText}>
                        {isFree ? 'FREE' : '🔒'}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(item.difficulty) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(item.difficulty) },
                      ]}
                    >
                      {item.difficulty}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.routeName}>{item.name}</Text>

              <View style={styles.routeStats}>
                <View style={styles.stat}>
                  <Text style={styles.statIcon}>📏</Text>
                  <Text style={styles.statValue}>{item.distance_km} km</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statIcon}>⏱️</Text>
                  <Text style={styles.statValue}>{item.estimated_duration_mins} mins</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statIcon}>📍</Text>
                  <Text style={styles.statValue}>{item.point_count} points</Text>
                </View>
              </View>

              <View style={[styles.viewButton, isPremium && styles.viewButtonPremium]}>
                <Text style={[styles.viewButtonText, isPremium && styles.viewButtonTextPremium]}>
                  {isPremium ? 'Unlock Route →' : 'View Route →'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeNumberBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  routeNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accessBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeBadge: {
    backgroundColor: '#dcfce7',
  },
  premiumBadge: {
    backgroundColor: '#fef3c7',
  },
  accessBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  routeName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  viewButton: {
    backgroundColor: '#dbeafe',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonPremium: {
    backgroundColor: '#fef3c7',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  viewButtonTextPremium: {
    color: '#b45309',
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
