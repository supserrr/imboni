import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../services/supabase';

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Voice Settings</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Auto-speak Results</Text>
              <Text style={styles.rowSubtitle}>Automatically read AI descriptions</Text>
            </View>
            <Switch
              value={autoSpeak}
              onValueChange={setAutoSpeak}
              trackColor={{ false: '#3A3A3C', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.sliderSection}>
          <Text style={styles.sliderLabel}>Voice Speed</Text>
          <Text style={styles.sliderValue}>
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
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#3A3A3C"
            thumbTintColor="#007AFF"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Slower</Text>
            <Text style={styles.sliderLabelText}>Faster</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Analysis Settings</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Detailed Descriptions</Text>
              <Text style={styles.rowSubtitle}>More verbose AI responses</Text>
            </View>
            <Switch
              value={detailedDescriptions}
              onValueChange={setDetailedDescriptions}
              trackColor={{ false: '#3A3A3C', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.sliderSection}>
          <Text style={styles.sliderLabel}>Analysis Interval</Text>
          <Text style={styles.sliderValue}>{analysisInterval} seconds</Text>
          <Slider
            style={styles.slider}
            minimumValue={3}
            maximumValue={30}
            step={1}
            value={analysisInterval}
            onValueChange={setAnalysisInterval}
            onSlidingComplete={handleSaveInterval}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#3A3A3C"
            thumbTintColor="#007AFF"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>3s</Text>
            <Text style={styles.sliderLabelText}>30s</Text>
          </View>
        </View>

        <View style={styles.sliderSection}>
          <Text style={styles.sliderLabel}>Confidence Threshold</Text>
          <Text style={styles.sliderValue}>{Math.round(confidenceThreshold * 100)}%</Text>
          <Text style={styles.sliderDescription}>
            Request human help when AI confidence is below this level
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0.3}
            maximumValue={0.9}
            step={0.1}
            value={confidenceThreshold}
            onValueChange={setConfidenceThreshold}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#3A3A3C"
            thumbTintColor="#007AFF"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>30%</Text>
            <Text style={styles.sliderLabelText}>90%</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="bulb-outline" size={24} color="#007AFF" />
          <Text style={styles.infoText}>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
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
    marginRight: 16,
  },
  rowTitle: {
    fontSize: 17,
    color: '#fff',
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 15,
    color: '#999',
  },
  sliderSection: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 20,
    borderRadius: 12,
  },
  sliderLabel: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 15,
    color: '#007AFF',
    marginBottom: 4,
  },
  sliderDescription: {
    fontSize: 13,
    color: '#999',
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
    color: '#999',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    marginBottom: 40,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },
});

