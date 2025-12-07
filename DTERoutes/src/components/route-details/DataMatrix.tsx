/**
 * DataMatrix Component
 * =====================
 * 3-column stats grid for route details (Duration, Distance, Pass Rate)
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {Colors, Typography, Spacing} from '../../theme';

interface DataMatrixProps {
  durationMins: number;
  distanceKm: number;
  passRate?: number;
  difficulty?: 'easy' | 'moderate' | 'challenging';
}

// Clock icon
function ClockIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke={Colors.textSecondary}
        strokeWidth={2}
      />
      <Path
        d="M12 6V12L16 14"
        stroke={Colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Road icon
function RoadIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19L8 5M16 19L20 5M12 5V19M9 5H15M8 19H16"
        stroke={Colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Trophy/Star icon
function TrophyIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        stroke={Colors.primaryAccent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Difficulty badge icon
function DifficultyIcon({difficulty}: {difficulty: string}) {
  const color =
    difficulty === 'easy'
      ? Colors.success
      : difficulty === 'moderate'
      ? Colors.warning
      : Colors.error;

  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke={color}
        strokeWidth={2}
        fill={`${color}33`}
      />
      <Path
        d="M12 8V12M12 16H12.01"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function DataMatrix({
  durationMins,
  distanceKm,
  passRate,
  difficulty,
}: DataMatrixProps) {
  // Format duration
  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hour`;
  };

  // Format distance
  const formatDistance = (km: number) => {
    const miles = km * 0.621371;
    return `${miles.toFixed(1)} mi`;
  };

  // Determine third column content
  const hasPassRate = passRate !== undefined && passRate > 0;
  const hasDifficulty = difficulty !== undefined;

  return (
    <View style={styles.container}>
      {/* Duration */}
      <View style={styles.statBlock}>
        <ClockIcon />
        <Text style={styles.statValue}>{formatDuration(durationMins)}</Text>
        <Text style={styles.statLabel}>Avg. Time</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Distance */}
      <View style={styles.statBlock}>
        <RoadIcon />
        <Text style={styles.statValue}>{formatDistance(distanceKm)}</Text>
        <Text style={styles.statLabel}>Distance</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Pass Rate or Difficulty */}
      <View style={styles.statBlock}>
        {hasPassRate ? (
          <>
            <TrophyIcon />
            <Text style={styles.statValueHighlight}>{passRate}%</Text>
            <Text style={styles.statLabel}>Pass Rate</Text>
          </>
        ) : hasDifficulty ? (
          <>
            <DifficultyIcon difficulty={difficulty} />
            <Text
              style={[
                styles.statValue,
                difficulty === 'easy' && {color: Colors.success},
                difficulty === 'moderate' && {color: Colors.warning},
                difficulty === 'challenging' && {color: Colors.error},
              ]}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Text>
            <Text style={styles.statLabel}>Difficulty</Text>
          </>
        ) : (
          <>
            <TrophyIcon />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Pass Rate</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...Typography.h4,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  statValueHighlight: {
    ...Typography.h4,
    color: Colors.primaryAccent,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
  },
});
