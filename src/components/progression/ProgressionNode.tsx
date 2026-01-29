/**
 * ProgressionNode
 * ===============
 * Individual checkpoint node on the progression map
 * Displays route number with different states: completed, active, locked
 */

import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import {Route} from '../../services/supabase';
import {Colors, Typography} from '../../theme';
import {NodePosition} from './WindingRoad';
import CarAvatar from './CarAvatar';
import CheckBadge from './CheckBadge';
import LockIcon from './LockIcon';

export type RouteStatus = 'completed' | 'active' | 'locked';

interface ProgressionNodeProps {
  route: Route;
  status: RouteStatus;
  position: NodePosition;
  index: number;
  labelSide: 'left' | 'right';
  onPress: () => void;
}

const NODE_SIZE = 65;
const GLOW_SIZE = 90;

export function ProgressionNode({
  route,
  status,
  position,
  index,
  labelSide,
  onPress,
}: ProgressionNodeProps) {
  // Glow animation for active node
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (status === 'active') {
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.15, {duration: 1200, easing: Easing.inOut(Easing.ease)}),
          withTiming(1, {duration: 1200, easing: Easing.inOut(Easing.ease)}),
        ),
        -1,
        true,
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, {duration: 1200, easing: Easing.inOut(Easing.ease)}),
          withTiming(0.4, {duration: 1200, easing: Easing.inOut(Easing.ease)}),
        ),
        -1,
        true,
      );
    }
  }, [status, glowScale, glowOpacity]);

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: glowScale.value}],
    opacity: glowOpacity.value,
  }));

  const isLocked = status === 'locked';
  const isActive = status === 'active';
  const isCompleted = status === 'completed';

  return (
    <Animated.View
      entering={FadeIn.delay(index * 80).duration(400)}
      style={[
        styles.container,
        {
          left: position.x - NODE_SIZE / 2,
          top: position.y - NODE_SIZE / 2,
        },
      ]}>
      {/* Orange glow ring for active node */}
      {isActive && (
        <Animated.View style={[styles.glowRing, glowAnimatedStyle]} />
      )}

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={isLocked ? 0.6 : 0.8}
        style={styles.touchable}>
        <View
          style={[
            styles.node,
            isLocked && styles.nodeLocked,
          ]}>
          {isLocked ? (
            <LockIcon size={28} color={Colors.primaryAccent} />
          ) : (
            <Text style={styles.routeNumber}>{route.route_number}</Text>
          )}

          {/* Car avatar sits on top of active node */}
          {isActive && (
            <View style={styles.carContainer}>
              <CarAvatar />
            </View>
          )}

          {/* Green checkmark badge for completed */}
          {isCompleted && (
            <View style={styles.badgeContainer}>
              <CheckBadge />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Route label */}
      <View
        style={[
          styles.labelContainer,
          labelSide === 'left' ? styles.labelLeft : styles.labelRight,
        ]}>
        <Text
          style={[styles.label, isLocked && styles.labelLocked]}
          numberOfLines={1}>
          Route {route.route_number}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: Colors.primaryAccent,
    shadowColor: Colors.primaryAccent,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  touchable: {
    width: NODE_SIZE,
    height: NODE_SIZE,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: '#333333',
    borderWidth: 3,
    borderColor: '#444444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeLocked: {
    opacity: 0.7,
    borderColor: 'rgba(255, 87, 34, 0.4)',
  },
  routeNumber: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  carContainer: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  labelContainer: {
    position: 'absolute',
    top: NODE_SIZE / 2 - 10,
    width: 100,
  },
  labelLeft: {
    right: NODE_SIZE + 15,
    alignItems: 'flex-end',
  },
  labelRight: {
    left: NODE_SIZE + 15,
    alignItems: 'flex-start',
  },
  label: {
    ...Typography.bodySecondary,
    color: Colors.text,
    fontWeight: '600',
  },
  labelLocked: {
    color: Colors.textMuted,
  },
});

export default ProgressionNode;
