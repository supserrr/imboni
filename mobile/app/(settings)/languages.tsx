import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../services/supabase';
import { useTheme } from '@react-navigation/native';

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
  colors: any;
  dark: boolean;
}

const LanguageRow: React.FC<LanguageRowProps> = ({ language, isSelected, onPress, colors, dark }) => {
  const rowBackgroundColor = dark ? colors.card : colors.text;
  const textColor = dark ? colors.text : colors.background;
  const subtitleColor = dark ? '#999' : 'rgba(232, 212, 232, 0.7)';
  const borderColor = dark ? '#3A3A3C' : 'rgba(232, 212, 232, 0.2)';
  const checkmarkColor = dark ? colors.primary : colors.background;
  
  return (
  <TouchableOpacity
      style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ checked: isSelected }}
    accessibilityLabel={`${language.label} - ${language.nativeName}`}
  >
    <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: textColor }]}>{language.label}</Text>
        <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>{language.nativeName}</Text>
    </View>
      {isSelected && <Ionicons name="checkmark" size={24} color={checkmarkColor} />}
  </TouchableOpacity>
);
};

export default function LanguageSettings() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { colors, dark } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Languages</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Language</Text>
          <Text style={[styles.sectionDescription, { color: dark ? '#999' : '#8B6B6B' }]}>Choose the language for the app interface</Text>
        </View>
        <View style={styles.section}>
          {LANGUAGES.map((lang) => (
            <LanguageRow
              key={`ui-${lang.code}`}
              language={lang}
              isSelected={uiLanguage === lang.code}
              onPress={() => handleChangeUILanguage(lang.code)}
              colors={colors}
              dark={dark}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Voice Language</Text>
          <Text style={[styles.sectionDescription, { color: dark ? '#999' : '#8B6B6B' }]}>
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
              colors={colors}
              dark={dark}
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
    marginLeft: 5,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 15,
  },
  section: {
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
    borderBottomWidth: 0.5,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 15,
  },
});

