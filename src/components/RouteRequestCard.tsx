/**
 * RouteRequestCard Component
 * ==========================
 * Displays a "Hot Spot" tracking card for test centers with limited routes (1-2).
 * Users can request full route packs, helping prioritize where to deploy next.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  submitRouteRequest,
  hasRequestedRoutes,
  getRouteRequestCount,
} from '../services/supabase';
import { getDeviceId } from '../utils/deviceId';

interface RouteRequestCardProps {
  testCenterId: string;
  testCenterName: string;
  routeCount: number;
}

export function RouteRequestCard({
  testCenterId,
  testCenterName,
  routeCount,
}: RouteRequestCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasRequested, setHasRequested] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only render for centers with 1-2 routes
  if (routeCount > 2) {
    return null;
  }

  useEffect(() => {
    loadData();
  }, [testCenterId]);

  async function loadData() {
    setIsLoading(true);
    try {
      const id = await getDeviceId();
      setDeviceId(id);

      const [alreadyRequested, count] = await Promise.all([
        hasRequestedRoutes(testCenterId, id),
        getRouteRequestCount(testCenterId),
      ]);

      setHasRequested(alreadyRequested);
      setRequestCount(count);
    } catch (error) {
      console.error('Error loading route request data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRequestPress() {
    if (!deviceId || hasRequested || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitRouteRequest(testCenterId, deviceId);
      if (result.success) {
        setHasRequested(true);
        setRequestCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error submitting route request:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2563eb" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Help us grow!</Text>
        <Text style={styles.bannerMessage}>
          If this is your local center, request a full pack below so we know
          where to deploy next.
        </Text>
      </View>

      {/* Request count */}
      <View style={styles.countContainer}>
        <Text style={styles.countNumber}>{String(requestCount)}</Text>
        <Text style={styles.countLabel}>
          {requestCount === 1 ? 'request' : 'requests'} for this center
        </Text>
      </View>

      {/* Request button or "Requested" state */}
      {hasRequested ? (
        <View style={styles.requestedButton}>
          <Text style={styles.requestedButtonText}>Requested ✓</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={handleRequestPress}
          disabled={isSubmitting}
        >
          <Text style={styles.requestButtonText}>
            {isSubmitting ? 'Submitting...' : 'Request Full Route Pack'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  banner: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bannerTitle: {
    color: '#92400e',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerMessage: {
    color: '#92400e',
    fontSize: 14,
    lineHeight: 20,
  },
  countContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  countNumber: {
    color: '#2563eb',
    fontSize: 36,
    fontWeight: '700',
  },
  countLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  requestButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  requestedButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  requestedButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
