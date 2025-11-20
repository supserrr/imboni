import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthProvider';
import { ThemeProvider as AppThemeProvider } from '../context/ThemeContext';
import '../utils/i18n';
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, Linking, Platform } from 'react-native';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { LightNavigationTheme, DarkNavigationTheme } from '../constants/navigation-theme';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { UserType } from '../types/user';
import { useColorScheme } from '../hooks/use-color-scheme';

const InitialLayout = () => {
  const { session, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkNavigationTheme : LightNavigationTheme;
  const [userType, setUserType] = useState<UserType | null>(null);
  const [fetchingUserType, setFetchingUserType] = useState(false);

  // Sync native theme with app theme
  useEffect(() => {
    const scheme = colorScheme ?? 'light';
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        document.documentElement.style.colorScheme = scheme;
      }
    }
  }, [colorScheme]);

  // Fetch user type when logged in
  useEffect(() => {
    const fetchUserType = async () => {
      if (user?.id && !fetchingUserType) {
        setFetchingUserType(true);
        try {
          const profile = await UserService.getProfile(user.id);
          setUserType(profile?.type || 'blind');
        } catch (error) {
          console.error('Error fetching user type:', error);
          setUserType('blind'); // Default to blind if error
        } finally {
          setFetchingUserType(false);
        }
      }
    };
    
    fetchUserType();
  }, [user?.id]);

  // Handle OAuth deep links
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      
      // Check if this is an OAuth callback
      if (url.includes('auth/callback')) {
        try {
          const result = await AuthService.handleOAuthCallback(url);
          
          // Check if email is verified
          const emailVerified = result?.user?.email_confirmed_at != null;
          
          if (emailVerified) {
            // Wait for user type to be fetched
            if (result?.user?.id) {
              const profile = await UserService.getProfile(result.user.id);
              const type = profile?.type || 'blind';
              setUserType(type);
              
              if (type === 'blind') {
                router.replace('/(blind-tabs)/home');
              } else {
                router.replace('/(volunteer-tabs)/home');
              }
            }
          } else {
            router.replace('/(auth)/verify-email');
          }
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
    if (isLoading || fetchingUserType) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inBlindTabsGroup = segments[0] === '(blind-tabs)';
    const inVolunteerTabsGroup = segments[0] === '(volunteer-tabs)';
    const inSettingsGroup = segments[0] === '(settings)';
    const inProtectedRoute = inBlindTabsGroup || inVolunteerTabsGroup || inSettingsGroup;
    const onIndex = !inAuthGroup && !inBlindTabsGroup && !inVolunteerTabsGroup && !inSettingsGroup;
    const onVerifyEmail = segments[1] === 'verify-email';

    // If logged in
    if (session) {
      // Check if email is verified
      const emailVerified = session.user?.email_confirmed_at != null;
      
      // If email not verified and not already on verify-email screen
      if (!emailVerified && !onVerifyEmail) {
        router.replace('/(auth)/verify-email');
      }
      // If email verified and on welcome/auth screens (except verify-email), go to appropriate tab group
      else if (emailVerified && (onIndex || (inAuthGroup && !onVerifyEmail)) && userType) {
        if (userType === 'blind') {
          router.replace('/(blind-tabs)/home');
        } else {
          router.replace('/(volunteer-tabs)/home');
        }
      }
      // Guard: ensure user is in the correct tab group based on their type
      else if (emailVerified && userType) {
        if (userType === 'blind' && inVolunteerTabsGroup) {
          router.replace('/(blind-tabs)/home');
        } else if (userType === 'volunteer' && inBlindTabsGroup) {
          router.replace('/(volunteer-tabs)/home');
        }
      }
    } 
    // If not logged in and trying to access protected routes, go to welcome
    else if (!session && inProtectedRoute) {
      router.replace('/');
    }
  }, [session, isLoading, segments, userType, fetchingUserType]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavThemeProvider value={theme}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(blind-tabs)" />
      <Stack.Screen name="(volunteer-tabs)" />
      <Stack.Screen name="(settings)" />
    </Stack>
    </NavThemeProvider>
  );
};

export default function RootLayout() {
  return (
    <AppThemeProvider>
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
    </AppThemeProvider>
  );
}
