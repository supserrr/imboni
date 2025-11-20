import { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, TouchableOpacity, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUp } from '@/lib/auth';
import { Link, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import VoiceLanguageSelector from '@/components/onboarding/VoiceLanguageSelector';
import { supabase } from '@/lib/supabase';
import { synthesizeSpeech } from '@/lib/bentoml-api';
import { useAudioPlayer } from 'expo-audio';
import { updateVoicePreferences } from '@/api/users';

type SignupStep = 'credentials' | 'voice-selection';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState<'blind' | 'volunteer'>('blind');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<SignupStep>('credentials');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Voice preferences state (only for blind users)
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [selectedSpeaker, setSelectedSpeaker] = useState('EN-Default');
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  const [testAudioSource, setTestAudioSource] = useState<string | null>(null);
  const testPlayer = useAudioPlayer(testAudioSource);
  
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const handleRegister = async () => {
    setLoading(true);
    const { data, error } = await signUp(email, password, type);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else if (data.user) {
      setUserId(data.user.id);
      
      // If blind user, show voice selection
      if (type === 'blind') {
        setStep('voice-selection');
    } else {
        // Volunteer - go to email confirmation
      Alert.alert('Success', 'Please check your email for confirmation.', [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
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
    if (!userId) return;

    try {
      await updateVoicePreferences(userId, {
        preferred_language: selectedLanguage,
        preferred_speaker: selectedSpeaker,
        preferred_speed: selectedSpeed,
      });

      Alert.alert('Success', 'Account created! Please check your email for confirmation.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Still show success even if save fails
      Alert.alert('Success', 'Account created! Please check your email for confirmation.', [
          { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    }
  };

  const handleSkipVoiceSelection = () => {
    // Allow skipping - will show on login if not completed
    Alert.alert('Success', 'Account created! Please check your email for confirmation.', [
      { text: 'OK', onPress: () => router.replace('/login') }
    ]);
  };

  // Voice selection step (only for blind users)
  if (step === 'voice-selection') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ThemedView style={styles.container}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <ThemedText type="title" style={styles.title}>Choose Your Voice</ThemedText>
            <ThemedText style={styles.subtitle}>
              Select your preferred language and voice accent
            </ThemedText>
            
            <VoiceLanguageSelector
              selectedLanguage={selectedLanguage}
              selectedSpeaker={selectedSpeaker}
              selectedSpeed={selectedSpeed}
              onLanguageChange={setSelectedLanguage}
              onSpeakerChange={setSelectedSpeaker}
              onSpeedChange={setSelectedSpeed}
              onTestVoice={handleTestVoice}
            />
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkipVoiceSelection}
              accessibilityLabel="Skip voice selection"
              accessibilityRole="button"
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
            
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

  // Credentials step
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
      
      <View style={styles.typeContainer}>
        <TouchableOpacity 
          style={[styles.typeButton, type === 'blind' && styles.activeType]} 
          onPress={() => setType('blind')}
          accessibilityRole="radio"
          accessibilityState={{ checked: type === 'blind' }}
        >
          <Text style={[styles.typeText, { color: textColor }, type === 'blind' && styles.activeTypeText]}>I need help</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeButton, { borderColor }, type === 'volunteer' && styles.activeType, type === 'volunteer' && { backgroundColor, borderColor }]} 
          onPress={() => setType('volunteer')}
          accessibilityRole="radio"
          accessibilityState={{ checked: type === 'volunteer' }}
        >
          <Text style={[styles.typeText, { color: textColor }, type === 'volunteer' && styles.activeTypeText]}>I want to help</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, { backgroundColor, color: textColor, borderColor }]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        placeholderTextColor={colorScheme === 'dark' ? '#bf6f4a' : '#141414'}
      />
      
      <TextInput
        style={[styles.input, { backgroundColor, color: textColor, borderColor }]}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colorScheme === 'dark' ? '#bf6f4a' : '#141414'}
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor }]} 
        onPress={handleRegister} 
        disabled={loading}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { color: textColor }]}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <Link href="/login" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <ThemedText>Already have an account? Sign In</ThemedText>
        </TouchableOpacity>
      </Link>
    </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.7,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeType: {
  },
  typeText: {
    fontSize: 16,
    fontFamily: 'Ubuntu_400Regular',
  },
  activeTypeText: {
    fontFamily: 'Ubuntu_700Bold',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Ubuntu_400Regular',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Ubuntu_700Bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    gap: 12,
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
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Ubuntu_400Regular',
  },
});
