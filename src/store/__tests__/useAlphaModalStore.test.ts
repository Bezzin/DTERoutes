/**
 * Tests for Alpha Modal Store
 * ============================
 * Tests for the Zustand store managing the "Welcome to Alpha" modal state
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlphaModalStore } from '../useAlphaModalStore';

const ALPHA_MODAL_KEY = '@test_routes_expert:alpha_modal_dismissed';

describe('useAlphaModalStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAlphaModalStore.getState().reset();
    // Reset mock storage
    (AsyncStorage as any).__resetMockStorage();
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAlphaModalStore.getState();

      expect(state.shouldShowModal).toBe(false);
      expect(state.isInitialized).toBe(false);
    });
  });

  describe('initialize()', () => {
    it('should show modal if not previously dismissed', async () => {
      // AsyncStorage returns null (no stored value)
      const { initialize } = useAlphaModalStore.getState();

      await initialize();

      const state = useAlphaModalStore.getState();
      expect(state.shouldShowModal).toBe(true);
      expect(state.isInitialized).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(ALPHA_MODAL_KEY);
    });

    it('should hide modal if previously dismissed', async () => {
      // Set storage to indicate modal was dismissed
      (AsyncStorage as any).__setMockStorage({
        [ALPHA_MODAL_KEY]: 'true',
      });

      const { initialize } = useAlphaModalStore.getState();

      await initialize();

      const state = useAlphaModalStore.getState();
      expect(state.shouldShowModal).toBe(false);
      expect(state.isInitialized).toBe(true);
    });

    it('should handle storage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Make getItem throw an error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const { initialize } = useAlphaModalStore.getState();

      await initialize();

      const state = useAlphaModalStore.getState();
      expect(state.shouldShowModal).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error initializing alpha modal store:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('dismissModal()', () => {
    it('should persist to storage and hide modal', async () => {
      // First initialize to show the modal
      const { initialize, dismissModal } = useAlphaModalStore.getState();
      await initialize();

      // Verify modal is shown
      expect(useAlphaModalStore.getState().shouldShowModal).toBe(true);

      // Dismiss the modal
      await dismissModal();

      const state = useAlphaModalStore.getState();
      expect(state.shouldShowModal).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(ALPHA_MODAL_KEY, 'true');

      // Verify it was actually stored
      const storedValue = await AsyncStorage.getItem(ALPHA_MODAL_KEY);
      expect(storedValue).toBe('true');
    });

    it('should handle storage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Initialize first
      const { initialize, dismissModal } = useAlphaModalStore.getState();
      await initialize();

      // Make setItem throw an error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage write error')
      );

      await dismissModal();

      const state = useAlphaModalStore.getState();
      // Modal should still be hidden even if storage fails
      expect(state.shouldShowModal).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error dismissing alpha modal:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('reset()', () => {
    it('should reset store to initial state', async () => {
      // Initialize and dismiss modal
      const { initialize, dismissModal, reset } = useAlphaModalStore.getState();
      await initialize();
      await dismissModal();

      // Verify state changed
      expect(useAlphaModalStore.getState().isInitialized).toBe(true);

      // Reset
      reset();

      const state = useAlphaModalStore.getState();
      expect(state.shouldShowModal).toBe(false);
      expect(state.isInitialized).toBe(false);
    });
  });
});
