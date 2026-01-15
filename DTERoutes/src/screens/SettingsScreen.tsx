/**
 * Settings Screen
 * ================
 * Subscription management and app settings
 * Dark mode gamified theme
 */

import React, {useState} from 'react';
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
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import RevenueCatUI from 'react-native-purchases-ui';
import {useSubscriptionStore} from '../store/useSubscriptionStore';
import {restorePurchases} from '../services/revenuecat';
import {SettingsScreenProps} from '../types/navigation';
import {DarkCard, OrangeButton, ToggleSwitch} from '../components/common';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';

// Compliance URLs
const PRIVACY_POLICY_URL = 'https://www.drivingtestexpert.com/privacy-policy';
const TERMS_OF_SERVICE_URL = 'https://www.drivingtestexpert.com/terms-of-service';
const SUPPORT_EMAIL = 'support@drivingtestexpert.com';
const APP_VERSION = '1.0.0';

// Icon Components
function UserIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
        stroke={Colors.textMuted}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke={Colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
        stroke={Colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function VolumeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5L6 9H2V15H6L11 19V5Z"
        stroke={Colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53"
        stroke={Colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HelpIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke={Colors.textSecondary}
        strokeWidth={2}
      />
      <Path
        d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15848 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"
        stroke={Colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 17H12.01"
        stroke={Colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
        stroke={Colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 6L12 13L2 6"
        stroke={Colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
        stroke={Colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18L15 12L9 6"
        stroke={Colors.textMuted}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function SettingsScreen({
  navigation,
}: SettingsScreenProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const {isSubscribed, checkSubscription} = useSubscriptionStore();

  // Open RevenueCat Customer Center for subscription management
  const handleManageSubscription = async () => {
    try {
      await RevenueCatUI.presentCustomerCenter();
      await checkSubscription();
    } catch (error: any) {
      Alert.alert(
        'Manage Subscription',
        'To manage your subscription, please visit the App Store or Google Play Store settings.',
      );
    }
  };

  // Show paywall to purchase subscription
  const handleUpgrade = () => {
    navigation.navigate('Paywall');
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
        {text: 'Cancel', style: 'cancel'},
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <UserIcon />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Test Routes Expert</Text>
            <Text style={styles.profileEmail}>User</Text>
          </View>
        </View>

        {/* Subscription Status Card - Orange when active */}
        <View style={styles.sectionContainer}>
          <View
            style={[
              styles.subscriptionCard,
              isSubscribed && styles.subscriptionCardActive,
            ]}>
            <Text
              style={[
                styles.subscriptionTitle,
                isSubscribed && styles.subscriptionTitleActive,
              ]}>
              Membership Status
            </Text>
            <Text
              style={[
                styles.subscriptionStatus,
                isSubscribed && styles.subscriptionStatusActive,
              ]}>
              {isSubscribed ? 'Active - Annual Plan' : 'Free Plan'}
            </Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={isSubscribed ? handleManageSubscription : handleUpgrade}>
              <Text
                style={[
                  styles.manageButtonText,
                  isSubscribed && styles.manageButtonTextActive,
                ]}>
                {isSubscribed ? 'Manage Subscription' : 'Upgrade to Premium'} →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription Actions */}
        {!isSubscribed && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <DarkCard>
              <OrangeButton
                title="Upgrade to Premium"
                onPress={handleUpgrade}
              />
              <View style={styles.buttonSpacer} />
              <OrangeButton
                title={isRestoring ? 'Restoring...' : 'Restore Purchases'}
                onPress={handleRestorePurchases}
                variant="outline"
                loading={isRestoring}
              />
            </DarkCard>
          </View>
        )}

        {/* App Preferences */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <DarkCard noPadding>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <BellIcon />
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <ToggleSwitch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </View>
            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <VolumeIcon />
                <Text style={styles.settingLabel}>Sound Effects</Text>
              </View>
              <ToggleSwitch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
              />
            </View>
          </DarkCard>
        </View>

        {/* Premium Features */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          <DarkCard>
            <FeatureItem
              title="Unlimited Routes"
              description="Access all driving test routes at every test centre"
              isAvailable={isSubscribed}
            />
            <View style={styles.featureDivider} />
            <FeatureItem
              title="Turn-by-Turn Navigation"
              description="Full voice-guided navigation for all routes"
              isAvailable={isSubscribed}
            />
          </DarkCard>
        </View>

        {/* Support & About */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Support & About</Text>
          <DarkCard noPadding>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              <View style={styles.linkLeft}>
                <ShieldIcon />
                <Text style={styles.linkText}>Privacy Policy</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
            <View style={styles.settingDivider} />
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>
              <View style={styles.linkLeft}>
                <ShieldIcon />
                <Text style={styles.linkText}>Terms of Service</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
            <View style={styles.settingDivider} />
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              <View style={styles.linkLeft}>
                <MailIcon />
                <Text style={styles.linkText}>Contact Support</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
            <View style={styles.settingDivider} />
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Alert.alert('Help', 'Help & FAQs coming soon!')}>
              <View style={styles.linkLeft}>
                <HelpIcon />
                <Text style={styles.linkText}>Help & FAQs</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
          </DarkCard>
        </View>

        {/* Data & Privacy */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <DarkCard>
            <Text style={styles.dataDisclosureText}>
              We use Mapbox for navigation, which processes your location to
              calculate routes and collects anonymized telemetry. We use
              RevenueCat to manage purchases, which processes transaction data
              as required by Google Play. For data deletion requests or privacy
              questions, contact {SUPPORT_EMAIL}.
            </Text>
            <View style={styles.dataDisclosureDivider} />
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleDeleteData}>
              <Text style={styles.dangerButtonText}>Delete My Data</Text>
            </TouchableOpacity>
          </DarkCard>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Test Routes Expert</Text>
          <Text style={styles.appTagline}>UK Driving Test Routes Navigation</Text>
          <Text style={styles.appVersion}>Version {APP_VERSION}</Text>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
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
      <View
        style={[
          styles.featureIcon,
          isAvailable && styles.featureIconActive,
        ]}>
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
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  profileInfo: {
    marginLeft: Spacing.md,
  },
  profileName: {
    ...Typography.h3,
  },
  profileEmail: {
    ...Typography.bodySecondary,
    marginTop: 2,
  },
  sectionContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.label,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  subscriptionCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subscriptionCardActive: {
    backgroundColor: Colors.primaryAccent,
    borderColor: Colors.primaryAccent,
  },
  subscriptionTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  subscriptionTitleActive: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  subscriptionStatus: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  subscriptionStatusActive: {
    color: Colors.textOnAccent,
  },
  manageButton: {
    alignSelf: 'flex-start',
  },
  manageButtonText: {
    ...Typography.buttonSmall,
    color: Colors.primaryAccent,
  },
  manageButtonTextActive: {
    color: Colors.textOnAccent,
  },
  buttonSpacer: {
    height: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  settingLabel: {
    ...Typography.body,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureDivider: {
    height: Spacing.md,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  featureIconActive: {
    backgroundColor: Colors.primaryAccent,
  },
  featureIconText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  featureDescription: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  linkText: {
    ...Typography.body,
  },
  dangerButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  dangerButtonText: {
    ...Typography.button,
    color: Colors.error,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  appName: {
    ...Typography.h4,
    color: Colors.textSecondary,
  },
  appTagline: {
    ...Typography.bodySecondary,
    marginTop: Spacing.xs,
  },
  appVersion: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  logoutText: {
    ...Typography.button,
    color: Colors.error,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
  dataDisclosureText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  dataDisclosureDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
});
