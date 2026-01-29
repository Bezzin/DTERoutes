/**
 * Alpha Welcome Modal
 * ====================
 * One-time welcome modal for alpha testers
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {OrangeButton} from './common';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';

interface AlphaWelcomeModalProps {
  visible: boolean;
  onDismiss: () => void;
}

function BulletPoint({text}: {text: string}) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>{'  \u2022  '}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export function AlphaWelcomeModal({visible, onDismiss}: AlphaWelcomeModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Alpha Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ALPHA VERSION</Text>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Welcome to Alpha</Text>
          <Text style={styles.subheading}>
            Thanks for testing Test Routes Expert!
          </Text>

          {/* Bullet points */}
          <View style={styles.bulletList}>
            <BulletPoint text="This app is in active development. You may encounter bugs or missing features." />
            <BulletPoint text="Routes are limited to 1-2 per test centre while we build out coverage." />
            <BulletPoint text="New routes are deployed based on demand. Request routes for your test centre!" />
          </View>

          {/* Dismiss button */}
          <OrangeButton title="I Understand" onPress={onDismiss} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badge: {
    backgroundColor: Colors.warning,
    alignSelf: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.md,
  },
  badgeText: {
    ...Typography.badge,
    color: '#92400e',
    fontWeight: '700',
  },
  heading: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subheading: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  bulletList: {
    marginBottom: Spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  bulletDot: {
    ...Typography.body,
    color: Colors.warning,
  },
  bulletText: {
    ...Typography.bodySecondary,
    flex: 1,
  },
});
