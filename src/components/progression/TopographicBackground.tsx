/**
 * TopographicBackground
 * =====================
 * Subtle contour line background for the progression map
 * Creates a premium "map" aesthetic
 */

import React, {useMemo} from 'react';
import {StyleSheet, Dimensions} from 'react-native';
import Svg, {Path, Defs, LinearGradient, Stop} from 'react-native-svg';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface TopographicBackgroundProps {
  height: number;
}

export function TopographicBackground({height}: TopographicBackgroundProps) {
  // Generate curved contour lines
  const contourLines = useMemo(() => {
    const lines: string[] = [];
    const lineSpacing = 80; // Space between contour lines
    const numLines = Math.ceil(height / lineSpacing) + 2;

    for (let i = 0; i < numLines; i++) {
      const y = i * lineSpacing;
      // Create wavy line with different amplitudes for variety
      const amplitude = 15 + (i % 3) * 10;
      const frequency = 0.008 + (i % 2) * 0.002;
      const phase = (i * Math.PI) / 4;

      let path = `M 0 ${y}`;
      for (let x = 0; x <= SCREEN_WIDTH; x += 10) {
        const yOffset = Math.sin(x * frequency + phase) * amplitude;
        path += ` L ${x} ${y + yOffset}`;
      }
      lines.push(path);
    }
    return lines;
  }, [height]);

  return (
    <Svg
      width={SCREEN_WIDTH}
      height={height}
      style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0A0A0A" />
          <Stop offset="50%" stopColor="#121212" />
          <Stop offset="100%" stopColor="#1A1A1A" />
        </LinearGradient>
      </Defs>

      {/* Background gradient */}
      <Path
        d={`M 0 0 L ${SCREEN_WIDTH} 0 L ${SCREEN_WIDTH} ${height} L 0 ${height} Z`}
        fill="url(#bgGradient)"
      />

      {/* Contour lines */}
      {contourLines.map((path, index) => (
        <Path
          key={index}
          d={path}
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth={1}
          fill="none"
        />
      ))}
    </Svg>
  );
}

export default TopographicBackground;
