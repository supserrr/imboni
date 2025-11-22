import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../services/supabase';
import { useTheme } from '@react-navigation/native';

export default function LanguageSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, dark } = useTheme();
  const [primaryLanguage, setPrimaryLanguage] = useState('English');
  const [secondaryLanguagesCount, setSecondaryLanguagesCount] = useState(0);

  useEffect(() => {
    loadLanguagePreferences();
  }, [user]);

  const loadLanguagePreferences = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('users')
        .select('preferred_language, secondary_languages')
        .eq('id', user.id)
        .single();

      if (data) {
        if (data.preferred_language) {
          const langName = getLanguageName(data.preferred_language);
          setPrimaryLanguage(langName);
        }
        if (data.secondary_languages && Array.isArray(data.secondary_languages)) {
          setSecondaryLanguagesCount(data.secondary_languages.length);
        }
      }
    } catch (error) {
      console.error('Error loading language preferences:', error);
    }
  };

  const getLanguageName = (code: string): string => {
    const languages: { [key: string]: string } = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'zh': '中文',
      'ja': '日本語',
      'ko': '한국어',
      'ar': 'العربية',
      'hi': 'हिन्दी',
      'ru': 'Русский',
    };
    return languages[code] || 'English';
  };

  const rowBackgroundColor = colors.text;
  const textColor = colors.background;
  const valueColor = dark ? 'rgba(92, 58, 58, 0.7)' : 'rgba(232, 212, 232, 0.7)';
  const borderColor = dark ? 'rgba(92, 58, 58, 0.2)' : 'rgba(232, 212, 232, 0.2)';
  const chevronColor = dark ? 'rgba(92, 58, 58, 0.6)' : 'rgba(232, 212, 232, 0.6)';

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
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}
            onPress={() => router.push('/(settings)/primary-language')}
          >
            <Text style={[styles.rowTitle, { color: textColor }]}>Primary language</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: valueColor }]}>{primaryLanguage}</Text>
              <Ionicons name="chevron-forward" size={20} color={chevronColor} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: rowBackgroundColor }]}
            onPress={() => router.push('/(settings)/secondary-languages')}
          >
            <Text style={[styles.rowTitle, { color: textColor }]}>Secondary languages</Text>
            <Ionicons name="chevron-forward" size={20} color={chevronColor} />
          </TouchableOpacity>
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
  rowTitle: {
    fontSize: 17,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontSize: 17,
  },
});
