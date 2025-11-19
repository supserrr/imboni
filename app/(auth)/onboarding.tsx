// This file might be redundant if registration handles type selection, 
// but can be used for post-signup setup or role switching if allowed.
// For now, redirecting to appropriate home based on type.
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAppStore } from '@/store/app-store';
import { View, ActivityIndicator } from 'react-native';

export default function Onboarding() {
  const { user, userType } = useAppStore();

  useEffect(() => {
    if (userType === 'blind') {
      router.replace('/(blind)/live');
    } else if (userType === 'volunteer') {
      router.replace('/(volunteer)/home');
    }
  }, [userType]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

