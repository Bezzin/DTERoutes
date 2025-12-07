/**
 * OrangeButton Component
 * =======================
 * Primary CTA button with orange gradient and press animation
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {Colors, Gradients, Shadows, Typography, BorderRadius, Layout} from '../../theme';

interface OrangeButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'default' | 'small';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function OrangeButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'default',
  fullWidth = true,
  style,
  textStyle,
  icon,
}: OrangeButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, {damping: 15, stiffness: 400});
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {damping: 15, stiffness: 400});
  };

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
        style={[
          animatedStyle,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}>
        <LinearGradient
          colors={isDisabled ? ['#666', '#555', '#444'] : Gradients.orangeButton}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[
            styles.button,
            size === 'small' && styles.buttonSmall,
            !isDisabled && Shadows.button,
          ]}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.text,
                  size === 'small' && styles.textSmall,
                  textStyle,
                ]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  if (variant === 'outline') {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          animatedStyle,
          styles.outlineButton,
          size === 'small' && styles.buttonSmall,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primaryAccent} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.outlineText,
                size === 'small' && styles.textSmall,
                textStyle,
              ]}>
              {title}
            </Text>
          </>
        )}
      </AnimatedTouchable>
    );
  }

  // Ghost variant
  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        animatedStyle,
        styles.ghostButton,
        size === 'small' && styles.buttonSmall,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primaryAccent} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.ghostText,
              size === 'small' && styles.textSmall,
              textStyle,
            ]}>
            {title}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonSmall: {
    height: Layout.buttonHeightSmall,
    paddingHorizontal: 16,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    ...Typography.button,
    color: Colors.textOnAccent,
  },
  textSmall: {
    ...Typography.buttonSmall,
  },
  outlineButton: {
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.primaryAccent,
    backgroundColor: 'transparent',
  },
  outlineText: {
    ...Typography.button,
    color: Colors.primaryAccent,
  },
  ghostButton: {
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    backgroundColor: 'transparent',
  },
  ghostText: {
    ...Typography.button,
    color: Colors.primaryAccent,
  },
  disabled: {
    opacity: 0.5,
  },
});
