/**
 * Type Tests for Supabase Types
 * =============================
 * Verifies that RouteRequest and UserFeedback types exist and have correct shapes
 */

import {
  FeedbackType,
  RouteRequest,
  UserFeedback,
} from '../supabase';

describe('Supabase Types', () => {
  describe('FeedbackType', () => {
    it('should accept valid feedback types', () => {
      const bug: FeedbackType = 'bug';
      const missingContent: FeedbackType = 'missing_content';
      const suggestion: FeedbackType = 'suggestion';

      expect(bug).toBe('bug');
      expect(missingContent).toBe('missing_content');
      expect(suggestion).toBe('suggestion');
    });
  });

  describe('RouteRequest', () => {
    it('should have correct shape for route request', () => {
      const routeRequest: RouteRequest = {
        id: 'test-uuid',
        test_center_id: 'london-wood-green',
        device_id: 'device-123',
        user_id: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(routeRequest.id).toBe('test-uuid');
      expect(routeRequest.test_center_id).toBe('london-wood-green');
      expect(routeRequest.device_id).toBe('device-123');
      expect(routeRequest.user_id).toBeNull();
      expect(routeRequest.created_at).toBe('2024-01-01T00:00:00Z');
    });

    it('should allow user_id to be a string', () => {
      const routeRequest: RouteRequest = {
        id: 'test-uuid',
        test_center_id: 'london-wood-green',
        device_id: 'device-123',
        user_id: 'user-456',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(routeRequest.user_id).toBe('user-456');
    });
  });

  describe('UserFeedback', () => {
    it('should have correct shape for user feedback', () => {
      const feedback: UserFeedback = {
        id: 'feedback-uuid',
        device_id: 'device-123',
        feedback_type: 'bug',
        test_center_name: 'Wood Green',
        message: 'Found an issue with the map',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(feedback.id).toBe('feedback-uuid');
      expect(feedback.device_id).toBe('device-123');
      expect(feedback.feedback_type).toBe('bug');
      expect(feedback.test_center_name).toBe('Wood Green');
      expect(feedback.message).toBe('Found an issue with the map');
      expect(feedback.created_at).toBe('2024-01-01T00:00:00Z');
    });

    it('should allow test_center_name to be null', () => {
      const feedback: UserFeedback = {
        id: 'feedback-uuid',
        device_id: 'device-123',
        feedback_type: 'suggestion',
        test_center_name: null,
        message: 'General app suggestion',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(feedback.test_center_name).toBeNull();
    });

    it('should accept all feedback types', () => {
      const bugFeedback: UserFeedback = {
        id: '1',
        device_id: 'device',
        feedback_type: 'bug',
        test_center_name: null,
        message: 'Bug report',
        created_at: '2024-01-01T00:00:00Z',
      };

      const missingContentFeedback: UserFeedback = {
        id: '2',
        device_id: 'device',
        feedback_type: 'missing_content',
        test_center_name: 'Test Center',
        message: 'Missing content report',
        created_at: '2024-01-01T00:00:00Z',
      };

      const suggestionFeedback: UserFeedback = {
        id: '3',
        device_id: 'device',
        feedback_type: 'suggestion',
        test_center_name: null,
        message: 'Suggestion',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(bugFeedback.feedback_type).toBe('bug');
      expect(missingContentFeedback.feedback_type).toBe('missing_content');
      expect(suggestionFeedback.feedback_type).toBe('suggestion');
    });
  });
});
