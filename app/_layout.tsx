import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/app-store';
import { getUserProfile } from '@/lib/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
