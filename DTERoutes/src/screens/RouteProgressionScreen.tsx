/**
 * Route Progression Screen (Saga Map)
 * =====================================
 * Gamified route progression with road/roundabout metaphor
 * Dark mode with orange accents
 */

import React, {useEffect, useRef, useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Rect} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import BottomSheet from '@gorhom/bottom-sheet';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useRoutesStore} from '../store/useRoutesStore';
import {useSubscriptionStore} from '../store/useSubscriptionStore';
import {Route} from '../services/supabase';
import {RouteBottomSheet} from '../components/route-details';
import {Colors, Typography, Spacing, BorderRadius, Gradients} from '../theme';

const {width} = Dimensions.get('window');

// Status types for routes
type RouteStatus = 'completed' | 'active' | 'locked';

// Back arrow icon
function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19L5 12L12 5"
        stroke={Colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Heart icon for lives
function HeartIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={Colors.error}>
      <Path
        d="M20.84 4.61C20.3292 4.099 19.7228 3.69365 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69365 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22249 22.4518 8.5C22.4518 7.77751 22.3095 7.0621 22.0329 6.39464C21.7563 5.72718 21.351 5.12075 20.84 4.61Z"
        stroke={Colors.error}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Car avatar SVG
function CarAvatar() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40">
      <Defs>
        <SvgGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={Colors.primaryAccent} />
          <Stop offset="100%" stopColor={Colors.primaryAccentDark} />
        </SvgGradient>
      </Defs>
      {/* Car body */}
      <Path
        d="M8 28 L8 18 L12 12 L28 12 L32 18 L32 28 L8 28"
        fill="url(#carGradient)"
        stroke={Colors.text}
        strokeWidth={1.5}
      />
      {/* Windshield */}
      <Path
        d="M12 18 L14 14 L26 14 L28 18"
        fill={Colors.backgroundSecondary}
        stroke={Colors.text}
        strokeWidth={1}
      />
      {/* Wheels */}
      <Circle cx={14} cy={28} r={4} fill={Colors.backgroundTertiary} stroke={Colors.text} strokeWidth={1} />
      <Circle cx={26} cy={28} r={4} fill={Colors.backgroundTertiary} stroke={Colors.text} strokeWidth={1} />
    </Svg>
  );
}

// Checkmark icon for completed
function CheckIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={Colors.text}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Lock icon
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

// Roundabout Node Component
interface RoundaboutNodeProps {
  route: Route;
  index: number;
  status: RouteStatus;
  isFirst: boolean;
  onPress: () => void;
}

