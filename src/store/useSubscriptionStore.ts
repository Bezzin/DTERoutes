/**
 * Subscription Store
 * ==================
 * Zustand store for managing subscription state and freemium access
 */

import {create} from 'zustand';
import {CustomerInfo} from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkEntitlement,
  getCustomerInfo,
  addCustomerInfoUpdateListener,
  ENTITLEMENT_ID,
} from '../services/revenuecat';

const VIEWED_ROUTES_KEY = '@test_routes_expert:viewed_routes';

interface SubscriptionState {
  // State
  isSubscribed: boolean;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  // Map of testCenterId -> first viewed routeId (only one free route per test centre)
  freeRoutePerTestCentre: Record<string, string>;

  // Actions
  initialize: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  canAccessRoute: (testCenterId: string, routeId: string) => boolean;
  markRouteAsFirstFree: (
    testCenterId: string,
    routeId: string,
  ) => Promise<void>;
  getFirstFreeRouteId: (testCenterId: string) => string | null;
  clearError: () => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial State
  isSubscribed: false,
  customerInfo: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  freeRoutePerTestCentre: {},

  // Initialize store - load persisted data and set up listeners
  initialize: async () => {
    if (get().isInitialized) {
      return;
    }

    set({isLoading: true});

    try {
      // Load persisted free routes
      const stored = await AsyncStorage.getItem(VIEWED_ROUTES_KEY);
      if (stored) {
        const freeRoutePerTestCentre = JSON.parse(stored);
        set({freeRoutePerTestCentre});
      }

      // Check current subscription status
      const isSubscribed = await checkEntitlement();
      const customerInfo = await getCustomerInfo();

      // Set up listener for subscription changes
      addCustomerInfoUpdateListener((info: CustomerInfo) => {
        const hasEntitlement =
          info.entitlements.active[ENTITLEMENT_ID] !== undefined;
        set({
          customerInfo: info,
          isSubscribed: hasEntitlement,
        });
      });

      set({
        isSubscribed,
        customerInfo,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to initialize subscription store',
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  // Check current subscription status
  checkSubscription: async () => {
    set({isLoading: true, error: null});
    try {
      const isSubscribed = await checkEntitlement();
      const customerInfo = await getCustomerInfo();
      set({isSubscribed, customerInfo, isLoading: false});
    } catch (error: any) {
      set({
        error: error.message || 'Failed to check subscription',
        isLoading: false,
      });
    }
  },

  // Check if user can access a specific route
  // Returns true if:
  // 1. User has active subscription, OR
  // 2. This is the first route for this test centre (free route), OR
  // 3. This route was previously marked as the free route for this test centre
  canAccessRoute: (testCenterId: string, routeId: string): boolean => {
    const {isSubscribed, freeRoutePerTestCentre} = get();

    // Subscribers can access all routes
    if (isSubscribed) {
      return true;
    }

    // Check if this test centre has a free route assigned
    const freeRouteId = freeRoutePerTestCentre[testCenterId];

    // If no free route yet, this will be the free one
    if (!freeRouteId) {
      return true;
    }

    // Allow access if this is the designated free route
    return freeRouteId === routeId;
  },

  // Mark a route as the first free route for a test centre
  markRouteAsFirstFree: async (
    testCenterId: string,
    routeId: string,
  ): Promise<void> => {
    const {freeRoutePerTestCentre, isSubscribed} = get();

    // Don't track if user is subscribed
    if (isSubscribed) {
      return;
    }

    // Only set if not already set for this test centre
    if (!freeRoutePerTestCentre[testCenterId]) {
      const updated = {
        ...freeRoutePerTestCentre,
        [testCenterId]: routeId,
      };

      set({freeRoutePerTestCentre: updated});

      // Persist to AsyncStorage
      try {
        await AsyncStorage.setItem(VIEWED_ROUTES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to persist free routes:', error);
      }
    }
  },

  // Get the first free route ID for a test centre (if any)
  getFirstFreeRouteId: (testCenterId: string): string | null => {
    return get().freeRoutePerTestCentre[testCenterId] || null;
  },

  // Clear error
  clearError: () => set({error: null}),

  // Reset store
  reset: () =>
    set({
      isSubscribed: false,
      customerInfo: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      freeRoutePerTestCentre: {},
    }),
}));
