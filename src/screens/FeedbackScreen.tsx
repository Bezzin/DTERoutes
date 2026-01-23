/**
 * Feedback Screen
 * ===============
 * Collects user feedback: bugs, missing content, and suggestions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { submitFeedback, FeedbackType } from '../services/supabase';
import { getDeviceId } from '../utils/deviceId';
import { FeedbackScreenProps } from '../types/navigation';

interface FeedbackOption {
  type: FeedbackType;
  label: string;
}

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  { type: 'bug', label: 'Bug' },
  { type: 'missing_content', label: 'Missing Content' },
  { type: 'suggestion', label: 'Suggestion' },
];

export default function FeedbackScreen({
  navigation,
  route,
}: FeedbackScreenProps) {
  const initialTestCenter = route.params?.testCenterName ?? '';

  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [testCenterName, setTestCenterName] = useState(initialTestCenter);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectType = (type: FeedbackType) => {
    setSelectedType(type);
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!selectedType) {
      setError('Please select a feedback type');
      return false;
    }
    if (!message.trim()) {
      setError('Please enter your feedback message');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const deviceId = await getDeviceId();

      const result = await submitFeedback({
        device_id: deviceId,
        feedback_type: selectedType!,
        test_center_name: testCenterName.trim() || null,
        message: message.trim(),
      });

      if (result.success) {
        Alert.alert('Thank You!', 'Your feedback has been submitted.', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to submit feedback');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Feedback Type Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback Type *</Text>
            <View style={styles.typeSelector}>
              {FEEDBACK_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.typeButton,
                    selectedType === option.type && styles.typeButtonSelected,
                  ]}
                  onPress={() => handleSelectType(option.type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === option.type &&
                        styles.typeButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Test Center Field */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Center (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Cardiff Test Centre"
              placeholderTextColor="#9ca3af"
              value={testCenterName}
              onChangeText={setTestCenterName}
              testID="testCenterInput"
            />
          </View>

          {/* Message Field */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message *</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Please describe your feedback in detail..."
              placeholderTextColor="#9ca3af"
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                setError(null);
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              testID="messageInput"
            />
          </View>

          {/* Error Message */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            Your feedback helps us improve the app. We read every submission!
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  messageInput: {
    minHeight: 150,
    paddingTop: 14,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  helpText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
