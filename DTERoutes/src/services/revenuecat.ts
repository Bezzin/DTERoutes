/**
 * RevenueCat Service
 * ==================
 * Handles RevenueCat SDK initialization and subscription management
 */

import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOffering,
} from 'react-native-purchases';

// RevenueCat API Key
const REVENUECAT_API_KEY = 'test_BjXbOQcuibjNAiUPNbflZGwqQnl';

// Entitlement identifier - must match RevenueCat dashboard
export const ENTITLEMENT_ID = 'Test Routes Expert Unlimited';

/**
 * Initialize RevenueCat SDK
 * Should be called once when the app starts
 */
export const initializeRevenueCat = async (): Promise<void> => {
  try {
    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat with API key
    await Purchases.configure({apiKey: REVENUECAT_API_KEY});

    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    throw error;
  }
};

/**
 * Check if user has active subscription entitlement
 */
export const checkEntitlement = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error('Failed to check entitlement:', error);
    return false;
  }
};

/**
 * Get current customer info
 */
export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  return await Purchases.getCustomerInfo();
};

/**
 * Get available offerings (products)
 */
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async (): Promise<CustomerInfo> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('Purchases restored successfully');
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
};

/**
 * Add listener for customer info updates
 */
export const addCustomerInfoUpdateListener = (
  callback: (info: CustomerInfo) => void,
): (() => void) => {
  const listener = Purchases.addCustomerInfoUpdateListener(callback);
  return () => {
    listener.remove();
  };
};
