/**
 * DifficultyGauge Component
 * ==========================
 * Semicircular speedometer gauge showing blended difficulty.
 * 60% route database difficulty + 40% aggregated user ratings.
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Path, Circle, Line} from 'react-native-svg';
import {AggregatedDifficulty} from '../../services/supabase';
import {Colors, Typography, Spacing} from '../../theme';

interface DifficultyGaugeProps {
  routeDifficulty: 'easy' | 'moderate' | 'challenging';
  userRatings: AggregatedDifficulty;
}

// Layout constants
const GAUGE_WIDTH = 200;
const GAUGE_SVG_HEIGHT = 110;
const CX = 100;
const CY = 95;
const RADIUS = 75;
const ARC_STROKE = 14;
const NEEDLE_LEN = 58;

// Angle math helpers
const toRad = (deg: number) => (deg * Math.PI) / 180;

const polarToXY = (angleDeg: number, r: number = RADIUS) => ({
  x: CX + r * Math.cos(toRad(angleDeg)),
  y: CY - r * Math.sin(toRad(angleDeg)),
});

// Score (1.0–3.0) maps to angle (180°–0°)
const scoreToAngle = (score: number): number => {
  const clamped = Math.max(1, Math.min(3, score));
  return 180 - (clamped - 1) * 90;
};

const difficultyToNum = (d: string): number =>
  d === 'easy' ? 1 : d === 'moderate' ? 2 : 3;

const ratingsAverage = (r: AggregatedDifficulty): number =>
  r.total === 0
    ? 0
    : (r.easy * 1 + r.moderate * 2 + r.challenging * 3) / r.total;

// Arc segment endpoints
const P180 = polarToXY(180);
const P120 = polarToXY(120);
const P60 = polarToXY(60);
const P0 = polarToXY(0);

// Arc path for a segment
const arcPath = (
  start: {x: number; y: number},
  end: {x: number; y: number},
) => `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`;

export function DifficultyGauge({
  routeDifficulty,
  userRatings,
}: DifficultyGaugeProps) {
  const dbScore = difficultyToNum(routeDifficulty);
  const userScore = ratingsAverage(userRatings);

  // Blend: 60% database, 40% user (when ratings exist)
  const blended =
    userRatings.total > 0 ? dbScore * 0.6 + userScore * 0.4 : dbScore;

  const needleAngle = scoreToAngle(blended);
  const needleEnd = polarToXY(needleAngle, NEEDLE_LEN);

  const label =
    blended <= 1.5 ? 'Easy' : blended <= 2.5 ? 'Moderate' : 'Hard';
  const labelColor =
    blended <= 1.5
      ? Colors.success
      : blended <= 2.5
        ? Colors.warning
        : Colors.error;

  return (
    <View style={styles.container}>
      <Svg
        width={GAUGE_WIDTH}
        height={GAUGE_SVG_HEIGHT}
        viewBox={`0 0 ${GAUGE_WIDTH} ${GAUGE_SVG_HEIGHT}`}>
        {/* Green segment (easy): 180° → 120° */}
        <Path
          d={arcPath(P180, P120)}
          stroke={Colors.success}
          strokeWidth={ARC_STROKE}
          strokeLinecap="round"
          fill="none"
        />

        {/* Yellow segment (moderate): 120° → 60° */}
        <Path
          d={arcPath(P120, P60)}
          stroke={Colors.warning}
          strokeWidth={ARC_STROKE}
          fill="none"
        />

        {/* Red segment (challenging): 60° → 0° */}
        <Path
          d={arcPath(P60, P0)}
          stroke={Colors.error}
          strokeWidth={ARC_STROKE}
          strokeLinecap="round"
          fill="none"
        />

        {/* Needle */}
        <Line
          x1={CX}
          y1={CY}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={Colors.text}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Center pivot */}
        <Circle cx={CX} cy={CY} r={5} fill={Colors.text} />
      </Svg>

      {/* Bottom labels */}
      <View style={styles.labelsRow}>
        <Text style={[styles.endLabel, {color: Colors.success}]}>Easy</Text>
        <Text style={[styles.centerLabel, {color: labelColor}]}>{label}</Text>
        <Text style={[styles.endLabel, {color: Colors.error}]}>Hard</Text>
      </View>

      {/* Rating count */}
      {userRatings.total > 0 && (
        <Text style={styles.ratingsCount}>
          Based on {userRatings.total} rating
          {userRatings.total !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: GAUGE_WIDTH,
    paddingHorizontal: Spacing.xs,
    marginTop: -Spacing.xs,
  },
  endLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  ratingsCount: {
    ...Typography.bodySecondary,
    fontSize: 11,
    marginTop: Spacing.xs,
  },
});
