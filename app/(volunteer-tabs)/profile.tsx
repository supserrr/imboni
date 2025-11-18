import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { triggerHaptic } from '@/lib/utils/accessibility';

/**
 * Volunteer profile/settings screen component.
 * Volunteer-only settings.
 */
export default function VolunteerProfileScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);

  /**
   * Handles user sign out.
   */
  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Volunteer Preferences</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            triggerHaptic('light');
            setShowLanguageSettings(!showLanguageSettings);
          }}>
          <Text style={styles.settingText}>Preferred Languages</Text>
          <Text style={styles.settingArrow}>{showLanguageSettings ? '▼' : '›'}</Text>
        </TouchableOpacity>

        {showLanguageSettings && (
          <View style={styles.subSettings}>
            <TouchableOpacity
              style={styles.subSettingItem}
              onPress={() => router.push('/(onboarding)/language')}>
              <Text style={styles.subSettingText}>Change Preferred Languages</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/support')}>
          <Text style={styles.settingText}>Support</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(onboarding)/privacy')}>
          <Text style={styles.settingText}>Privacy and terms</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.settingItem, styles.logoutItem]} onPress={handleSignOut}>
          <Text style={[styles.settingText, styles.logoutText]}>Log out</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingTop: 60,
  },
  header: {
    padding: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  settingText: {
    fontSize: 16,
    color: '#fff',
  },
  settingArrow: {
    fontSize: 20,
    color: '#999',
  },
  logoutItem: {
    backgroundColor: '#1a1a1a',
  },
  logoutText: {
    color: '#FF3B30',
  },
  subSettings: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  subSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  subSettingText: {
    fontSize: 14,
    color: '#999',
  },
});

