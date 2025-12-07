/**
 * Routes Store
 * =============
 * Zustand store for managing route state
 */

import { create } from 'zustand';
import {
  Route,
  RouteWithTestCenter,
  fetchRoutesByTestCenter,
  fetchRouteById,
  fetchRouteWithTestCenter,
} from '../services/supabase';

interface RoutesState {
  // State
  routes: Route[];
  selectedRoute: RouteWithTestCenter | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchByTestCenter: (testCenterId: string) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  clearSelectedRoute: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useRoutesStore = create<RoutesState>((set, get) => ({
  // Initial State
  routes: [],
  selectedRoute: null,
  isLoading: false,
  error: null,

  // Fetch routes for a specific test center
  fetchByTestCenter: async (testCenterId: string) => {
    set({ isLoading: true, error: null });
    try {
      const routes = await fetchRoutesByTestCenter(testCenterId);
      set({ routes, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch routes',
        isLoading: false,
        routes: [],
      });
    }
  },

  // Fetch single route with test center details
  fetchById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const route = await fetchRouteWithTestCenter(id);
      set({ selectedRoute: route, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch route',
        isLoading: false,
      });
    }
  },

  // Clear selected route
  clearSelectedRoute: () => set({ selectedRoute: null }),

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      routes: [],
      selectedRoute: null,
      isLoading: false,
      error: null,
    }),
}));
