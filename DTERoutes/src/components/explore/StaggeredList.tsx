/**
 * StaggeredList Components
 * =========================
 * Wrapper for staggered entrance animations
 */

import React, {useEffect} from 'react';
import {ViewStyle} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Durations} from '../../theme';

interface StaggeredItemProps {
  children: React.ReactNode;
  index: number;
  style?: ViewStyle;
  delay?: number;
}

/**
 * Individual animated item for staggered list
 * Slides up and fades in with a delay based on index
 */
export function StaggeredItem({
  children,
  index,
  style,
  delay = 80,
}: StaggeredItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    const staggerDelay = index * delay;

    opacity.value = withDelay(
      staggerDelay,
      withTiming(1, {duration: Durations.entrance}),
    );
    translateY.value = withDelay(
      staggerDelay,
      withSpring(0, {
        damping: 15,
        stiffness: 100,
      }),
    );
  }, [index, delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{translateY: translateY.value}],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

interface StaggeredHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Header component that fades in before list items
 */
export function StaggeredHeader({children, style}: StaggeredHeaderProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-10);

  useEffect(() => {
    opacity.value = withTiming(1, {duration: Durations.normal});
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{translateY: translateY.value}],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
