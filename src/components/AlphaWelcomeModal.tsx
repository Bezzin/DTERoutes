/**
 * Alpha Welcome Modal Component
 * =============================
 * Welcomes users to the Alpha version of the app.
 * Displays key messaging about Alpha status and has an "I Understand" dismiss button.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface AlphaWelcomeModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function AlphaWelcomeModal({
  visible,
  onDismiss,
}: AlphaWelcomeModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ALPHA VERSION</Text>
          </View>

          <Text style={styles.title}>Welcome to Alpha</Text>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>1.</Text>
              <Text style={styles.bulletText}>
                We are currently in active development.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>2.</Text>
              <Text style={styles.bulletText}>
                Most test centers currently have 1 free route.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>3.</Text>
              <Text style={styles.bulletText}>
                Full route packs are being deployed based on user demand and
                feedback.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: Math.min(screenWidth - 40, 400),
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  badgeText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  bulletList: {
    width: '100%',
    marginBottom: 24,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bulletDot: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
    width: 20,
  },
  bulletText: {
    flex: 1,
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
