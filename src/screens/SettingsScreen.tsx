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
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import RevenueCatUI from 'react-native-purchases-ui';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { restorePurchases } from '../services/revenuecat';
import { SettingsScreenProps } from '../types/navigation';

// Compliance URLs
const PRIVACY_POLICY_URL = 'https://destiny-date-598.notion.site/Privacy-Policy-Test-Routes-Expert-2c04994b32ba8119ada3c1e7911d4398';
const TERMS_OF_SERVICE_URL = 'https://destiny-date-598.notion.site/Terms-of-Service-Test-Routes-Expert-2c04994b32ba81eea41cd2f9fab3e12e';
const SUPPORT_EMAIL = 'support@drivingtestexpert.com';
const APP_VERSION = '0.0.1';

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

  // Delete all local app data
  const handleDeleteData = () => {
    Alert.alert(
      'Delete My Data',
      'This will delete all your local app data including saved preferences and free route selections. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'Your data has been deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            }
          },
        },
      ],
    );
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

        {/* Legal & Support */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal & Support</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          >
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
          >
            <Text style={styles.linkText}>Terms of Service</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, styles.linkRowLast]}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          >
            <Text style={styles.linkText}>Contact Support</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Data & Privacy */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data & Privacy</Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleDeleteData}
          >
            <Text style={styles.dangerButtonText}>Delete My Data</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={[styles.card, styles.cardLast]}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.infoText}>Test Routes Expert</Text>
          <Text style={styles.infoSubtext}>UK Driving Test Routes Navigation App</Text>
          <Text style={styles.versionText}>Version {APP_VERSION}</Text>
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
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  cardLast: {
    marginBottom: 24,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  linkRowLast: {
    borderBottomWidth: 0,
  },
  linkText: {
    fontSize: 16,
    color: '#1e293b',
  },
  linkArrow: {
    fontSize: 16,
    color: '#94a3b8',
  },
  dangerButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 0,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});
