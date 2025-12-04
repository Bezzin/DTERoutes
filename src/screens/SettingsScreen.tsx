/**
 * Settings Screen
 * ================
 * Subscription management and app settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RevenueCatUI from 'react-native-purchases-ui';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { restorePurchases } from '../services/revenuecat';
import { SettingsScreenProps } from '../types/navigation';

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const { isSubscribed, checkSubscription } = useSubscriptionStore();

  // Open RevenueCat Customer Center for subscription management
  const handleManageSubscription = async () => {
    try {
      await RevenueCatUI.presentCustomerCenter();
      // Refresh subscription status after returning
      await checkSubscription();
    } catch (error: any) {
      // Customer Center might not be available on all platforms/plans
      Alert.alert(
        'Manage Subscription',
        'To manage your subscription, please visit the App Store or Google Play Store settings.',
      );
    }
  };

  // Show paywall to purchase subscription
  const handleUpgrade = async () => {
    try {
      const result = await RevenueCatUI.presentPaywall();
      // Refresh subscription status after paywall closes
      await checkSubscription();
    } catch (error: any) {
      console.error('Paywall error:', error);
      Alert.alert('Error', 'Unable to show subscription options. Please try again.');
    }
  };

  // Restore previous purchases
  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
      await checkSubscription();
      Alert.alert('Success', 'Your purchases have been restored.');
    } catch (error: any) {
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please check your internet connection and try again.',
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Subscription Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Subscription Status</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                isSubscribed ? styles.statusActive : styles.statusFree,
              ]}
            >
              <Text style={styles.statusText}>
                {isSubscribed ? 'Premium Active' : 'Free Plan'}
              </Text>
            </View>
          </View>

          {isSubscribed ? (
            <Text style={styles.statusDescription}>
              You have unlimited access to all driving test routes.
            </Text>
          ) : (
            <Text style={styles.statusDescription}>
              You can access one free route per test centre. Upgrade to unlock
              unlimited routes!
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Subscription</Text>

          {isSubscribed ? (
            <TouchableOpacity
              style={styles.button}
              onPress={handleManageSubscription}
            >
              <Text style={styles.buttonText}>Manage Subscription</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleUpgrade}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                Upgrade to Premium
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Restore Purchases
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Premium Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Premium Features</Text>
          <View style={styles.featureList}>
            <FeatureItem
              title="Unlimited Routes"
              description="Access all driving test routes at every test centre"
              isAvailable={isSubscribed}
            />
            <FeatureItem
              title="Turn-by-Turn Navigation"
              description="Full voice-guided navigation for all routes"
              isAvailable={isSubscribed}
            />
            <FeatureItem
              title="Offline Maps"
              description="Download routes for offline use"
              isAvailable={isSubscribed}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.infoText}>Test Routes Expert</Text>
          <Text style={styles.infoSubtext}>UK Driving Test Routes Navigation App</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Feature list item component
function FeatureItem({
  title,
  description,
  isAvailable,
}: {
  title: string;
  description: string;
  isAvailable: boolean;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{isAvailable ? '✓' : '○'}</Text>
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusFree: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  statusDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#2563eb',
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  featureIconText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  infoSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
});
