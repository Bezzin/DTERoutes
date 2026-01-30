/**
 * Test Center Screen
 * ===================
 * Displays list of routes for a selected test center
 */

import React, {useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Svg, {Path, Rect} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import {TestCenterScreenProps} from '../types/navigation';
import {useRoutesStore} from '../store/useRoutesStore';
import {useSubscriptionStore} from '../store/useSubscriptionStore';
import {RouteRequestCard} from '../components/RouteRequestCard';
import {Colors, Gradients, Spacing} from '../theme';

// Lock icon component
function LockIcon({size = 24, color = Colors.primaryAccent}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={4}
        y={11}
        width={16}
        height={11}
        rx={2}
        fill={color}
      />
      <Path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Premium badge icon
function PremiumIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={Colors.primaryAccent}
        stroke={Colors.primaryAccent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function TestCenterScreen({
  route,
  navigation,
}: TestCenterScreenProps) {
  const {testCenterId} = route.params;
  const {routes, isLoading, error, fetchByTestCenter} = useRoutesStore();
  const {
    isSubscribed,
    canAccessRoute,
    markRouteAsFirstFree,
    getFirstFreeRouteId,
    checkSubscription,
  } = useSubscriptionStore();

  useEffect(() => {
    fetchByTestCenter(testCenterId);
  }, [testCenterId, fetchByTestCenter]);

  // Re-check subscription status when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      checkSubscription();
    }, [checkSubscription]),
  );

  // Handle route press with subscription check
  const handleRoutePress = async (routeId: string) => {
    // Check if user can access this route
    if (canAccessRoute(testCenterId, routeId)) {
      // Mark as first free route if applicable (only tracks for non-subscribers)
      await markRouteAsFirstFree(testCenterId, routeId);
      navigation.navigate('RouteDetail', {routeId});
    } else {
      // Show custom paywall for premium routes
      navigation.navigate('Paywall');
    }
  };

  // Check if a route is the free route for visual indicator
  const isFirstFreeRoute = (routeId: string): boolean => {
    if (isSubscribed) {
      return false;
    }
    const freeRouteId = getFirstFreeRouteId(testCenterId);
    // If no free route yet, the first one will be free
    if (!freeRouteId) {
      return routes.length > 0 && routes[0].id === routeId;
    }
    return freeRouteId === routeId;
  };

  // Check if route requires subscription
  const requiresSubscription = (routeId: string): boolean => {
    if (isSubscribed) {
      return false;
    }
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
          onPress={() => fetchByTestCenter(testCenterId)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading && routes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAccent} />
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

  const {testCenterName} = route.params;

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

      <FlatList
        data={routes}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          routes.length <= 2 ? (
            <RouteRequestCard
              testCenterId={testCenterId}
              testCenterName={testCenterName}
              routeCount={routes.length}
            />
          ) : null
        }
        ListFooterComponent={
          <TouchableOpacity
            style={styles.missingRoutesLink}
            onPress={() => navigation.navigate('Feedback', {testCenterName})}>
            <Text style={styles.missingRoutesText}>
              Missing Routes? Let us know
            </Text>
          </TouchableOpacity>
        }
        renderItem={({item}) => {
          const isFree = isFirstFreeRoute(item.id);
          const isPremium = requiresSubscription(item.id);

          // Render locked route card with premium styling
          if (isPremium) {
            return (
              <TouchableOpacity
                style={styles.lockedRouteCard}
                onPress={() => handleRoutePress(item.id)}
                activeOpacity={0.8}>
                {/* Lock overlay */}
                <View style={styles.lockedOverlay}>
                  <View style={styles.lockIconContainer}>
                    <LockIcon size={48} color={Colors.primaryAccent} />
                  </View>
                  <Text style={styles.lockedTitle}>ROUTE LOCKED</Text>
                  <Text style={styles.lockedSubtitle}>
                    Upgrade to access Route {item.route_number} and hundreds more
                  </Text>
                </View>
                
                {/* Route preview info */}
                <View style={styles.lockedRouteInfo}>
                  <View style={styles.lockedRouteHeader}>
                    <View style={styles.lockedRouteBadge}>
                      <Text style={styles.lockedRouteBadgeText}>
                        Route {item.route_number}
                      </Text>
                    </View>
                    <View style={styles.premiumBadgeContainer}>
                      <PremiumIcon />
                      <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.lockedRouteName}>{item.name}</Text>
                  
                  <View style={styles.lockedRouteStats}>
                    <Text style={styles.lockedStatText}>📏 {item.distance_km} km</Text>
                    <Text style={styles.lockedStatDivider}>•</Text>
                    <Text style={styles.lockedStatText}>⏱️ {item.estimated_duration_mins} mins</Text>
                  </View>
                </View>

                {/* Unlock Now Button */}
                <LinearGradient
                  colors={Gradients.orangeButton}
                  style={styles.unlockButton}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}>
                  <LockIcon size={18} color={Colors.textOnAccent} />
                  <Text style={styles.unlockButtonText}>UNLOCK NOW!</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          // Regular unlocked route card
          return (
            <TouchableOpacity
              style={styles.routeCard}
              onPress={() => handleRoutePress(item.id)}>
              <View style={styles.routeHeader}>
                <View style={styles.routeNumberBadge}>
                  <Text style={styles.routeNumberText}>
                    Route {item.route_number}
                  </Text>
                </View>
                <View style={styles.headerBadges}>
                  {/* Free badge for non-subscribers */}
                  {!isSubscribed && isFree && (
                    <View style={[styles.accessBadge, styles.freeBadge]}>
                      <Text style={styles.freeBadgeText}>FREE</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor:
                          getDifficultyColor(item.difficulty) + '20',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.difficultyText,
                        {color: getDifficultyColor(item.difficulty)},
                      ]}>
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
                  <Text style={styles.statValue}>
                    {item.estimated_duration_mins} mins
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statIcon}>📍</Text>
                  <Text style={styles.statValue}>
                    {item.point_count} points
                  </Text>
                </View>
              </View>

              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Route →</Text>
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
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  // Regular unlocked route card
  routeCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
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
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  routeNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textOnAccent,
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
    backgroundColor: Colors.success,
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
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
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    color: Colors.text,
  },
  viewButton: {
    backgroundColor: Colors.primaryAccent + '20',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryAccent,
  },
  // Locked route card styles
  lockedRouteCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primaryAccent + '40',
    shadowColor: Colors.primaryAccent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  lockedOverlay: {
    backgroundColor: Colors.backgroundTertiary,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryAccent + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primaryAccent + '30',
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryAccent,
    letterSpacing: 2,
    marginBottom: 8,
  },
  lockedSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  lockedRouteInfo: {
    padding: 16,
    backgroundColor: Colors.background,
  },
  lockedRouteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  lockedRouteBadge: {
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lockedRouteBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  premiumBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryAccent + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryAccent,
    letterSpacing: 0.5,
  },
  lockedRouteName: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  lockedRouteStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedStatText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  lockedStatDivider: {
    fontSize: 13,
    color: Colors.textMuted,
    marginHorizontal: 8,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  unlockButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textOnAccent,
    letterSpacing: 1,
  },
  // Loading and error states
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.textOnAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  missingRoutesLink: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  missingRoutesText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryAccent,
  },
});
