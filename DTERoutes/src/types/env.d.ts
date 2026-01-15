/**
 * Type declarations for environment variables loaded via react-native-dotenv
 * These variables are defined in .env (not committed to git)
 */
declare module '@env' {
  // Mapbox
  export const MAPBOX_PUBLIC_TOKEN: string;

  // Supabase
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;

  // App Configuration
  export const IOS_BUNDLE_ID: string;
  export const ANDROID_PACKAGE_NAME: string;

  // RevenueCat
  export const REVENUECAT_API_KEY: string;
}
