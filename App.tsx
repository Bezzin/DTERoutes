/**
 * Test Routes Expert
 * ===================
 * UK Driving Test Routes Navigation App
 */

import React, {useEffect, useState} from 'react';
import {StatusBar, View, StyleSheet, ActivityIndicator} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import {AlphaWelcomeModal} from './src/components/AlphaWelcomeModal';
import {initializeRevenueCat} from './src/services/revenuecat';
import {useSubscriptionStore} from './src/store/useSubscriptionStore';
import {useAlphaModalStore} from './src/store/useAlphaModalStore';

function App(): React.JSX.Element {
  const [isInitializing, setIsInitializing] = useState(true);
  const initialize = useSubscriptionStore(state => state.initialize);
  const shouldShowModal = useAlphaModalStore(state => state.shouldShowModal);
  const dismissModal = useAlphaModalStore(state => state.dismissModal);
  const initializeAlphaModal = useAlphaModalStore(state => state.initialize);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize RevenueCat SDK
        await initializeRevenueCat();
        // Initialize subscription store (loads persisted data, sets up listeners)
        await initialize();
        // Initialize alpha modal store (check if user has dismissed modal)
        await initializeAlphaModal();
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [initialize]);

  // Show loading indicator while initializing
  if (isInitializing) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      <AppNavigator />
      <AlphaWelcomeModal visible={shouldShowModal} onDismiss={dismissModal} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});

export default App;
