import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { triggerHaptic } from '@/lib/utils/accessibility';
import { supabase } from '@/lib/supabase';

/**
 * User profile/settings screen component.
 * User-only settings.
 */
export default function UserProfileScreen() {
  const { profile, signOut, user, updateProfile } = useAuth();
  const router = useRouter();
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showSpeechRate, setShowSpeechRate] = useState(false);
  const [showVerbosity, setShowVerbosity] = useState(false);

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
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            triggerHaptic('light');
            setShowVoiceSettings(!showVoiceSettings);
          }}>
          <Text style={styles.settingText}>Voice Language & Voice</Text>
          <Text style={styles.settingArrow}>{showVoiceSettings ? '▼' : '›'}</Text>
        </TouchableOpacity>

        {showVoiceSettings && (
          <View style={styles.subSettings}>
            <TouchableOpacity
              style={styles.subSettingItem}
              onPress={() => router.push('/(onboarding)/language')}>
              <Text style={styles.subSettingText}>Change Language & Voice</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            {profile?.preferred_voice && (
              <Text style={styles.currentSetting}>Current: {profile.preferred_voice}</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            triggerHaptic('light');
            setShowSpeechRate(!showSpeechRate);
          }}>
          <Text style={styles.settingText}>Speech Rate</Text>
          <Text style={styles.settingArrow}>{showSpeechRate ? '▼' : '›'}</Text>
        </TouchableOpacity>

        {showSpeechRate && (
          <View style={styles.subSettings}>
            <Text style={styles.subSettingText}>
              Current: {profile?.speech_rate || 1.0}x
            </Text>
            <View style={styles.rateButtons}>
              {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[
                    styles.rateButton,
                    profile?.speech_rate === rate && styles.rateButtonActive,
                  ]}
                  onPress={async () => {
                    triggerHaptic('light');
                    const { error } = await updateProfile({ speech_rate: rate });
                  }}>
                  <Text
                    style={[
                      styles.rateButtonText,
                      profile?.speech_rate === rate && styles.rateButtonTextActive,
                    ]}>
                    {rate}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            triggerHaptic('light');
            setShowVerbosity(!showVerbosity);
          }}>
          <Text style={styles.settingText}>Verbosity Level</Text>
          <Text style={styles.settingArrow}>{showVerbosity ? '▼' : '›'}</Text>
        </TouchableOpacity>

        {showVerbosity && (
          <View style={styles.subSettings}>
            <TouchableOpacity
              style={[
                styles.verbosityButton,
                profile?.verbosity_level === 'detailed' && styles.verbosityButtonActive,
              ]}
              onPress={async () => {
                triggerHaptic('light');
                const { error } = await updateProfile({ verbosity_level: 'detailed' });
              }}>
              <Text
                style={[
                  styles.verbosityButtonText,
                  profile?.verbosity_level === 'detailed' && styles.verbosityButtonTextActive,
                ]}>
                Detailed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.verbosityButton,
                profile?.verbosity_level === 'concise' && styles.verbosityButtonActive,
              ]}
              onPress={async () => {
                triggerHaptic('light');
                const { error } = await updateProfile({ verbosity_level: 'concise' });
              }}>
              <Text
                style={[
                  styles.verbosityButtonText,
                  profile?.verbosity_level === 'concise' && styles.verbosityButtonTextActive,
                ]}>
                Concise
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={async () => {
            triggerHaptic('light');
            Alert.alert(
              'Delete Session History',
              'This will delete all your AI session history. This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    if (user) {
                      const { error } = await supabase
                        .from('ai_sessions')
                        .delete()
                        .eq('user_id', user.id);
                    }
                  },
                },
              ]
            );
          }}>
          <Text style={styles.settingText}>Privacy: Delete Session History</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
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
  currentSetting: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  rateButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  rateButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  rateButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#1a3a5a',
  },
  rateButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  rateButtonTextActive: {
    color: '#007AFF',
  },
  verbosityButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  verbosityButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#1a3a5a',
  },
  verbosityButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
  },
  verbosityButtonTextActive: {
    color: '#007AFF',
  },
});

