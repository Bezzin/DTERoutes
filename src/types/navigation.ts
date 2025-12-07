/**
 * Navigation Type Definitions
 * ============================
 * TypeScript types for React Navigation
 */

import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define the param list for all screens
export type RootStackParamList = {
  Home: undefined;
  TestCenter: {
    testCenterId: string;
    testCenterName: string;
  };
  RouteDetail: {
    routeId: string;
  };
  Navigation: {
    routeId: string;
  };
  Settings: undefined;
};

// Screen props types for each screen
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type TestCenterScreenProps = NativeStackScreenProps<RootStackParamList, 'TestCenter'>;
export type RouteDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'RouteDetail'>;
export type NavigationScreenProps = NativeStackScreenProps<RootStackParamList, 'Navigation'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
