import { Tabs, useRouter, Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Volunteer tabs layout - only for volunteers.
 * Guards against users accessing this layout.
 */
export default function VolunteerTabLayout() {
  const colorScheme = useColorScheme();
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately if wrong role detected
    if (!loading && profile?.role === 'user') {
      router.replace('/(user-tabs)');
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

  // Redirect if user tries to access volunteer layout
  if (profile?.role === 'user') {
    return <Redirect href="/(user-tabs)" />;
  }

  // Only render tabs if user is actually a volunteer
  if (profile?.role !== 'volunteer') {
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

