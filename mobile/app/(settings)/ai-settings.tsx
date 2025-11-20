import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../services/supabase';
import { useTheme } from '@react-navigation/native';

const VOICE_SPEEDS = [
  { value: 0.5, label: 'Very Slow' },
  { value: 0.75, label: 'Slow' },
  { value: 1.0, label: 'Normal' },
  { value: 1.25, label: 'Fast' },
  { value: 1.5, label: 'Very Fast' },
];

const ANALYSIS_INTERVALS = [
  { value: 3, label: '3 seconds' },
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 15, label: '15 seconds' },
  { value: 30, label: '30 seconds' },
];

export default function AISettings() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, dark } = useTheme();
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [analysisInterval, setAnalysisInterval] = useState(5);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [detailedDescriptions, setDetailedDescriptions] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);

  const handleSaveVoiceSpeed = async (speed: number) => {
    setVoiceSpeed(speed);
    if (user?.id) {
      await supabase.from('users').update({ preferred_speed: speed }).eq('id', user.id);
    }
  };

  const handleSaveInterval = (interval: number) => {
    setAnalysisInterval(interval);
    // Save to preferences
  };

  const rowBackgroundColor = colors.text;
  const textColor = colors.background;
  const subtitleColor = dark ? 'rgba(92, 58, 58, 0.7)' : 'rgba(232, 212, 232, 0.7)';
  const borderColor = dark ? 'rgba(92, 58, 58, 0.2)' : 'rgba(232, 212, 232, 0.2)';
  // Toggle colors: OFF state uses black, ON state uses background color
  const switchTrackColorFalse = '#000000'; // Black for OFF state
  const switchTrackColorTrue = colors.background; // Background color for active state
  const switchThumbColor = '#FFFFFF'; // Always white for maximum contrast
  // Slider colors: Use iOS-style blue for active portion
  const sliderMinColor = '#007AFF'; // iOS blue
  const sliderMaxColor = dark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(120, 120, 128, 0.32)';
  const sliderThumbColor = '#FFFFFF'; // White thumb with shadow for visibility

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>AI Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Voice Settings</Text>
        </View>
        <View style={styles.section}>
          <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Auto-speak Results</Text>
              <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>Automatically read AI descriptions</Text>
            </View>
            <Switch
              value={autoSpeak}
              onValueChange={setAutoSpeak}
              trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
              thumbColor={switchThumbColor}
              ios_backgroundColor={switchTrackColorFalse}
            />
          </View>
        </View>

        <View style={[styles.sliderSection, { backgroundColor: rowBackgroundColor }]}>
          <Text style={[styles.sliderLabel, { color: textColor }]}>Voice Speed</Text>
          <Text style={[styles.sliderValue, { color: textColor }]}>
            {VOICE_SPEEDS.find((s) => s.value === voiceSpeed)?.label}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={1.5}
            step={0.25}
            value={voiceSpeed}
            onValueChange={setVoiceSpeed}
            onSlidingComplete={handleSaveVoiceSpeed}
            minimumTrackTintColor={sliderMinColor}
            maximumTrackTintColor={sliderMaxColor}
            thumbTintColor={sliderThumbColor}
          />
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabelText, { color: subtitleColor }]}>Slower</Text>
            <Text style={[styles.sliderLabelText, { color: subtitleColor }]}>Faster</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Analysis Settings</Text>
        </View>
        <View style={styles.section}>
          <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Detailed Descriptions</Text>
              <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>More verbose AI responses</Text>
            </View>
            <Switch
              value={detailedDescriptions}
              onValueChange={setDetailedDescriptions}
              trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
              thumbColor={switchThumbColor}
              ios_backgroundColor={switchTrackColorFalse}
            />
          </View>
        </View>

        <View style={[styles.sliderSection, { backgroundColor: rowBackgroundColor }]}>
          <Text style={[styles.sliderLabel, { color: textColor }]}>Analysis Interval</Text>
          <Text style={[styles.sliderValue, { color: textColor }]}>{analysisInterval} seconds</Text>
          <Slider
            style={styles.slider}
            minimumValue={3}
            maximumValue={30}
            step={1}
            value={analysisInterval}
            onValueChange={setAnalysisInterval}
            onSlidingComplete={handleSaveInterval}
            minimumTrackTintColor={sliderMinColor}
            maximumTrackTintColor={sliderMaxColor}
            thumbTintColor={sliderThumbColor}
          />
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabelText, { color: subtitleColor }]}>3s</Text>
            <Text style={[styles.sliderLabelText, { color: subtitleColor }]}>30s</Text>
          </View>
        </View>

        <View style={[styles.sliderSection, { backgroundColor: rowBackgroundColor }]}>
          <Text style={[styles.sliderLabel, { color: textColor }]}>Confidence Threshold</Text>
          <Text style={[styles.sliderValue, { color: textColor }]}>{Math.round(confidenceThreshold * 100)}%</Text>
          <Text style={[styles.sliderDescription, { color: subtitleColor }]}>
            Request human help when AI confidence is below this level
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0.3}
            maximumValue={0.9}
            step={0.1}
            value={confidenceThreshold}
            onValueChange={setConfidenceThreshold}
            minimumTrackTintColor={sliderMinColor}
            maximumTrackTintColor={sliderMaxColor}
            thumbTintColor={sliderThumbColor}
          />
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabelText, { color: subtitleColor }]}>30%</Text>
            <Text style={[styles.sliderLabelText, { color: subtitleColor }]}>90%</Text>
          </View>
        </View>

        <View style={[styles.infoBox, {
          backgroundColor: dark ? 'rgba(0, 122, 255, 0.15)' : 'rgba(92, 58, 58, 0.15)',
          borderColor: dark ? 'rgba(0, 122, 255, 0.3)' : 'rgba(92, 58, 58, 0.3)'
        }]}>
          <Ionicons name="bulb-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Lower confidence thresholds may result in more frequent requests for human assistance,
            but will ensure more accurate information.
          </Text>
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
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
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
    marginRight: 16,
  },
  rowTitle: {
    fontSize: 17,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 15,
  },
  sliderSection: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 20,
    borderRadius: 12,
  },
  sliderLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 15,
    marginBottom: 4,
  },
  sliderDescription: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabelText: {
    fontSize: 13,
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 40,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    lineHeight: 20,
  },
});

