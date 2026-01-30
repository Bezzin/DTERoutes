/**
 * Route Completion Modal
 * =======================
 * Multi-step post-navigation feedback flow.
 * Collects thumbs up/down, difficulty rating, and optional negative feedback.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path, Circle} from 'react-native-svg';
import {
  submitRouteRating,
  PerceivedDifficulty,
} from '../services/supabase';
import {getDeviceId} from '../utils/deviceId';
import {Colors, Typography, Spacing, BorderRadius} from '../theme';

interface RouteCompletionModalProps {
  visible: boolean;
  routeId: string;
  routeName: string;
  onComplete: () => void;
}

// Checkmark circle icon
function CheckCircleIcon() {
  return (
    <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={10}
        fill={Colors.success}
        stroke={Colors.success}
        strokeWidth={2}
      />
      <Path
        d="M9 12L11 14L15 10"
        stroke={Colors.textOnAccent}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Thumbs up icon
function ThumbsUpIcon({active}: {active: boolean}) {
  const color = active ? Colors.success : Colors.textMuted;
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? color : 'none'}
      />
    </Svg>
  );
}

// Thumbs down icon
function ThumbsDownIcon({active}: {active: boolean}) {
  const color = active ? Colors.error : Colors.textMuted;
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 15V19a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? color : 'none'}
      />
    </Svg>
  );
}

const NEGATIVE_REASONS = [
  'Route was too difficult',
  'Navigation didn\'t work properly',
  'Route wasn\'t accurate',
  'Other',
];

type Step = 'thumbs' | 'difficulty' | 'ask_why' | 'reasons';

export default function RouteCompletionModal({
  visible,
  routeId,
  routeName,
  onComplete,
}: RouteCompletionModalProps) {
  const [step, setStep] = useState<Step>('thumbs');
  const [thumbsUp, setThumbsUp] = useState<boolean | null>(null);
  const [difficulty, setDifficulty] = useState<PerceivedDifficulty | null>(null);
  const [negativeReason, setNegativeReason] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setStep('thumbs');
    setThumbsUp(null);
    setDifficulty(null);
    setNegativeReason(null);
    setFeedbackText('');
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const deviceId = await getDeviceId();
      await submitRouteRating({
        route_id: routeId,
        device_id: deviceId,
        thumbs_up: thumbsUp ?? true,
        perceived_difficulty: difficulty ?? undefined,
        negative_reason: negativeReason ?? undefined,
        feedback_text: feedbackText.trim() || undefined,
      });
    } catch (error) {
      console.error('Failed to submit route rating:', error);
    } finally {
      setIsSubmitting(false);
      resetState();
      onComplete();
    }
  };

  const handleSkip = () => {
    resetState();
    onComplete();
  };

  const handleThumbsChoice = (liked: boolean) => {
    setThumbsUp(liked);
    setStep('difficulty');
  };

  const handleDifficultyChoice = (diff: PerceivedDifficulty) => {
    setDifficulty(diff);
    if (thumbsUp === false) {
      setStep('ask_why');
    } else {
      // Thumbs up — submit directly
      setDifficulty(diff);
      // Submit will be triggered after state update
      submitWithDifficulty(diff);
    }
  };

  const submitWithDifficulty = async (diff: PerceivedDifficulty) => {
    setIsSubmitting(true);
    try {
      const deviceId = await getDeviceId();
      await submitRouteRating({
        route_id: routeId,
        device_id: deviceId,
        thumbs_up: thumbsUp ?? true,
        perceived_difficulty: diff,
      });
    } catch (error) {
      console.error('Failed to submit route rating:', error);
    } finally {
      setIsSubmitting(false);
      resetState();
      onComplete();
    }
  };

  const handleAskWhy = (wantToTell: boolean) => {
    if (wantToTell) {
      setStep('reasons');
    } else {
      handleSubmit();
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy':
        return Colors.success;
      case 'moderate':
        return '#FFC107';
      case 'challenging':
        return Colors.error;
      default:
        return Colors.textMuted;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'thumbs':
        return (
          <View style={styles.stepContainer}>
            <CheckCircleIcon />
            <Text style={styles.congratsTitle}>Route Complete!</Text>
            <Text style={styles.routeNameText}>{routeName}</Text>
            <Text style={styles.questionText}>Did you like this route?</Text>
            <View style={styles.thumbsRow}>
              <TouchableOpacity
                style={[styles.thumbButton, thumbsUp === true && styles.thumbButtonActive]}
                onPress={() => handleThumbsChoice(true)}
                activeOpacity={0.7}>
                <ThumbsUpIcon active={thumbsUp === true} />
                <Text style={styles.thumbLabel}>Yes!</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.thumbButton, thumbsUp === false && styles.thumbButtonActive]}
                onPress={() => handleThumbsChoice(false)}
                activeOpacity={0.7}>
                <ThumbsDownIcon active={thumbsUp === false} />
                <Text style={styles.thumbLabel}>Not really</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'difficulty':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionTitle}>How difficult was this route?</Text>
            <View style={styles.difficultyRow}>
              {(['easy', 'moderate', 'challenging'] as PerceivedDifficulty[]).map(diff => (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.difficultyButton,
                    {borderColor: getDifficultyColor(diff)},
                    difficulty === diff && {backgroundColor: getDifficultyColor(diff) + '30'},
                  ]}
                  onPress={() => handleDifficultyChoice(diff)}
                  activeOpacity={0.7}>
                  <View
                    style={[styles.difficultyDot, {backgroundColor: getDifficultyColor(diff)}]}
                  />
                  <Text style={[styles.difficultyLabel, {color: getDifficultyColor(diff)}]}>
                    {diff === 'challenging' ? 'Hard' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {isSubmitting && <ActivityIndicator color={Colors.primaryAccent} style={styles.loader} />}
          </View>
        );

      case 'ask_why':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionTitle}>Would you like to tell us why?</Text>
            <Text style={styles.subText}>Your feedback helps us improve routes</Text>
            <View style={styles.yesNoRow}>
              <TouchableOpacity
                style={styles.yesNoButton}
                onPress={() => handleAskWhy(true)}
                activeOpacity={0.7}>
                <Text style={styles.yesNoText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.yesNoButton, styles.yesNoSecondary]}
                onPress={() => handleAskWhy(false)}
                activeOpacity={0.7}>
                <Text style={[styles.yesNoText, styles.yesNoSecondaryText]}>No thanks</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'reasons':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionTitle}>What went wrong?</Text>
            <View style={styles.reasonsList}>
              {NEGATIVE_REASONS.map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonButton,
                    negativeReason === reason && styles.reasonButtonActive,
                  ]}
                  onPress={() => setNegativeReason(reason)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.reasonText,
                      negativeReason === reason && styles.reasonTextActive,
                    ]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Tell us more (optional)..."
              placeholderTextColor={Colors.textMuted}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}>
              {isSubmitting ? (
                <ActivityIndicator color={Colors.textOnAccent} />
              ) : (
                <Text style={styles.submitText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          {renderStep()}
          {step !== 'reasons' && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  congratsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  routeNameText: {
    ...Typography.bodySecondary,
    marginBottom: Spacing.xl,
  },
  questionText: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subText: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  thumbButton: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    width: 120,
  },
  thumbButtonActive: {
    borderColor: Colors.primaryAccent,
    backgroundColor: Colors.primaryAccent + '15',
  },
  thumbLabel: {
    ...Typography.body,
    color: Colors.text,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  difficultyButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    flex: 1,
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: Spacing.xs,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  loader: {
    marginTop: Spacing.md,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryAccent,
    alignItems: 'center',
  },
  yesNoSecondary: {
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yesNoText: {
    ...Typography.button,
    color: Colors.textOnAccent,
    fontWeight: '700',
  },
  yesNoSecondaryText: {
    color: Colors.textSecondary,
  },
  reasonsList: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reasonButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundTertiary,
  },
  reasonButtonActive: {
    borderColor: Colors.primaryAccent,
    backgroundColor: Colors.primaryAccent + '15',
  },
  reasonText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  reasonTextActive: {
    color: Colors.primaryAccent,
    fontWeight: '600',
  },
  textInput: {
    width: '100%',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 14,
    minHeight: 80,
    marginBottom: Spacing.md,
  },
  submitButton: {
    width: '100%',
    backgroundColor: Colors.primaryAccent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  submitText: {
    ...Typography.button,
    color: Colors.textOnAccent,
    fontWeight: '700',
  },
  skipButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
});
