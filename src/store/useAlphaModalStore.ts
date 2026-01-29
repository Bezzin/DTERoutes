/**
 * Alpha Modal Store
 * ==================
 * Manages alpha welcome modal visibility with persistence
 */

import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODAL_DISMISSED_KEY = '@test_routes_expert:alpha_modal_dismissed';

interface AlphaModalState {
  shouldShowModal: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  dismissModal: () => Promise<void>;
  reset: () => void;
}

export const useAlphaModalStore = create<AlphaModalState>((set, get) => ({
  shouldShowModal: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) {
      return;
    }

    try {
      const dismissed = await AsyncStorage.getItem(MODAL_DISMISSED_KEY);
      set({
        shouldShowModal: dismissed !== 'true',
        isInitialized: true,
      });
    } catch (error) {
      // If storage fails, show the modal to be safe
      set({
        shouldShowModal: true,
        isInitialized: true,
      });
    }
  },

  dismissModal: async () => {
    set({shouldShowModal: false});
    try {
      await AsyncStorage.setItem(MODAL_DISMISSED_KEY, 'true');
    } catch (error) {
      console.error('Failed to persist modal dismiss state:', error);
    }
  },

  reset: () => {
    set({
      shouldShowModal: false,
      isInitialized: false,
    });
  },
}));
