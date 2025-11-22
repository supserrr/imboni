import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../services/supabase';
import { useTheme } from '@react-navigation/native';

const ALL_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Español', nativeName: 'Spanish' },
  { code: 'fr', name: 'Français', nativeName: 'French' },
  { code: 'de', name: 'Deutsch', nativeName: 'German' },
  { code: 'it', name: 'Italiano', nativeName: 'Italian' },
  { code: 'pt', name: 'Português', nativeName: 'Portuguese' },
  { code: 'zh', name: '中文', nativeName: 'Chinese' },
  { code: 'ja', name: '日本語', nativeName: 'Japanese' },
  { code: 'ko', name: '한국어', nativeName: 'Korean' },
  { code: 'ar', name: 'العربية', nativeName: 'Arabic' },
  { code: 'hi', name: 'हिन्दी', nativeName: 'Hindi' },
  { code: 'ru', name: 'Русский', nativeName: 'Russian' },
  { code: 'ab', name: 'Abkhazian', nativeName: 'Abkhazian' },
  { code: 'aa', name: 'Afar', nativeName: 'Afar' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'ak', name: 'Akan', nativeName: 'Akan' },
  { code: 'sq', name: 'Shqip', nativeName: 'Albanian' },
  { code: 'am', name: 'አማርኛ', nativeName: 'Amharic' },
];

const SUGGESTED_LANGUAGES = [
  { code: 'es', name: 'Español', nativeName: 'Spanish' },
];

export default function SecondaryLanguagesSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, dark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  useEffect(() => {
    loadSecondaryLanguages();
  }, []);

  const loadSecondaryLanguages = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('users')
        .select('secondary_languages')
        .eq('id', user.id)
        .single();

      if (data?.secondary_languages && Array.isArray(data.secondary_languages)) {
        setSelectedLanguages(data.secondary_languages);
      }
    } catch (error) {
      console.error('Error loading secondary languages:', error);
    }
  };

  const handleToggleLanguage = async (langCode: string) => {
    const newSelected = selectedLanguages.includes(langCode)
      ? selectedLanguages.filter(code => code !== langCode)
      : [...selectedLanguages, langCode];
    
    setSelectedLanguages(newSelected);
    
    if (user?.id) {
      await supabase
        .from('users')
        .update({ secondary_languages: newSelected })
        .eq('id', user.id);
    }
  };

  const filteredLanguages = ALL_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rowBackgroundColor = colors.text;
  const textColor = colors.background;
  const subtitleColor = dark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const borderColor = dark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
  const searchBackgroundColor = dark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
  const searchIconColor = dark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const sectionTitleColor = dark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Languages</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Other languages</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.searchContainer, { backgroundColor: searchBackgroundColor }]}>
          <Ionicons name="search" size={20} color={searchIconColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search"
            placeholderTextColor={searchIconColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.infoText}>
          <Text style={[styles.infoTextContent, { color: colors.text }]}>
            In the unlikely situation where there are no available volunteers who speak your primary language, we will try to connect you to someone speaking your secondary language. If you speak other languages, please add them here.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>SUGGESTED LANGUAGES</Text>
        </View>
        <View style={styles.section}>
          {SUGGESTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.languageRow, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}
              onPress={() => handleToggleLanguage(lang.code)}
            >
              <View style={styles.languageContent}>
                <Text style={[styles.languageName, { color: textColor }]}>{lang.name}</Text>
                <Text style={[styles.languageNative, { color: subtitleColor }]}>{lang.nativeName}</Text>
              </View>
              {selectedLanguages.includes(lang.code) && (
                <Ionicons name="checkmark" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>ALL LANGUAGES</Text>
        </View>
        <View style={styles.section}>
          {filteredLanguages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.languageRow, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}
              onPress={() => handleToggleLanguage(lang.code)}
            >
              <View style={styles.languageContent}>
                <Text style={[styles.languageName, { color: textColor }]}>{lang.name}</Text>
                <Text style={[styles.languageNative, { color: subtitleColor }]}>{lang.nativeName}</Text>
              </View>
              {selectedLanguages.includes(lang.code) && (
                <Ionicons name="checkmark" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
  },
  infoText: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoTextContent: {
    fontSize: 17,
    lineHeight: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  languageContent: {
    flex: 1,
  },
  languageName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 15,
  },
});

