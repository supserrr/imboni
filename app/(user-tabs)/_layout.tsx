import { Tabs, useRouter, Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';

/**
 * User tabs layout - only for users (blind/low vision).
 * Guards against volunteers accessing this layout.
 */
export default function UserTabLayout() {
  const colorScheme = useColorScheme();
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately if wrong role detected
    if (!loading && profile?.role === 'volunteer') {
      router.replace('/(volunteer-tabs)');
    }
  }, [profile?.role, loading, router]);

  // Show loading while profile is being fetched
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Redirect if volunteer tries to access user layout
  if (profile?.role === 'volunteer') {
    return <Redirect href="/(volunteer-tabs)" />;
  }

  // Only render tabs if user is actually a user
  if (profile?.role !== 'user') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          tabBarAccessibilityLabel: 'Home screen',
        }}
      />
      <Tabs.Screen
        name="photo"
        options={{
          title: 'Photo',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="camera.fill" color={color} />,
          tabBarAccessibilityLabel: 'Photo mode screen',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
          tabBarAccessibilityLabel: 'Settings screen',
        }}
      />
    </Tabs>
  );
}

