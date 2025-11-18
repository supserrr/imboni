import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, ReactNode, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AudioProvider, useAudio } from '@/contexts/AudioContext';
import { AIProvider, useAI } from '@/contexts/AIContext';

// Prevent the splash screen from auto-hiding before we're ready
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(user-tabs)',
};

/**
 * Root layout component that handles authentication routing.
 */
function RootLayoutNav() {
  const { session, loading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const inUserTabsGroup = segments[0] === '(user-tabs)';
    const inVolunteerTabsGroup = segments[0] === '(volunteer-tabs)';
    const inTabsGroup = segments[0] === '(tabs)'; // Legacy support
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabGroup = inUserTabsGroup || inVolunteerTabsGroup || inTabsGroup;

    // Wait for auth loading to complete before making routing decisions
    if (loading) return;

    // Never redirect to welcome if we're already in a tab group
    // This prevents showing welcome screen during reload transitions
    if (inTabGroup) {
      // If we have a session, wait for profile to load
      if (session && !profile) {
        // Profile is loading, stay where we are
        return;
      }
      // If profile is loaded, verify role matches (handled below)
    } else {
      // Only redirect to welcome if truly unauthenticated and not in any protected group
      if (!session && !inAuthGroup && !inOnboardingGroup) {
        router.replace('/(onboarding)/welcome');
        // App is ready to show - hide splash screen
        setAppIsReady(true);
        return;
      }
    }

    // For authenticated users, wait for profile to load before routing
    // This prevents showing wrong layout during profile fetch
    if (session && !profile) {
      // Profile is still loading, don't route yet
      // If we're in onboarding, stay there until profile loads
      // If we're in tabs, we'll show loading screen
      return;
    }

    // Only route authenticated users after profile is loaded
    if (session && profile) {
      // Redirect authenticated users away from onboarding welcome
      if (inOnboardingGroup && segments[1] === 'welcome') {
        // Only redirect from welcome screen, allow other onboarding screens
        if (profile.role === 'volunteer') {
          router.replace('/(volunteer-tabs)');
        } else {
          router.replace('/(user-tabs)');
        }
        setAppIsReady(true);
        return;
      }

      if (inAuthGroup) {
        // Route to appropriate tab group based on role immediately after auth
        if (profile.role === 'volunteer') {
          router.replace('/(volunteer-tabs)');
        } else {
          router.replace('/(user-tabs)');
        }
        setAppIsReady(true);
        return;
      }

      if (inTabsGroup) {
        // Redirect legacy (tabs) to appropriate group
        if (profile.role === 'volunteer') {
          router.replace('/(volunteer-tabs)');
        } else {
          router.replace('/(user-tabs)');
        }
        setAppIsReady(true);
        return;
      }

      // Ensure user is in correct tab group - redirect immediately if wrong
      if (inUserTabsGroup && profile.role === 'volunteer') {
        router.replace('/(volunteer-tabs)');
        setAppIsReady(true);
        return;
      }
      if (inVolunteerTabsGroup && profile.role === 'user') {
        router.replace('/(user-tabs)');
        setAppIsReady(true);
        return;
      }

      // If we're in a valid tab group and role matches, app is ready
      if ((inUserTabsGroup && profile.role === 'user') ||
          (inVolunteerTabsGroup && profile.role === 'volunteer')) {
        setAppIsReady(true);
        return;
      }

      // If we're in onboarding (but not welcome), app is ready
      if (inOnboardingGroup) {
        setAppIsReady(true);
        return;
      }
    }

    // If no session and we're in onboarding/auth, app is ready
    if (!session && (inAuthGroup || inOnboardingGroup)) {
      setAppIsReady(true);
      return;
    }

    // If we're still loading or haven't determined readiness yet, wait
    // This ensures splash screen stays visible during initial load
  }, [session, loading, segments, profile?.role, profile, router]);

  // Determine if we're in a tab group
  const inUserTabsGroup = segments[0] === '(user-tabs)';
  const inVolunteerTabsGroup = segments[0] === '(volunteer-tabs)';
  const inTabsGroup = segments[0] === '(tabs)';
  const inTabGroup = inUserTabsGroup || inVolunteerTabsGroup || inTabsGroup;

  // Check if we should keep splash visible (still loading or waiting)
  const shouldKeepSplashVisible = 
    loading || 
    !appIsReady ||
    (session && !profile && inTabGroup) ||
    (session && profile && inTabGroup && 
     ((inUserTabsGroup && profile.role !== 'user') || 
      (inVolunteerTabsGroup && profile.role !== 'volunteer'))) ||
    (inTabGroup && !session);

  // Hide splash screen only when we're ready to render content
  useEffect(() => {
    if (!shouldKeepSplashVisible && appIsReady) {
      // Add a minimum delay to ensure splash screen image is visible
      // This gives time for the native splash screen to fully render
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {
          // Ignore errors if splash screen is already hidden
        });
      }, 500); // Increased delay to ensure image is visible
      return () => clearTimeout(timer);
    }
  }, [shouldKeepSplashVisible, appIsReady]);

  // Don't render anything if we should keep splash visible
  // This ensures the splash screen stays visible during all loading states
  if (shouldKeepSplashVisible) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(user-tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(volunteer-tabs)" options={{ headerShown: false }} />
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
