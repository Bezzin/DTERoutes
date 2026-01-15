/**
 * Test Centers Store
 * ===================
 * Zustand store for managing test center state
 */

import { create } from 'zustand';
import {
  TestCenter,
  fetchTestCenters,
  fetchTestCenterById,
} from '../services/supabase';

interface TestCentersState {
  // State
  testCenters: TestCenter[];
  selectedTestCenter: TestCenter | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAll: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useTestCentersStore = create<TestCentersState>((set, get) => ({
  // Initial State
  testCenters: [],
  selectedTestCenter: null,
  isLoading: false,
  error: null,

  // Fetch all test centers
  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const centers = await fetchTestCenters();
      set({ testCenters: centers, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch test centers',
        isLoading: false,
      });
    }
  },

  // Fetch single test center by ID
  fetchById: async (id: string) => {
    // Check if already in cache
    const cached = get().testCenters.find(tc => tc.id === id);
    if (cached) {
      set({ selectedTestCenter: cached });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const center = await fetchTestCenterById(id);
      set({ selectedTestCenter: center, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch test center',
        isLoading: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      testCenters: [],
      selectedTestCenter: null,
      isLoading: false,
      error: null,
    }),
}));
