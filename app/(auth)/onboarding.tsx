import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAppStore } from '@/store/app-store';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import VoiceLanguageSelector from '@/components/onboarding/VoiceLanguageSelector';
import { supabase } from '@/lib/supabase';
import { synthesizeSpeech } from '@/lib/bentoml-api';
import { useAudioPlayer } from 'expo-audio';
import { updateVoicePreferences } from '@/api/users';

/**
 * Onboarding screen that handles:
 * - Voice/language selection for blind users
 * - Direct routing for volunteers
 */
export default function Onboarding() {
  const { user, userType } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showVoiceSelection, setShowVoiceSelection] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [selectedSpeaker, setSelectedSpeaker] = useState('EN-Default');
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  const [testAudioSource, setTestAudioSource] = useState<string | null>(null);
  const testPlayer = useAudioPlayer(testAudioSource);

  useEffect(() => {
    if (!user || !userType) {
      return;
    }

    // Check if user already has preferences set
    checkUserPreferences();
  }, [user, userType]);

  const checkUserPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('preferred_language, preferred_speaker, preferred_speed')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (user not in users table yet)
        console.error('Error checking preferences:', error);
      }

      if (data) {
        // User has preferences, skip onboarding
        if (data.preferred_language) {
          setSelectedLanguage(data.preferred_language);
        }
        if (data.preferred_speaker) {
          setSelectedSpeaker(data.preferred_speaker);
        }
        if (data.preferred_speed) {
          setSelectedSpeed(data.preferred_speed);
        }

        // If blind user has preferences, go to live screen
        if (userType === 'blind' && data.preferred_language) {
          router.replace('/(blind)/live');
          return;
        }
      }

      // Show voice selection ONLY if blind user doesn't have preferences
      // (This means they skipped during signup or it wasn't completed)
      if (userType === 'blind' && (!data || !data.preferred_language)) {
        setIsLoading(false);
        setShowVoiceSelection(true);
      } else if (userType === 'blind') {
        // Has preferences, go to live
        router.replace('/(blind)/live');
      } else {
        // Volunteers go straight to home
        router.replace('/(volunteer)/home');
      }
    } catch (error) {
      console.error('Error in checkUserPreferences:', error);
      setIsLoading(false);
    if (userType === 'blind') {
        // On error, show voice selection as fallback
        setShowVoiceSelection(true);
      } else {
        router.replace('/(volunteer)/home');
      }
    }
  };

  const handleTestVoice = async (language: string, speaker: string) => {
    try {
      const testText = 'Hello, this is a test of your selected voice.';
      const base64Audio = await synthesizeSpeech(testText, language, speaker, selectedSpeed);
      const uri = `data:audio/wav;base64,${base64Audio}`;
      setTestAudioSource(uri);
      testPlayer.play();
    } catch (error) {
      console.error('Error testing voice:', error);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    try {
      await updateVoicePreferences(user.id, {
        preferred_language: selectedLanguage,
        preferred_speaker: selectedSpeaker,
        preferred_speed: selectedSpeed,
      });

      // Navigate to live screen
      router.replace('/(blind)/live');
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Still navigate even if save fails
      router.replace('/(blind)/live');
    }
  };

  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ThemedView style={styles.container}>
          <ActivityIndicator size="large" color="#bf6f4a" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (showVoiceSelection) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ThemedView style={styles.container}>
          <VoiceLanguageSelector
            selectedLanguage={selectedLanguage}
            selectedSpeaker={selectedSpeaker}
            selectedSpeed={selectedSpeed}
            onLanguageChange={setSelectedLanguage}
            onSpeakerChange={setSelectedSpeaker}
            onSpeedChange={setSelectedSpeed}
            onTestVoice={handleTestVoice}
          />
          <View style={[styles.footer, { borderTopColor: borderColor, backgroundColor }]}>
            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor }]}
              onPress={handleSavePreferences}
              accessibilityLabel="Continue with selected preferences"
              accessibilityRole="button"
            >
              <Text style={[styles.continueButtonText, { color: textColor }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Ubuntu_500Medium',
  },
});
