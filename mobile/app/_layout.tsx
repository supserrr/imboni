import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthProvider';
import '../utils/i18n';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, Linking } from 'react-native';
import { AuthService } from '../services/auth';

const InitialLayout = () => {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Handle OAuth deep links
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      
      // Check if this is an OAuth callback
      if (url.includes('auth/callback')) {
        try {
          await AuthService.handleOAuthCallback(url);
          router.replace('/(tabs)/home');
        } catch (error) {
          console.error('Deep link auth error:', error);
          router.replace('/(auth)/login');
        }
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inSettingsGroup = segments[0] === '(settings)';
    const onIndex = !inAuthGroup && !inTabsGroup && !inSettingsGroup;

    // If logged in and on welcome/auth screens, go to app
    if (session && (onIndex || inAuthGroup)) {
      router.replace('/(tabs)/home');
    } 
    // If not logged in and trying to access protected routes, go to welcome
    else if (!session && (inTabsGroup || inSettingsGroup)) {
      router.replace('/');
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(settings)" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
