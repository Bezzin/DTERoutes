/**
 * App Navigator
 * ==============
 * Main navigation configuration for the app
 */

import React from 'react';
import {View, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigation';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import TestCenterScreen from '../screens/TestCenterScreen';
import RouteDetailScreen from '../screens/RouteDetailScreen';
import NavigationScreen from '../screens/NavigationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RouteProgressionScreen from '../screens/RouteProgressionScreen';
import PaywallScreen from '../screens/PaywallScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import {Colors, Typography, BorderRadius} from '../theme';

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
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerTitle: () => (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={{color: '#ffffff', fontSize: 18, fontWeight: 'bold'}}>
                  Test Routes Expert
                </Text>
                <View
                  style={{
                    backgroundColor: Colors.warning,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: BorderRadius.xs,
                    marginLeft: 8,
                  }}>
                  <Text
                    style={{
                      ...Typography.badge,
                      color: '#92400e',
                      fontWeight: '700',
                    }}>
                    ALPHA
                  </Text>
                </View>
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="TestCenter"
          component={TestCenterScreen}
          options={({route}) => ({
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
        <Stack.Screen
          name="RouteProgression"
          component={RouteProgressionScreen}
          options={{
            headerShown: false, // Uses custom header
          }}
        />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Feedback"
          component={FeedbackScreen}
          options={{
            title: 'Feedback',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
