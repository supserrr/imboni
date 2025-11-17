import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, ReactNode } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AudioProvider, useAudio } from '@/contexts/AudioContext';
import { AIProvider, useAI } from '@/contexts/AIContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Root layout component that handles authentication routing.
 */
function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session && !inAuthGroup && !inOnboardingGroup) {
      router.replace('/(onboarding)/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="call" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="ai-camera" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="groups" options={{ headerShown: false }} />
    </Stack>
  );
}

/**
 * Root layout component with theme and auth providers.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <AudioProvider>
        <AIProvider>
          <AIContextBridge>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
          </AIContextBridge>
        </AIProvider>
      </AudioProvider>
    </AuthProvider>
  );
}

/**
 * Bridge component - removed audio callback, OS accessibility handles narration.
 */
function AIContextBridge({ children }: { children: ReactNode }) {
  // No-op - OS accessibility handles all narration
  return <>{children}</>;
}
