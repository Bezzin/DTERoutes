/**
 * Alpha Modal Store
 * =================
 * Zustand store for managing the "Welcome to Alpha" modal state
 * Persists dismissal state via AsyncStorage so modal only shows once per installation
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALPHA_MODAL_KEY = '@test_routes_expert:alpha_modal_dismissed';

interface AlphaModalState {
  shouldShowModal: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  dismissModal: () => Promise<void>;
  reset: () => void;
}

export const useAlphaModalStore = create<AlphaModalState>((set) => ({
  shouldShowModal: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const dismissed = await AsyncStorage.getItem(ALPHA_MODAL_KEY);
      set({
        shouldShowModal: dismissed !== 'true',
        isInitialized: true,
      });
    } catch (error) {
      console.error('Error initializing alpha modal store:', error);
      set({ shouldShowModal: false, isInitialized: true });
    }
  },

  dismissModal: async () => {
    try {
      await AsyncStorage.setItem(ALPHA_MODAL_KEY, 'true');
      set({ shouldShowModal: false });
    } catch (error) {
      console.error('Error dismissing alpha modal:', error);
      set({ shouldShowModal: false });
    }
  },

  reset: () => {
    set({ shouldShowModal: false, isInitialized: false });
  },
}));
