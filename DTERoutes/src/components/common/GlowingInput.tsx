/**
 * GlowingInput Component
 * =======================
 * Search/text input with orange glow effect on focus
 */

import React, {useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, {Path} from 'react-native-svg';
import {Colors, BorderRadius, Layout, Spacing, Typography, Durations} from '../../theme';

interface GlowingInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  showSearchIcon?: boolean;
}

// Search icon SVG
function SearchIcon({color}: {color: string}) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GlowingInput({
  containerStyle,
  showSearchIcon = true,
  placeholder = 'Search...',
  ...props
}: GlowingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, {duration: Durations.normal});
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, {duration: Durations.normal});
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [Colors.border, Colors.primaryAccent],
    );

    return {
      borderColor,
      // Glow effect using shadow
      shadowColor: Colors.primaryAccent,
      shadowOpacity: focusProgress.value * 0.4,
      shadowRadius: focusProgress.value * 12,
    };
  });

  return (
    <Animated.View
      style={[styles.container, animatedContainerStyle, containerStyle]}>
      {showSearchIcon && (
        <View style={styles.iconContainer}>
          <SearchIcon color={isFocused ? Colors.primaryAccent : Colors.textMuted} />
        </View>
      )}
      <TextInput
        {...props}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, showSearchIcon && styles.inputWithIcon, props.style]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selectionColor={Colors.primaryAccent}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    height: Layout.inputHeight,
    paddingHorizontal: Layout.inputPaddingHorizontal,
    // Shadow defaults
    shadowOffset: {width: 0, height: 0},
    elevation: 0,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    padding: 0,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
});
