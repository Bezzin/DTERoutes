/**
 * Route Progression Screen
 * ========================
 * Premium game-like progression map with winding road
 * Shows routes as checkpoints on a path from bottom to top
 */

import React, {useEffect, useRef, useCallback, useState, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useRoutesStore} from '../store/useRoutesStore';
import {useSubscriptionStore} from '../store/useSubscriptionStore';
import {Route} from '../services/supabase';
import {RouteBottomSheet} from '../components/route-details';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';
import {
  TopographicBackground,
  WindingRoad,
  ProgressionNode,
  ProgressionHeader,
  calculateNodePositions,
  calculateContentHeight,
  RouteStatus,
} from '../components/progression';
import {RouteRequestCard} from '../components/RouteRequestCard';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export default function RouteProgressionScreen({navigation, route: navRoute}: any) {
  const {testCenterId, testCenterName} = navRoute.params;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const {
    routes,
    isLoading,
    error,
    fetchByTestCenter,
    loadCompletedRoutes,
    isRouteCompleted,
    getCompletedCount,
  } = useRoutesStore();
  const {isSubscribed} = useSubscriptionStore();

  // Fetch routes and load completion data on mount
  useEffect(() => {
    fetchByTestCenter(testCenterId);
    loadCompletedRoutes();
  }, [testCenterId, fetchByTestCenter, loadCompletedRoutes]);

  // Calculate node positions based on route count
  const nodePositions = useMemo(
    () => calculateNodePositions(routes.length),
    [routes.length],
  );

  // Calculate content height for scroll view
  const contentHeight = useMemo(
    () => Math.max(calculateContentHeight(routes.length), SCREEN_HEIGHT),
    [routes.length],
  );

  // Scroll to bottom (Route 1) on initial load
  useEffect(() => {
    if (routes.length > 0 && scrollViewRef.current) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({animated: false});
      }, 100);
    }
  }, [routes.length]);

  // Determine route status
  const getRouteStatus = useCallback(
    (route: Route, index: number): RouteStatus => {
      // Check if route is completed
      if (isRouteCompleted(testCenterId, route.id)) {
        return 'completed';
      }

      // First route is always unlocked (active)
      if (index === 0) {
        return 'active';
      }

      // Subscribers get all routes unlocked
      if (isSubscribed) {
        return 'active';
      }

      // All other routes are locked for free users
      return 'locked';
    },
    [isSubscribed, isRouteCompleted, testCenterId],
  );

  // Handle route press
  const handleRoutePress = useCallback(
    (route: Route, index: number) => {
      const status = getRouteStatus(route, index);

      if (status === 'locked') {
        navigation.navigate('Paywall');
        return;
      }

      // Both completed and active routes can be tapped to show details
      setSelectedRoute(route);
      bottomSheetRef.current?.expand();
    },
    [getRouteStatus, navigation],
  );

  // Handle start navigation
  const handleStartNavigation = useCallback(
    (route: Route) => {
      bottomSheetRef.current?.close();
      navigation.navigate('Navigation', {
        routeId: route.id,
        testCenterId: testCenterId,
      });
    },
    [navigation, testCenterId],
  );

  // Handle bottom sheet close
  const handleSheetClose = useCallback(() => {
    setSelectedRoute(null);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Get completed count
  const completedCount = getCompletedCount(testCenterId);

  // Loading state
  if (isLoading && routes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryAccent} />
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchByTestCenter(testCenterId)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <View style={styles.container}>
        {/* Header - positioned absolutely over the map */}
        <ProgressionHeader
          testCentreName={testCenterName}
          completedCount={completedCount}
          totalCount={routes.length}
          onBack={handleBack}
        />

        {/* Scrollable Map Container */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {height: contentHeight},
          ]}
          showsVerticalScrollIndicator={false}>
          {/* Background Layer */}
          <TopographicBackground height={contentHeight} />

          {/* Road Layer */}
          <WindingRoad nodeCount={routes.length} height={contentHeight} />

          {/* Route Nodes */}
          {routes.map((route, index) => (
            <ProgressionNode
              key={route.id}
              route={route}
              status={getRouteStatus(route, index)}
              position={nodePositions[index]}
              index={index}
              labelSide={index % 2 === 0 ? 'left' : 'right'}
              onPress={() => handleRoutePress(route, index)}
            />
          ))}
        </ScrollView>

        {/* Route Request Card for centres with limited routes */}
        {routes.length <= 2 && routes.length > 0 && (
          <View style={styles.requestCardContainer}>
            <RouteRequestCard
              testCenterId={testCenterId}
              testCenterName={testCenterName}
              routeCount={routes.length}
            />
          </View>
        )}

        {/* Route Details Bottom Sheet */}
        <RouteBottomSheet
          ref={bottomSheetRef}
          route={selectedRoute}
          onStartNavigation={handleStartNavigation}
          onClose={handleSheetClose}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    minHeight: SCREEN_HEIGHT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodySecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.textOnAccent,
  },
  requestCardContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
});
