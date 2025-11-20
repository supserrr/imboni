import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface VoiceOption {
  language: string;
  languageName: string;
  speakers: {
    id: string;
    name: string;
  }[];
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    language: 'EN',
    languageName: 'English',
    speakers: [
      { id: 'EN-Default', name: 'Default' },
      { id: 'EN-US', name: 'American' },
      { id: 'EN-BR', name: 'British' },
      { id: 'EN_INDIA', name: 'Indian' },
      { id: 'EN-AU', name: 'Australian' },
    ],
  },
  {
    language: 'ES',
    languageName: 'Spanish',
    speakers: [
      { id: 'ES', name: 'Spanish' },
    ],
  },
  {
    language: 'FR',
    languageName: 'French',
    speakers: [
      { id: 'FR', name: 'French' },
    ],
  },
  {
    language: 'ZH',
    languageName: 'Chinese',
    speakers: [
      { id: 'ZH', name: 'Chinese' },
    ],
  },
  {
    language: 'JP',
    languageName: 'Japanese',
    speakers: [
      { id: 'JP', name: 'Japanese' },
    ],
  },
  {
    language: 'KR',
    languageName: 'Korean',
    speakers: [
      { id: 'KR', name: 'Korean' },
    ],
  },
];

export interface VoiceLanguageSelectorProps {
  selectedLanguage: string;
  selectedSpeaker: string;
  selectedSpeed: number;
  onLanguageChange: (language: string) => void;
  onSpeakerChange: (speaker: string) => void;
  onSpeedChange: (speed: number) => void;
  onTestVoice?: (language: string, speaker: string) => void;
}

/**
 * Component for selecting voice language, speaker, and speed preferences.
 * Designed for blind users during onboarding.
 */
export default function VoiceLanguageSelector({
  selectedLanguage,
  selectedSpeaker,
  selectedSpeed,
  onLanguageChange,
  onSpeakerChange,
  onSpeedChange,
  onTestVoice,
}: VoiceLanguageSelectorProps) {
  const [expandedLanguage, setExpandedLanguage] = useState<string | null>(selectedLanguage);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({}, 'secondaryText');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  const selectedVoiceOption = AVAILABLE_VOICES.find(v => v.language === selectedLanguage);
  const selectedSpeakerOption = selectedVoiceOption?.speakers.find(s => s.id === selectedSpeaker);

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: textColor }]}>Select Your Preferred Voice</Text>
      <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
        Choose the language and voice accent you'd like to hear
      </Text>

      {/* Language Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Language</Text>
        <View style={styles.optionsGrid}>
          {AVAILABLE_VOICES.map((voice) => (
            <TouchableOpacity
              key={voice.language}
              style={[
                styles.optionButton,
                { backgroundColor: cardBackground, borderColor: borderColor },
                selectedLanguage === voice.language && [styles.optionButtonSelected, { borderColor: '#bf6f4a' }],
              ]}
              onPress={() => {
                onLanguageChange(voice.language);
                setExpandedLanguage(voice.language);
                // Auto-select first speaker when language changes
                if (voice.speakers.length > 0) {
                  onSpeakerChange(voice.speakers[0].id);
                }
              }}
              accessibilityLabel={`Select ${voice.languageName} language`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.optionText,
                  { color: textColor },
                  selectedLanguage === voice.language && styles.optionTextSelected,
                ]}
              >
                {voice.languageName}
              </Text>
              {selectedLanguage === voice.language && (
                <IconSymbol name="checkmark.circle.fill" size={20} color="#bf6f4a" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Speaker Selection */}
      {selectedVoiceOption && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Voice Accent</Text>
          <View style={styles.optionsGrid}>
            {selectedVoiceOption.speakers.map((speaker) => (
              <TouchableOpacity
                key={speaker.id}
                style={[
                  styles.optionButton,
                  { backgroundColor: cardBackground, borderColor: borderColor },
                  selectedSpeaker === speaker.id && [styles.optionButtonSelected, { borderColor: '#bf6f4a' }],
                ]}
                onPress={() => {
                  onSpeakerChange(speaker.id);
                  onTestVoice?.(selectedVoiceOption.language, speaker.id);
                }}
                accessibilityLabel={`Select ${speaker.name} accent`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: textColor },
                    selectedSpeaker === speaker.id && styles.optionTextSelected,
                  ]}
                >
                  {speaker.name}
                </Text>
                {selectedSpeaker === speaker.id && (
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#bf6f4a" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {onTestVoice && (
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: cardBackground, borderColor: '#bf6f4a' }]}
              onPress={() => onTestVoice(selectedVoiceOption.language, selectedSpeaker)}
              accessibilityLabel="Test voice"
              accessibilityRole="button"
            >
              <IconSymbol name="play.circle.fill" size={24} color="#bf6f4a" />
              <Text style={styles.testButtonText}>Test Voice</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Speed Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Speech Speed</Text>
        <View style={styles.speedContainer}>
          <Text style={[styles.speedLabel, { color: secondaryTextColor }]}>Slow</Text>
          <View style={styles.speedButtons}>
            {[0.75, 1.0, 1.25, 1.5].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedButton,
                  { backgroundColor: cardBackground, borderColor: borderColor },
                  selectedSpeed === speed && [styles.speedButtonSelected, { borderColor: '#bf6f4a' }],
                ]}
                onPress={() => onSpeedChange(speed)}
                accessibilityLabel={`Set speed to ${speed}x`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.speedButtonText,
                    { color: textColor },
                    selectedSpeed === speed && styles.speedButtonTextSelected,
                  ]}
                >
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.speedLabel, { color: secondaryTextColor }]}>Fast</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Ubuntu_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Ubuntu_400Regular',
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Ubuntu_500Medium',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 120,
    justifyContent: 'center',
    gap: 8,
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(191, 111, 74, 0.2)',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Ubuntu_500Medium',
  },
  optionTextSelected: {
    color: '#bf6f4a',
    fontFamily: 'Ubuntu_500Medium',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    color: '#bf6f4a',
    fontFamily: 'Ubuntu_500Medium',
  },
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  speedLabel: {
    fontSize: 14,
    fontFamily: 'Ubuntu_400Regular',
    minWidth: 50,
  },
  speedButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  speedButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  speedButtonSelected: {
    backgroundColor: 'rgba(191, 111, 74, 0.2)',
  },
  speedButtonText: {
    fontSize: 16,
    fontFamily: 'Ubuntu_500Medium',
  },
  speedButtonTextSelected: {
    color: '#bf6f4a',
    fontFamily: 'Ubuntu_500Medium',
  },
});

