/**
 * Feedback Screen
 * ================
 * Bug report and suggestion form for alpha testers
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {DarkCard, OrangeButton, GlowingInput} from '../components/common';
import {submitFeedback, FeedbackType} from '../services/supabase';
import {getDeviceId} from '../utils/deviceId';
import {FeedbackScreenProps} from '../types/navigation';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';

const FEEDBACK_TYPES: {label: string; value: FeedbackType}[] = [
  {label: 'Bug', value: 'bug'},
  {label: 'Missing Content', value: 'missing_content'},
  {label: 'Suggestion', value: 'suggestion'},
];

export default function FeedbackScreen({route}: FeedbackScreenProps) {
  const testCenterName = route.params?.testCenterName ?? '';
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [centerName, setCenterName] = useState(testCenterName);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async () => {
    setValidationError('');

    if (!feedbackType) {
      setValidationError('Please select a feedback type.');
      return;
    }
    if (!message.trim()) {
      setValidationError('Please enter a message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const deviceId = await getDeviceId();
      const result = await submitFeedback({
        device_id: deviceId,
        feedback_type: feedbackType,
        test_center_name: centerName.trim() || null,
        message: message.trim(),
      });

      if (result.success) {
        Alert.alert('Thank you!', 'Your feedback has been submitted.');
        setFeedbackType(null);
        setCenterName('');
        setMessage('');
      } else {
        Alert.alert('Error', result.error ?? 'Failed to submit feedback.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Send Feedback</Text>
          <Text style={styles.subheading}>
            Help us improve Test Routes Expert
          </Text>

          {/* Feedback Type Selection */}
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {FEEDBACK_TYPES.map(type => {
              const isSelected = feedbackType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    isSelected && styles.typeButtonSelected,
                  ]}
                  onPress={() => setFeedbackType(type.value)}>
                  <Text
                    style={[
                      styles.typeButtonText,
                      isSelected && styles.typeButtonTextSelected,
                    ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Test Center Name */}
          <Text style={styles.label}>Test Centre Name (optional)</Text>
          <GlowingInput
            value={centerName}
            onChangeText={setCenterName}
            placeholder="e.g. Stafford Test Centre"
            showSearchIcon={false}
          />

          {/* Message */}
          <Text style={styles.label}>Message</Text>
          <DarkCard style={styles.messageCard}>
            <GlowingInput
              value={message}
              onChangeText={setMessage}
              placeholder="Describe the issue or suggestion..."
              showSearchIcon={false}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              containerStyle={styles.messageInput}
            />
          </DarkCard>

          {/* Validation Error */}
          {validationError !== '' && (
            <Text style={styles.errorText}>{validationError}</Text>
          )}

          {/* Submit */}
          <OrangeButton
            title="Submit Feedback"
            onPress={handleSubmit}
            loading={isSubmitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  heading: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subheading: {
    ...Typography.bodySecondary,
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderColor: Colors.primaryAccent,
    backgroundColor: Colors.primaryAccent + '20',
  },
  typeButtonText: {
    ...Typography.buttonSmall,
    color: Colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: Colors.primaryAccent,
  },
  messageCard: {
    padding: 0,
  },
  messageInput: {
    height: 120,
    alignItems: 'flex-start',
    borderWidth: 0,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
});
