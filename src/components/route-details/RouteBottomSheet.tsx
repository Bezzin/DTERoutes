/**
 * RouteBottomSheet Component
 * ===========================
 * Slide-up bottom sheet for route details
 */

import React, {useCallback, useMemo, useState, useEffect, forwardRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import Svg, {Path} from 'react-native-svg';
import {Route, AggregatedDifficulty, fetchRouteDifficultyRatings} from '../../services/supabase';
import {DataMatrix} from './DataMatrix';
import {DifficultyGauge} from './DifficultyGauge';
import {OrangeButton} from '../common';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '../../theme';

interface RouteBottomSheetProps {
  route: Route | null;
  onStartNavigation: (route: Route) => void;
  onClose: () => void;
}

// Close icon
function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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


const EMPTY_RATINGS: AggregatedDifficulty = {easy: 0, moderate: 0, challenging: 0, total: 0};

export const RouteBottomSheet = forwardRef<BottomSheet, RouteBottomSheetProps>(
  ({route, onStartNavigation, onClose}, ref) => {
    const [userRatings, setUserRatings] = useState<AggregatedDifficulty>(EMPTY_RATINGS);

    // Fetch user difficulty ratings when route changes
    useEffect(() => {
      if (route) {
        fetchRouteDifficultyRatings(route.id).then(setUserRatings);
      } else {
        setUserRatings(EMPTY_RATINGS);
      }
    }, [route?.id]);

    // Snap points
    const snapPoints = useMemo(() => ['70%'], []);

    // Backdrop component
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.7}
        />
      ),
      [],
    );

    // Handle start navigation
    const handleStartNavigation = useCallback(() => {
      if (route) {
        onStartNavigation(route);
      }
    }, [route, onStartNavigation]);

    if (!route) return null;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        onClose={onClose}>
        <BottomSheetView style={styles.container}>
          {/* Title Row */}
          <View style={styles.titleRow}>
            <View style={styles.titleContent}>
              <Text style={styles.title} numberOfLines={2}>
                Route {route.route_number}: {route.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          {/* Stats Matrix */}
          <View style={styles.statsContainer}>
            <DataMatrix
              durationMins={route.estimated_duration_mins}
              distanceKm={route.distance_km}
              difficulty={route.difficulty}
            />
          </View>

          {/* Difficulty Gauge */}
          <View style={styles.gaugeContainer}>
            <DifficultyGauge
              routeDifficulty={route.difficulty}
              userRatings={userRatings}
            />
          </View>

          {/* CTA Button */}
          <View style={styles.ctaContainer}>
            <OrangeButton
              title="START NAVIGATION"
              onPress={handleStartNavigation}
              fullWidth
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
  },
  handleIndicator: {
    backgroundColor: Colors.grabHandle,
    width: 40,
    height: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.h3,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  statsContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  ctaContainer: {
    marginTop: 'auto',
    paddingBottom: Spacing.xxl + 20,
  },
});
