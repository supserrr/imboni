import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { AIStateProvider } from './context/AIStateContext';
import { VolunteerProvider } from './context/VolunteerContext';
import { AppNavigator } from './AppNavigator';

/**
 * Main app component.
 * Wraps the app with necessary providers and sets up navigation.
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AIStateProvider>
            <VolunteerProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </VolunteerProvider>
          </AIStateProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

