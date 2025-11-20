import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthService } from '../../services/auth';

/**
 * OAuth callback handler
 * This screen processes the OAuth redirect from Google
 */
export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get the full URL from params
      const urlString = params.url as string;
      
      if (urlString) {
        await AuthService.handleOAuthCallback(urlString);
        // Redirect to home after successful authentication
        router.replace('/(tabs)/home');
      } else {
        // No URL params, redirect to login
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      // On error, redirect back to login
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

