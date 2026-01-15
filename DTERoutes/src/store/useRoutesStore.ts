/**
 * Routes Store
 * =============
 * Zustand store for managing route state and completion tracking
 */

import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Route,
  RouteWithTestCenter,
  fetchRoutesByTestCenter,
  fetchRouteWithTestCenter,
} from '../services/supabase';

const COMPLETED_ROUTES_KEY = '@test_routes:completed';

interface RoutesState {
  // State
  routes: Route[];
  selectedRoute: RouteWithTestCenter | null;
  isLoading: boolean;
  error: string | null;
  // Map of testCenterId -> array of completed routeIds
  completedRoutes: Record<string, string[]>;
  isCompletionLoaded: boolean;

  // Actions
  fetchByTestCenter: (testCenterId: string) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  loadCompletedRoutes: () => Promise<void>;
  markRouteCompleted: (testCenterId: string, routeId: string) => Promise<void>;
  isRouteCompleted: (testCenterId: string, routeId: string) => boolean;
  getCompletedCount: (testCenterId: string) => number;
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
  completedRoutes: {},
  isCompletionLoaded: false,

  // Load completed routes from AsyncStorage
  loadCompletedRoutes: async () => {
    if (get().isCompletionLoaded) {
      return;
    }
    try {
      const stored = await AsyncStorage.getItem(COMPLETED_ROUTES_KEY);
      if (stored) {
        const completedRoutes = JSON.parse(stored);
        set({completedRoutes, isCompletionLoaded: true});
      } else {
        set({isCompletionLoaded: true});
      }
    } catch (error) {
      console.error('Failed to load completed routes:', error);
      set({isCompletionLoaded: true});
    }
  },

  // Mark a route as completed
  markRouteCompleted: async (testCenterId: string, routeId: string) => {
    const {completedRoutes} = get();
    const currentCompleted = completedRoutes[testCenterId] || [];

    // Don't add if already completed
    if (currentCompleted.includes(routeId)) {
      return;
    }

    const updated = {
      ...completedRoutes,
      [testCenterId]: [...currentCompleted, routeId],
    };

    set({completedRoutes: updated});

    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem(COMPLETED_ROUTES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to persist completed routes:', error);
    }
  },

  // Check if a route is completed
  isRouteCompleted: (testCenterId: string, routeId: string): boolean => {
    const {completedRoutes} = get();
    const completed = completedRoutes[testCenterId] || [];
    return completed.includes(routeId);
  },

  // Get count of completed routes for a test centre
  getCompletedCount: (testCenterId: string): number => {
    const {completedRoutes} = get();
    return (completedRoutes[testCenterId] || []).length;
  },

  // Fetch routes for a specific test center
  fetchByTestCenter: async (testCenterId: string) => {
    set({isLoading: true, error: null});
    try {
      const routes = await fetchRoutesByTestCenter(testCenterId);
      set({routes, isLoading: false});
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
    set({isLoading: true, error: null});
    try {
      const route = await fetchRouteWithTestCenter(id);
      set({selectedRoute: route, isLoading: false});
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch route',
        isLoading: false,
      });
    }
  },

  // Clear selected route
  clearSelectedRoute: () => set({selectedRoute: null}),

  // Clear error
  clearError: () => set({error: null}),

  // Reset store
  reset: () =>
    set({
      routes: [],
      selectedRoute: null,
      isLoading: false,
      error: null,
      completedRoutes: {},
      isCompletionLoaded: false,
    }),
}));
