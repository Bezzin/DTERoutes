/**
 * TestCentreCard Component
 * =========================
 * Card with dark map thumbnail for the Explore screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, {Path} from 'react-native-svg';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '../../theme';

interface TestCentreCardProps {
  id: string;
  name: string;
  city?: string;
  address?: string;
  routeCount: number;
  latitude?: number;
  longitude?: number;
  onPress: (id: string, name: string) => void;
}

// Chevron icon
function ChevronRightIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18L15 12L9 6"
        stroke={Colors.primaryAccent}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Location pin icon for fallback
function LocationIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z"
        stroke={Colors.primaryAccent}
        strokeWidth={2}
      />
      <Path
        d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
        stroke={Colors.primaryAccent}
        strokeWidth={2}
      />
    </Svg>
  );
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Mapbox static image URL (dark style)
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

function getMapThumbnailUrl(lat?: number, lng?: number): string | null {
  if (!lat || !lng) return null;
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${lng},${lat},13,0/150x150@2x?access_token=${MAPBOX_TOKEN}`;
}

export function TestCentreCard({
  id,
  name,
  city,
  address,
  routeCount,
  latitude,
  longitude,
  onPress,
}: TestCentreCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {damping: 15, stiffness: 400});
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {damping: 15, stiffness: 400});
  };

  const mapUrl = getMapThumbnailUrl(latitude, longitude);

  return (
    <AnimatedTouchable
      style={[styles.container, animatedStyle, Shadows.card]}
      onPress={() => onPress(id, name)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}>
      {/* Map Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {mapUrl ? (
          <Image
            source={{uri: mapUrl}}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <LocationIcon />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {city && (
          <Text style={styles.city} numberOfLines={1}>
            {city}
          </Text>
        )}
        {address && (
          <Text style={styles.address} numberOfLines={1}>
            {address}
          </Text>
        )}

        {/* Route Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {routeCount} {routeCount === 1 ? 'Route' : 'Routes'} Available
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <View style={styles.chevronContainer}>
        <ChevronRightIcon />
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundTertiary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundTertiary,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  name: {
    ...Typography.h4,
    marginBottom: 2,
  },
  city: {
    ...Typography.bodySecondary,
    marginBottom: 2,
  },
  address: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primaryAccent,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    ...Typography.badge,
    color: Colors.primaryAccent,
  },
  chevronContainer: {
    marginLeft: Spacing.sm,
    marginRight: Spacing.xs,
  },
});