function RoundaboutNode({route, index, status, isFirst, onPress}: RoundaboutNodeProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (status === 'active') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, {duration: 1000, easing: Easing.inOut(Easing.ease)}),
          withTiming(1, {duration: 1000, easing: Easing.inOut(Easing.ease)}),
        ),
        -1,
        true,
      );
    }
  }, [status, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: status === 'active' ? pulse.value : 1}],
  }));

  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  return (
    <Animated.View
      entering={FadeIn.delay(index * 100)}
      style={styles.nodeContainer}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isLocked}
        activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.roundabout,
            isCompleted && styles.roundaboutCompleted,
            isActive && styles.roundaboutActive,
            isLocked && styles.roundaboutLocked,
            isActive && styles.roundaboutGlow,
            animatedStyle,
          ]}>
          {/* Roundabout number */}
          <Text style={[styles.roundaboutNumber, isLocked && styles.textLocked]}>
            {route.route_number}
          </Text>

          {/* Status indicator */}
          {isCompleted && (
            <View style={styles.checkBadge}>
              <CheckIcon />
            </View>
          )}
          {isLocked && (
            <View style={styles.lockBadge}>
              <LockIcon size={32} color={Colors.primaryAccent} />
            </View>
          )}
        </Animated.View>

        {/* Car avatar on active node */}
        {isActive && (
          <Animated.View style={styles.carContainer}>
            <CarAvatar />
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Route name */}
      <Text style={[styles.routeName, isLocked && styles.textLocked]} numberOfLines={2}>
        {route.name}
      </Text>

      {/* Unlock Now button for locked routes */}
      {isLocked && (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={styles.unlockButtonContainer}>
          <LinearGradient
            colors={Gradients.orangeButton}
            style={styles.unlockButton}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <LockIcon size={16} color={Colors.textOnAccent} />
            <Text style={styles.unlockButtonText}>UNLOCK NOW!</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// Road segment between nodes
function RoadSegment({isLast}: {isLast: boolean}) {
  if (isLast) return null;

  return (
    <View style={styles.roadSegment}>
      <View style={styles.roadSurface}>
        {/* Dashed center line */}
        {Array.from({length: 5}).map((_, i) => (
          <View key={i} style={styles.dashLine} />
        ))}
      </View>
    </View>
  );
}

// Main Screen Component
export default function RouteProgressionScreen({navigation, route: navRoute}: any) {
  const {testCenterId, testCenterName} = navRoute.params;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const {routes, isLoading, error, fetchByTestCenter} = useRoutesStore();
  const {isSubscribed} = useSubscriptionStore();

  // Fetch routes on mount
  useEffect(() => {
    fetchByTestCenter(testCenterId);
  }, [testCenterId, fetchByTestCenter]);

  // Determine route status - first route free, rest locked unless subscribed
  const getRouteStatus = useCallback(
    (route: Route, index: number): RouteStatus => {
      // First route is always free/active
      if (index === 0) return 'active';

      // Check subscription - subscribers get all routes
      if (isSubscribed) return 'active';

      // All other routes are locked for free users
      return 'locked';
    },
    [isSubscribed],
  );

  // Handle route press - check if locked and show paywall
  const handleRoutePress = useCallback((route: Route, index: number) => {
    const status = getRouteStatus(route, index);
    
    if (status === 'locked') {
      // Route is locked - show paywall
      navigation.navigate('Paywall');
      return;
    }
    
    // Route is accessible - show bottom sheet
    setSelectedRoute(route);
    bottomSheetRef.current?.expand();
  }, [getRouteStatus, navigation]);

  // Handle start navigation - go directly to navigation screen
  const handleStartNavigation = useCallback(
    (route: Route) => {
      bottomSheetRef.current?.close();
      navigation.navigate('Navigation', {routeId: route.id});
    },
    [navigation],
  );

  // Handle bottom sheet close
  const handleSheetClose = useCallback(() => {
    setSelectedRoute(null);
  }, []);

  // Find active route index
  const activeRouteIndex = routes.findIndex(
    (r, i) => getRouteStatus(r, i) === 'active',
  );

  // Loading state
  if (isLoading && routes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryAccent} />
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchByTestCenter(testCenterId)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Sticky Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <BackIcon />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {testCenterName}
            </Text>
            <Text style={styles.headerSubtitle}>
              Route {activeRouteIndex + 1} of {routes.length}
            </Text>
          </View>
          <View style={styles.livesContainer}>
            <HeartIcon />
            <Text style={styles.livesText}>3</Text>
          </View>
        </View>

        {/* Scrollable Road Map */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.roadContainer}>
            {routes.map((route, index) => (
              <React.Fragment key={route.id}>
                <RoundaboutNode
                  route={route}
                  index={index}
                  status={getRouteStatus(route, index)}
                  isFirst={index === 0}
                  onPress={() => handleRoutePress(route, index)}
                />
                <RoadSegment isLast={index === routes.length - 1} />
              </React.Fragment>
            ))}
          </View>
        </ScrollView>

        {/* Route Details Bottom Sheet */}
        <RouteBottomSheet
          ref={bottomSheetRef}
          route={selectedRoute}
          onStartNavigation={handleStartNavigation}
          onClose={handleSheetClose}
        />
      </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h4,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  livesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  livesText: {
    ...Typography.button,
    color: Colors.error,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  roadContainer: {
    width: width * 0.7,
    alignItems: 'center',
  },
  nodeContainer: {
    alignItems: 'center',
    width: '100%',
  },
  roundabout: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.road,
    borderWidth: 4,
    borderColor: Colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundaboutCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.successLight,
  },
  roundaboutActive: {
    backgroundColor: Colors.primaryAccent,
    borderColor: Colors.primaryAccentLight,
  },
  roundaboutLocked: {
    backgroundColor: Colors.backgroundTertiary,
    borderColor: Colors.primaryAccent + '60',
    borderWidth: 3,
    opacity: 0.8,
  },
  roundaboutGlow: {
    shadowColor: Colors.primaryAccent,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  roundaboutNumber: {
    ...Typography.routeNumber,
    color: Colors.text,
  },
  textLocked: {
    color: Colors.textMuted,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
  },
  carContainer: {
    position: 'absolute',
    top: -25,
    left: '50%',
    marginLeft: -20,
  },
  routeName: {
    ...Typography.routeName,
    marginTop: Spacing.sm,
    maxWidth: 150,
  },
  unlockButtonContainer: {
    marginTop: Spacing.md,
    width: 180,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: Colors.primaryAccent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  unlockButtonText: {
    ...Typography.button,
    color: Colors.textOnAccent,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 14,
  },
  roadSegment: {
    width: 60,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadSurface: {
    width: 40,
    height: '100%',
    backgroundColor: Colors.road,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 8,
  },
  dashLine: {
    width: 4,
    height: 10,
    backgroundColor: Colors.roadMarking,
    borderRadius: 2,
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
});
