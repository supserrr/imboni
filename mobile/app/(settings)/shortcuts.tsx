import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

const SIRI_PHRASES = [
  'Call a volunteer with Imboni',
  'Ask Imboni',
  'Request help with Imboni',
  'Get support with Imboni',
  'Connect to volunteer with Imboni',
];

const ShortcutsIcon = () => {
  return (
    <Image
      source={require('../../assets/images/shortcuts.png')}
      style={styles.shortcutsIcon}
      resizeMode="contain"
    />
  );
};

export default function ShortcutsSettings() {
  const router = useRouter();
  const { colors, dark } = useTheme();

  const handleOpenShortcutsApp = () => {
    Linking.openURL('shortcuts://');
  };

  const rowBackgroundColor = colors.text;
  const textColor = colors.background;
  const subtitleColor = dark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Shortcuts</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.descriptionSection}>
          <Text style={[styles.description, { color: colors.text }]}>
            You can trigger shortcuts with Siri using the phrases below or create your own in the Shortcuts app.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>With Siri you can say:</Text>
        </View>

        <View style={[styles.phrasesContainer, { backgroundColor: rowBackgroundColor }]}>
          {SIRI_PHRASES.map((phrase, index) => (
            <View 
              key={index} 
              style={[
                styles.phraseItem, 
                index < SIRI_PHRASES.length - 1 && { 
                  borderBottomWidth: 0.5,
                  borderBottomColor: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' 
                }
              ]}
            >
              <Text style={[styles.phraseText, { color: textColor }]}>"{phrase}"</Text>
            </View>
          ))}
        </View>

        <View style={styles.shortcutsButtonContainer}>
          <TouchableOpacity
            style={[styles.shortcutsButton, { backgroundColor: rowBackgroundColor }]}
            onPress={handleOpenShortcutsApp}
            activeOpacity={0.7}
          >
            <View style={styles.shortcutsButtonContent}>
              <ShortcutsIcon />
              <Text style={[styles.shortcutsButtonText, { color: textColor }]}>shortcuts</Text>
            </View>
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
  contentContainer: {
    paddingBottom: 40,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  phrasesContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  phraseItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  phraseText: {
    fontSize: 17,
    lineHeight: 24,
  },
  shortcutsButtonContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  shortcutsButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  shortcutsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutsIcon: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
  shortcutsButtonText: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
