/**
 * DarkCard Component
 * ===================
 * Reusable card component with dark charcoal background
 */

import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {Colors, Shadows, BorderRadius, Spacing} from '../../theme';

interface DarkCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
}

export function DarkCard({
  children,
  style,
  elevated = true,
  noPadding = false,
}: DarkCardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && Shadows.card,
        noPadding && styles.noPadding,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noPadding: {
    padding: 0,
  },
});
