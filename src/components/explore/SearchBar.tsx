/**
 * SearchBar Component
 * ====================
 * Search input with orange glow effect for the Explore screen
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, {Path} from 'react-native-svg';
import {Colors, BorderRadius, Layout, Spacing, Typography, Durations} from '../../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

// Search icon component
function SearchIcon({color}: {color: string}) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Clear icon component
function ClearIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={Colors.textMuted}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search by city or postcode...',
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, {duration: Durations.normal});
  }, [focusProgress]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, {duration: Durations.normal});
  }, [focusProgress]);

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [Colors.border, Colors.primaryAccent],
    );

    return {
      borderColor,
      shadowColor: Colors.primaryAccent,
      shadowOpacity: focusProgress.value * 0.5,
      shadowRadius: focusProgress.value * 16,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <View style={styles.iconContainer}>
        <SearchIcon color={isFocused ? Colors.primaryAccent : Colors.textMuted} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selectionColor={Colors.primaryAccent}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <ClearIcon />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    height: Layout.inputHeight,
    paddingHorizontal: Spacing.md,
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
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
