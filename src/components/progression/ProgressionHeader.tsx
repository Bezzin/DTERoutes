/**
 * ProgressionHeader
 * =================
 * Header component for the progression screen
 * Shows test centre name and progress count
 */

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import {Colors, Typography, Spacing} from '../../theme';

interface ProgressionHeaderProps {
  testCentreName: string;
  completedCount: number;
  totalCount: number;
  onBack: () => void;
}

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

export function ProgressionHeader({
  testCentreName,
  completedCount,
  totalCount,
  onBack,
}: ProgressionHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {paddingTop: insets.top + Spacing.sm}]}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <BackIcon />
      </TouchableOpacity>

      <View style={styles.centerContent}>
        <Text style={styles.title} numberOfLines={1}>
          {testCentreName}
        </Text>
        <Text style={styles.subtitle}>
          {completedCount}/{totalCount} Routes Mastered
        </Text>
      </View>

      {/* Spacer to balance the back button */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  spacer: {
    width: 40,
  },
});

export default ProgressionHeader;
