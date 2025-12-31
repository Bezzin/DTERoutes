/**
 * Speed Limit Display Component
 * ==============================
 * Shows current speed limit and warns when exceeding
 * Uses UK-style speed limit sign design
 */

import React, {useEffect, useState, useRef} from 'react';
import {StyleSheet, View, Text, Animated} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

interface SpeedLimitDisplayProps {
  currentSpeedLimit?: number; // Speed limit in km/h (or mph depending on unit)
  unit?: 'km/h' | 'mph';
  warningThreshold?: number; // Percentage over limit to trigger warning (default 5%)
  onSpeedUpdate?: (speed: number, isOverLimit: boolean) => void;
}

export default function SpeedLimitDisplay({
  currentSpeedLimit,
  unit = 'mph', // UK uses mph
  warningThreshold = 5,
  onSpeedUpdate,
}: SpeedLimitDisplayProps) {
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const watchId = useRef<number | null>(null);

  // Convert speed limit to display value (UK uses mph)
  const displaySpeedLimit = currentSpeedLimit
    ? unit === 'mph'
      ? Math.round(currentSpeedLimit * 0.621371) // km/h to mph
      : currentSpeedLimit
    : null;

  // Start watching GPS speed
  // Note: Permission is handled by NavigationScreen before this component mounts
  useEffect(() => {
    watchId.current = Geolocation.watchPosition(
      position => {
        // Speed from GPS is in m/s
        const speedMs = position.coords.speed || 0;
        // Convert to km/h or mph based on unit
        const speedDisplay =
          unit === 'mph'
            ? speedMs * 2.23694 // m/s to mph
            : speedMs * 3.6; // m/s to km/h

        setCurrentSpeed(Math.round(speedDisplay));

        // Check if over limit
        if (displaySpeedLimit && speedDisplay > 0) {
          const limitWithThreshold =
            displaySpeedLimit * (1 + warningThreshold / 100);
          const over = speedDisplay > limitWithThreshold;
          setIsOverLimit(over);
          onSpeedUpdate?.(speedDisplay, over);
        }
      },
      error => {
        console.log('GPS Error:', error.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 5, // Update every 5 meters
        interval: 1000, // Update every second
        fastestInterval: 500,
      },
    );

    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, [displaySpeedLimit, unit, warningThreshold, onSpeedUpdate]);

  // Pulse animation when over limit
  useEffect(() => {
    if (isOverLimit) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOverLimit, pulseAnim]);

  // Don't render if no speed limit data
  if (!displaySpeedLimit) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>--</Text>
          <Text style={styles.unitText}>{unit}</Text>
        </View>
        <View style={styles.currentSpeedContainer}>
          <Text style={styles.currentSpeedLabel}>Your speed</Text>
          <Text style={styles.currentSpeedValue}>{currentSpeed}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* UK-style speed limit sign */}
      <Animated.View
        style={[
          styles.speedLimitSign,
          isOverLimit && styles.speedLimitSignWarning,
          {transform: [{scale: pulseAnim}]},
        ]}>
        <View style={styles.speedLimitInner}>
          <Text
            style={[
              styles.speedLimitValue,
              isOverLimit && styles.speedLimitValueWarning,
            ]}>
            {displaySpeedLimit}
          </Text>
        </View>
      </Animated.View>

      {/* Current speed display */}
      <View
        style={[
          styles.currentSpeedContainer,
          isOverLimit && styles.currentSpeedContainerWarning,
        ]}>
        <Text style={styles.currentSpeedLabel}>Your speed</Text>
        <Text
          style={[
            styles.currentSpeedValue,
            isOverLimit && styles.currentSpeedValueWarning,
          ]}>
          {currentSpeed}
        </Text>
        <Text style={styles.unitTextSmall}>{unit}</Text>
      </View>

      {/* Warning message */}
      {isOverLimit && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>⚠️ SLOW DOWN</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    gap: 12,
  },
  noDataContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
  },
  // UK-style circular speed limit sign
  speedLimitSign: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#dc2626', // Red ring
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  speedLimitSignWarning: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  speedLimitInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedLimitValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1f2937',
  },
  speedLimitValueWarning: {
    color: '#dc2626',
  },
  currentSpeedContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentSpeedContainerWarning: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
  },
  currentSpeedLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  currentSpeedValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  currentSpeedValueWarning: {
    color: '#fca5a5',
  },
  unitText: {
    fontSize: 10,
    color: '#666',
    marginTop: -2,
  },
  unitTextSmall: {
    fontSize: 10,
    color: '#9ca3af',
  },
  warningBanner: {
    position: 'absolute',
    bottom: -24,
    left: 0,
    right: 0,
    backgroundColor: '#dc2626',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  warningText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
