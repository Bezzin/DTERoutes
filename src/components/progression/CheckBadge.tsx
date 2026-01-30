/**
 * CheckBadge
 * ==========
 * Green checkmark badge for completed routes
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {Colors} from '../../theme';

interface CheckBadgeProps {
  size?: number;
}

export function CheckBadge({size = 24}: CheckBadgeProps) {
  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* Green circle background */}
        <Circle cx={12} cy={12} r={11} fill={Colors.success} />

        {/* White checkmark */}
        <Path
          d="M7 12.5L10.5 16L17 9"
          stroke={Colors.text}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: Colors.success,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default CheckBadge;
