/**
 * App Navigator
 * ==============
 * Main navigation configuration for the app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import TestCenterScreen from '../screens/TestCenterScreen';
import RouteDetailScreen from '../screens/RouteDetailScreen';
import NavigationScreen from '../screens/NavigationScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Test Routes Expert',
          }}
        />
        <Stack.Screen
          name="TestCenter"
          component={TestCenterScreen}
          options={({ route }) => ({
            title: route.params.testCenterName,
          })}
        />
        <Stack.Screen
          name="RouteDetail"
          component={RouteDetailScreen}
          options={{
            title: 'Route Preview',
          }}
        />
        <Stack.Screen
          name="Navigation"
          component={NavigationScreen}
          options={{
            title: 'Navigation',
            headerShown: false, // Hide header during navigation
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
