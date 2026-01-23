/**
 * API Tests for Supabase Route Requests and User Feedback
 * ========================================================
 * Tests the API functions for submitting route requests and user feedback
 *
 * Note: These tests mock the supabase client and test the API function logic
 */

// Import mocks from the mocked module
import { mockFrom, mockInsert, mockSelect } from '@supabase/supabase-js';

// Import after mocks are set up
import {
  submitRouteRequest,
  hasRequestedRoutes,
  getRouteRequestCount,
  submitFeedback,
  FeedbackInput,
} from '../supabase';

describe('Route Requests API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitRouteRequest', () => {
    it('should return success true when insert succeeds', async () => {
      (mockFrom as jest.Mock).mockReturnValue({
        insert: (mockInsert as jest.Mock).mockResolvedValue({ error: null }),
      });

      const result = await submitRouteRequest('test-center-id', 'device-123');

      expect(mockFrom).toHaveBeenCalledWith('route_requests');
      expect(mockInsert).toHaveBeenCalledWith({
        test_center_id: 'test-center-id',
        device_id: 'device-123',
      });
      expect(result).toEqual({ success: true });
    });

    it('should return already requested error for duplicate constraint violation', async () => {
      (mockFrom as jest.Mock).mockReturnValue({
        insert: (mockInsert as jest.Mock).mockResolvedValue({
          error: { code: '23505', message: 'duplicate key value' },
        }),
      });

      const result = await submitRouteRequest('test-center-id', 'device-123');

      expect(result).toEqual({ success: false, error: 'Already requested' });
    });

    it('should return error message for other errors', async () => {
      (mockFrom as jest.Mock).mockReturnValue({
        insert: (mockInsert as jest.Mock).mockResolvedValue({
          error: { code: 'OTHER', message: 'Database error' },
        }),
      });

      const result = await submitRouteRequest('test-center-id', 'device-123');

      expect(result).toEqual({ success: false, error: 'Database error' });
    });
  });

  describe('hasRequestedRoutes', () => {
    it('should return true when route request exists', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'request-id' },
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });

      (mockFrom as jest.Mock).mockReturnValue({
        select: (mockSelect as jest.Mock).mockReturnValue({ eq: mockEq1 }),
      });

      const result = await hasRequestedRoutes('test-center-id', 'device-123');

      expect(mockFrom).toHaveBeenCalledWith('route_requests');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq1).toHaveBeenCalledWith('test_center_id', 'test-center-id');
      expect(mockEq2).toHaveBeenCalledWith('device_id', 'device-123');
      expect(result).toBe(true);
    });

    it('should return false when route request does not exist', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });

      (mockFrom as jest.Mock).mockReturnValue({
        select: (mockSelect as jest.Mock).mockReturnValue({ eq: mockEq1 }),
      });

      const result = await hasRequestedRoutes('test-center-id', 'device-123');

      expect(result).toBe(false);
    });

    it('should return false and log error for other errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'OTHER', message: 'Database error' },
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });

      (mockFrom as jest.Mock).mockReturnValue({
        select: (mockSelect as jest.Mock).mockReturnValue({ eq: mockEq1 }),
      });

      const result = await hasRequestedRoutes('test-center-id', 'device-123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking route request:',
        expect.objectContaining({ code: 'OTHER' })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getRouteRequestCount', () => {
    it('should return count when query succeeds', async () => {
      const mockEq = jest.fn().mockResolvedValue({
        count: 5,
        error: null,
      });

      (mockFrom as jest.Mock).mockReturnValue({
        select: (mockSelect as jest.Mock).mockReturnValue({ eq: mockEq }),
      });

      const result = await getRouteRequestCount('test-center-id');

      expect(mockFrom).toHaveBeenCalledWith('route_requests');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockEq).toHaveBeenCalledWith('test_center_id', 'test-center-id');
      expect(result).toBe(5);
    });

    it('should return 0 when count is null', async () => {
      const mockEq = jest.fn().mockResolvedValue({
        count: null,
        error: null,
      });

      (mockFrom as jest.Mock).mockReturnValue({
        select: (mockSelect as jest.Mock).mockReturnValue({ eq: mockEq }),
      });

      const result = await getRouteRequestCount('test-center-id');

      expect(result).toBe(0);
    });

    it('should return 0 and log error when query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockEq = jest.fn().mockResolvedValue({
        count: null,
        error: { message: 'Database error' },
      });

      (mockFrom as jest.Mock).mockReturnValue({
        select: (mockSelect as jest.Mock).mockReturnValue({ eq: mockEq }),
      });

      const result = await getRouteRequestCount('test-center-id');

      expect(result).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error getting route request count:',
        expect.objectContaining({ message: 'Database error' })
      );

      consoleSpy.mockRestore();
    });
  });
});

describe('User Feedback API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitFeedback', () => {
    it('should return success true when insert succeeds', async () => {
      (mockFrom as jest.Mock).mockReturnValue({
        insert: (mockInsert as jest.Mock).mockResolvedValue({ error: null }),
      });

      const feedback: FeedbackInput = {
        device_id: 'device-123',
        feedback_type: 'bug',
        test_center_name: 'Wood Green',
        message: 'Found an issue with the map',
      };

      const result = await submitFeedback(feedback);

      expect(mockFrom).toHaveBeenCalledWith('user_feedback');
      expect(mockInsert).toHaveBeenCalledWith(feedback);
      expect(result).toEqual({ success: true });
    });

    it('should return error message when insert fails', async () => {
      (mockFrom as jest.Mock).mockReturnValue({
        insert: (mockInsert as jest.Mock).mockResolvedValue({
          error: { message: 'Database error' },
        }),
      });

      const feedback: FeedbackInput = {
        device_id: 'device-123',
        feedback_type: 'suggestion',
        test_center_name: null,
        message: 'General suggestion',
      };

      const result = await submitFeedback(feedback);

      expect(result).toEqual({ success: false, error: 'Database error' });
    });

    it('should accept all feedback types', async () => {
      const feedbackTypes: Array<'bug' | 'missing_content' | 'suggestion'> = [
        'bug',
        'missing_content',
        'suggestion',
      ];

      for (const feedbackType of feedbackTypes) {
        jest.clearAllMocks();
        (mockFrom as jest.Mock).mockReturnValue({
          insert: (mockInsert as jest.Mock).mockResolvedValue({ error: null }),
        });

        const feedback: FeedbackInput = {
          device_id: 'device-123',
          feedback_type: feedbackType,
          test_center_name: null,
          message: `Test ${feedbackType}`,
        };

        const result = await submitFeedback(feedback);
        expect(result).toEqual({ success: true });
      }
    });
  });
});
