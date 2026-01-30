/**
 * Location Permission Modal
 * ==========================
 * Google Play compliant pre-permission disclosure screen.
 * Explains WHY location is needed before requesting permission.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path, Circle} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import {Colors, Typography, Spacing, BorderRadius, Gradients} from '../theme';

interface LocationPermissionModalProps {
  visible: boolean;
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

// Location pin icon
function LocationIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
        stroke={Colors.primaryAccent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={12}
        cy={10}
        r={3}
        stroke={Colors.primaryAccent}
        strokeWidth={2}
      />
    </Svg>
  );
}

// Checkmark icon for feature list
function CheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={Colors.success}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Shield icon for privacy
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

export default function LocationPermissionModal({
  visible,
  onPermissionGranted,
  onPermissionDenied,
}: LocationPermissionModalProps) {
  const openAppSettings = () => {
    Linking.openSettings();
  };

  const handleAllowLocation = async () => {
    if (Platform.OS === 'android') {
      try {
        // Step 1: Request location permission
        const locationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'Test Routes Expert needs access to your location for turn-by-turn navigation and speed alerts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Deny',
            buttonPositive: 'Allow',
          },
        );

        // Handle "Never Ask Again" - user must go to settings
        if (locationGranted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permission Blocked',
            'Location permission was previously denied. Please enable it in your device settings to use navigation.',
            [
              {text: 'Cancel', style: 'cancel', onPress: onPermissionDenied},
              {text: 'Open Settings', onPress: openAppSettings},
            ],
          );
          return;
        }

        if (locationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          onPermissionDenied();
          return;
        }

        // Step 2: Check Android version for notification permission
        const apiLevel = Platform.Version;
        if (typeof apiLevel === 'number' && apiLevel >= 33) {
          // Android 13+: Request notification permission
          const notificationGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message:
                'Turn-by-turn navigation requires notifications to provide route guidance while the app is in the background.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Deny',
              buttonPositive: 'Allow',
            },
          );

          // Handle "Never Ask Again" for notifications
          if (notificationGranted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Alert.alert(
              'Notification Permission Blocked',
              'Notification permission was previously denied. Please enable it in your device settings for background navigation.',
              [
                {text: 'Cancel', style: 'cancel', onPress: onPermissionDenied},
                {text: 'Open Settings', onPress: openAppSettings},
              ],
            );
            return;
          }

          if (notificationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Notification Permission Required',
              'Navigation requires notifications to work in the background on Android 13+. Without this permission, navigation may not function properly.',
              [
                {text: 'Cancel', style: 'cancel', onPress: onPermissionDenied},
                {text: 'Retry', onPress: handleAllowLocation},
              ],
            );
            return;
          }
        }

        // Both permissions granted
        onPermissionGranted();
      } catch (err) {
        Alert.alert(
          'Permission Error',
          'An error occurred while requesting permissions. Please try again or enable permissions in settings.',
          [
            {text: 'Cancel', style: 'cancel', onPress: onPermissionDenied},
            {text: 'Open Settings', onPress: openAppSettings},
          ],
        );
      }
    } else {
      // iOS - permission handled via Info.plist
      onPermissionGranted();
    }
  };

  const features = [
    'Turn-by-turn navigation on test routes',
    'Real-time speed limit alerts',
    'Route progress tracking',
    'Background navigation notifications (Android 13+)',
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconGlow}>
              <LocationIcon />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Location Access Required</Text>

          {/* Explanation */}
          <Text style={styles.description}>
            This app uses your precise location to provide navigation on driving
            test routes. On Android 13+, notifications are also required for
            background navigation guidance.
          </Text>

          {/* Features list */}
          <View style={styles.featuresList}>
            <Text style={styles.featuresTitle}>Location is used for:</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <CheckIcon />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Privacy note */}
          <View style={styles.privacyNote}>
            <ShieldIcon />
            <Text style={styles.privacyText}>
              Mapbox receives your location to provide navigation services and
              collects anonymized telemetry. Your location is only used while
              navigation is active. We do not store or share your location
              history.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleAllowLocation}
              activeOpacity={0.8}
              style={styles.allowButton}>
              <LinearGradient
                colors={Gradients.orangeButton}
                style={styles.allowButtonGradient}>
                <Text style={styles.allowButtonText}>Allow Location Access</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onPermissionDenied}
              style={styles.denyButton}>
              <Text style={styles.denyButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>

          {/* Footer note */}
          <Text style={styles.footerNote}>
            You can change this later in your device settings.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  iconGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 87, 34, 0.3)',
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  featuresList: {
    width: '100%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  featuresTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  featureText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  privacyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  allowButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: Colors.primaryAccent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  allowButtonGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowButtonText: {
    ...Typography.button,
    color: Colors.textOnAccent,
    fontWeight: '700',
  },
  denyButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  denyButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  footerNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
