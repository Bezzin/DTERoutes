/**
 * Route Preview Component
 * ========================
 * Shows route information preview (without inline map to avoid conflicts)
 * Full map is shown during turn-by-turn navigation
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface RouteMapPreviewProps {
  routeGeometry: any; // GeoJSON geometry
  centerCoordinate?: [number, number]; // [longitude, latitude]
}

export default function RouteMapPreview({
  routeGeometry,
  centerCoordinate,
}: RouteMapPreviewProps) {
  // Extract coordinates from GeoJSON
  const getCoordinatesFromGeometry = () => {
    if (!routeGeometry) return [];

    if (routeGeometry.type === 'LineString') {
      return routeGeometry.coordinates;
    } else if (routeGeometry.type === 'MultiLineString') {
      return routeGeometry.coordinates.flat();
    }
    return [];
  };

  const coordinates = getCoordinatesFromGeometry();
  const pointCount = coordinates.length;

  // Calculate approximate bounds
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  coordinates.forEach((coord: number[]) => {
    minLng = Math.min(minLng, coord[0]);
    maxLng = Math.max(maxLng, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLat = Math.max(maxLat, coord[1]);
  });

  const startCoord = coordinates[0] || [0, 0];
  const endCoord = coordinates[coordinates.length - 1] || [0, 0];

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapTitle}>Route Preview</Text>
        <Text style={styles.mapSubtitle}>
          Full map shown during navigation
        </Text>
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🏁</Text>
            <Text style={styles.infoLabel}>Start</Text>
            <Text style={styles.infoValue}>
              {startCoord[1]?.toFixed(4)}°, {startCoord[0]?.toFixed(4)}°
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🎯</Text>
            <Text style={styles.infoLabel}>End</Text>
            <Text style={styles.infoValue}>
              {endCoord[1]?.toFixed(4)}°, {endCoord[0]?.toFixed(4)}°
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{pointCount}</Text>
            <Text style={styles.statLabel}>GPS Points</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e0f2fe',
    borderBottomWidth: 1,
    borderBottomColor: '#bae6fd',
  },
  mapPlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  mapSubtitle: {
    fontSize: 12,
    color: '#e0f2fe',
    marginTop: 4,
  },
  routeInfo: {
    padding: 16,
    backgroundColor: '#f0f9ff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    color: '#334155',
    fontFamily: 'monospace',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  statBadge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#e0f2fe',
  },
});
