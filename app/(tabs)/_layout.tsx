import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { profile } = useAuth();
  const isUser = profile?.role === 'user';

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
          href: isUser ? undefined : null,
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
