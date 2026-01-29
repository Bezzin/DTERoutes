/**
 * Route Request Card
 * ===================
 * "Hot Spot" collection card for test centers with limited routes
 */

import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {DarkCard, OrangeButton} from './common';
import {
  submitRouteRequest,
  hasRequestedRoutes,
  getRouteRequestCount,
} from '../services/supabase';
import {getDeviceId} from '../utils/deviceId';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';

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
  const [hasRequested, setHasRequested] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequestStatus = useCallback(async () => {
    try {
      const deviceId = await getDeviceId();
      const [requested, count] = await Promise.all([
        hasRequestedRoutes(testCenterId, deviceId),
        getRouteRequestCount(testCenterId),
      ]);
      setHasRequested(requested);
      setRequestCount(count);
    } catch (error) {
      console.error('Failed to load request status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [testCenterId]);

  useEffect(() => {
    loadRequestStatus();
  }, [loadRequestStatus]);

  const handleRequest = async () => {
    setIsSubmitting(true);
    try {
      const deviceId = await getDeviceId();
      const result = await submitRouteRequest(testCenterId, deviceId);
      if (result.success) {
        setHasRequested(true);
        setRequestCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to submit route request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <DarkCard style={styles.card}>
      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Help us grow!</Text>
      </View>

      <Text style={styles.description}>
        This centre currently has {routeCount}{' '}
        {routeCount === 1 ? 'route' : 'routes'}. Let us know you want more
        routes for {testCenterName}.
      </Text>

      {requestCount > 0 && (
        <Text style={styles.countText}>
          {requestCount} {requestCount === 1 ? 'person has' : 'people have'}{' '}
          requested routes here
        </Text>
      )}

      {hasRequested ? (
        <View style={styles.requestedContainer}>
          <Text style={styles.requestedText}>Requested</Text>
        </View>
      ) : (
        <OrangeButton
          title="Request Full Route Pack"
          onPress={handleRequest}
          loading={isSubmitting}
          size="small"
        />
      )}
    </DarkCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  banner: {
    backgroundColor: Colors.warning,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
  },
  bannerText: {
    ...Typography.badge,
    color: '#92400e',
    fontWeight: '700',
  },
  description: {
    ...Typography.bodySecondary,
    marginBottom: Spacing.sm,
  },
  countText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  requestedContainer: {
    backgroundColor: Colors.success + '20',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  requestedText: {
    ...Typography.buttonSmall,
    color: Colors.success,
  },
});
