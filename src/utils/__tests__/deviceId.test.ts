/**
 * Device ID Utility Tests
 * =======================
 * Tests for generating and persisting unique device IDs
 * for anonymous user tracking (route requests, feedback).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Import will fail initially (RED phase of TDD)
import { getDeviceId, __resetCachedDeviceId } from '../deviceId';

const DEVICE_ID_KEY = '@test_routes_expert:device_id';

// UUID v4 regex pattern
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('Device ID Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock storage
    (AsyncStorage as any).__resetMockStorage();
    // Reset the cached device ID
    __resetCachedDeviceId();
  });

  describe('getDeviceId', () => {
    it('should return existing device ID from storage', async () => {
      const existingId = '12345678-1234-4123-8123-123456789abc';
      (AsyncStorage as any).__setMockStorage({
        [DEVICE_ID_KEY]: existingId,
      });

      const result = await getDeviceId();

      expect(result).toBe(existingId);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(DEVICE_ID_KEY);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should generate and store new device ID if none exists', async () => {
      const result = await getDeviceId();

      expect(result).toMatch(UUID_V4_REGEX);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(DEVICE_ID_KEY);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(DEVICE_ID_KEY, result);
    });

    it('should return same ID on subsequent calls (caching)', async () => {
      const firstResult = await getDeviceId();
      const secondResult = await getDeviceId();
      const thirdResult = await getDeviceId();

      expect(firstResult).toBe(secondResult);
      expect(secondResult).toBe(thirdResult);
      // AsyncStorage.getItem should only be called once due to caching
      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it('should handle storage errors gracefully with fallback', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const result = await getDeviceId();

      expect(result).toMatch(UUID_V4_REGEX);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error getting device ID:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should use cached ID even after storage error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const firstResult = await getDeviceId();
      const secondResult = await getDeviceId();

      expect(firstResult).toBe(secondResult);
      // Cached ID should be used for second call
      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it('should generate valid UUID v4 format', async () => {
      const result = await getDeviceId();

      // Check UUID v4 structure
      const parts = result.split('-');
      expect(parts).toHaveLength(5);
      expect(parts[0]).toHaveLength(8);
      expect(parts[1]).toHaveLength(4);
      expect(parts[2]).toHaveLength(4);
      expect(parts[2][0]).toBe('4'); // Version 4
      expect(parts[3]).toHaveLength(4);
      expect(['8', '9', 'a', 'b']).toContain(parts[3][0].toLowerCase()); // Variant
      expect(parts[4]).toHaveLength(12);
    });

    it('should not call setItem when ID already exists in storage', async () => {
      const existingId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
      (AsyncStorage as any).__setMockStorage({
        [DEVICE_ID_KEY]: existingId,
      });

      await getDeviceId();

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
