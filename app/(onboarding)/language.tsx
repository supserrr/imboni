import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAudio } from '@/contexts/AudioContext';
import { getAvailableVoices } from '@/lib/services/audio/elevenLabsTTS';

/**
 * Common languages list.
 */
const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
];

/**
 * Language selection screen component with TTS voice selection.
 */
export default function LanguageScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  // Removed custom TTS - OS accessibility handles narration
  const [selectedLanguage, setSelectedLanguage] = useState(profile?.language || 'en');
  const [selectedVoice, setSelectedVoice] = useState<string>(profile?.preferred_voice || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingVoice, setPreviewingVoice] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Array<{ id: string; name: string }>>([]);

  // Load available voices from ElevenLabs on mount
  React.useEffect(() => {
    getAvailableVoices().then((voices) => {
      setAvailableVoices(voices);
      // Set default voice if not set
      if (!selectedVoice && voices.length > 0) {
        setSelectedVoice(voices[0].id);
      }
    }).catch((err) => {
      console.error('Failed to load ElevenLabs voices:', err);
    });
  }, []);

  /**
   * Filters languages based on search query.
   */
  const filteredLanguages = LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.native.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Previews a voice - removed, OS accessibility handles voice preview.
   *
   * @param voice - Voice identifier to preview
   */
  const previewVoice = async (voice: string) => {
    // Voice preview removed - OS screen reader handles voice selection
    // Users can test voices through their device's accessibility settings
  };

  /**
   * Handles language selection and navigation.
   */
  const handleContinue = async () => {
    if (profile) {
      await updateProfile({ 
        language: selectedLanguage,
        preferred_voice: selectedVoice,
      });
    }
    router.push('/(onboarding)/permissions');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose your language</Text>
        <Text style={styles.subtitle}>
          We will pair you with volunteers who speak the same language. You can adjust this later in
          settings.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.languagesList} contentContainerStyle={styles.languagesContent}>
        {filteredLanguages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageItem,
              selectedLanguage === language.code && styles.languageItemSelected,
            ]}
            onPress={() => setSelectedLanguage(language.code)}>
            <View>
              <Text style={styles.languageName}>{language.native}</Text>
              <Text style={styles.languageEnglish}>{language.name}</Text>
            </View>
            {selectedLanguage === language.code && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    lineHeight: 22,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  languagesList: {
    flex: 1,
  },
  languagesContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
  },
  languageItemSelected: {
    backgroundColor: '#1a3a5a',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  languageName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  languageEnglish: {
    fontSize: 14,
    color: '#999',
  },
  checkmark: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  voiceSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  voiceSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  voiceList: {
    flexDirection: 'row',
  },
  voiceButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  voiceButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#1a3a5a',
  },
  voiceButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  voiceButtonTextSelected: {
    color: '#007AFF',
  },
});

