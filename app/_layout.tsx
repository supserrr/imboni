import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform } from 'react-native';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import {
  Ubuntu_300Light,
  Ubuntu_300Light_Italic,
  Ubuntu_400Regular,
  Ubuntu_400Regular_Italic,
  Ubuntu_500Medium,
  Ubuntu_500Medium_Italic,
  Ubuntu_700Bold,
  Ubuntu_700Bold_Italic,
  useFonts,
} from '@expo-google-fonts/ubuntu';
import * as SplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/app-store';
import { getUserProfile } from '@/lib/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Prevent splash screen from auto-hiding while fonts are loading
SplashScreen.preventAutoHideAsync();

// Suppress known harmless reanimated warnings
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
]);

const queryClient = new QueryClient();

export const unstable_settings = {
  initialRouteName: '(auth)/login',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { setUser, setUserType, setIsLoading, userType, user } = useAppStore();

  // Configure system bars
  useEffect(() => {
    // Set navigation bar style for Android (dark content on light background)
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#000000');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchUserType(session.user.id);
      } else {
        setIsLoading(false);
        router.replace('/(auth)/login');
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        fetchUserType(session.user.id);
      } else {
        setUserType(null);
        setIsLoading(false);
        router.replace('/(auth)/login');
      }
    });
  }, []);

  const fetchUserType = async (userId: string) => {
    const { data } = await getUserProfile(userId);
    if (data) {
      setUserType(data.type);
      if (data.type === 'blind') {
        router.replace('/(blind)/live');
      } else {
        router.replace('/(volunteer)/home');
      }
    }
    setIsLoading(false);
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(blind)" options={{ headerShown: false }} />
        <Stack.Screen name="(volunteer)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // Load Ubuntu font variants
  const [fontsLoaded, fontError] = useFonts({
    Ubuntu_300Light,
    Ubuntu_300Light_Italic,
    Ubuntu_400Regular,
    Ubuntu_400Regular_Italic,
    Ubuntu_500Medium,
    Ubuntu_500Medium_Italic,
    Ubuntu_700Bold,
    Ubuntu_700Bold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide splash screen once fonts are loaded or if there's an error
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
    </SafeAreaProvider>
  );
}
