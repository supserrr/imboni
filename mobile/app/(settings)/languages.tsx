import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../services/supabase';

const LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'es', label: 'Spanish', nativeName: 'Español' },
  { code: 'fr', label: 'French', nativeName: 'Français' },
  { code: 'de', label: 'German', nativeName: 'Deutsch' },
  { code: 'it', label: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', label: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', label: 'Chinese', nativeName: '中文' },
  { code: 'ja', label: 'Japanese', nativeName: '日本語' },
  { code: 'ko', label: 'Korean', nativeName: '한국어' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ru', label: 'Russian', nativeName: 'Русский' },
];

interface LanguageRowProps {
  language: typeof LANGUAGES[0];
  isSelected: boolean;
  onPress: () => void;
}

const LanguageRow: React.FC<LanguageRowProps> = ({ language, isSelected, onPress }) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ checked: isSelected }}
    accessibilityLabel={`${language.label} - ${language.nativeName}`}
  >
    <View style={styles.rowContent}>
      <Text style={styles.rowTitle}>{language.label}</Text>
      <Text style={styles.rowSubtitle}>{language.nativeName}</Text>
    </View>
    {isSelected && <Ionicons name="checkmark" size={24} color="#007AFF" />}
  </TouchableOpacity>
);

export default function LanguageSettings() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [uiLanguage, setUiLanguage] = useState(i18n.language);
  const [voiceLanguage, setVoiceLanguage] = useState(i18n.language);

  const handleChangeUILanguage = async (langCode: string) => {
    setUiLanguage(langCode);
    await i18n.changeLanguage(langCode);

    if (user?.id) {
      await supabase.from('users').update({ preferred_language: langCode }).eq('id', user.id);
    }

    Speech.speak('Language changed', { language: langCode });
  };

  const handleChangeVoiceLanguage = async (langCode: string) => {
    setVoiceLanguage(langCode);

    if (user?.id) {
      await supabase.from('users').update({ preferred_language: langCode }).eq('id', user.id);
    }

    Speech.speak('Voice language changed', { language: langCode });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Languages</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>App Language</Text>
          <Text style={styles.sectionDescription}>Choose the language for the app interface</Text>
        </View>
        <View style={styles.section}>
          {LANGUAGES.map((lang) => (
            <LanguageRow
              key={`ui-${lang.code}`}
              language={lang}
              isSelected={uiLanguage === lang.code}
              onPress={() => handleChangeUILanguage(lang.code)}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Voice Language</Text>
          <Text style={styles.sectionDescription}>
            Choose the language for AI voice responses
          </Text>
        </View>
        <View style={styles.section}>
          {LANGUAGES.map((lang) => (
            <LanguageRow
              key={`voice-${lang.code}`}
              language={lang}
              isSelected={voiceLanguage === lang.code}
              onPress={() => handleChangeVoiceLanguage(lang.code)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
    marginLeft: 5,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 15,
    color: '#999',
  },
  section: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 0.5,
    borderBottomColor: '#3A3A3C',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    color: '#fff',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 15,
    color: '#999',
  },
});

