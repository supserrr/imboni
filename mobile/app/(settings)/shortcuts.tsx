import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ShortcutsSettings() {
  const router = useRouter();
  const [tripleClickHome, setTripleClickHome] = useState(true);
  const [volumeButtonsControl, setVolumeButtonsControl] = useState(true);
  const [shakeToActivate, setShakeToActivate] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shortcuts</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.infoText}>
            Shortcuts help you quickly access key features without navigating through menus.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Triple Click Home</Text>
              <Text style={styles.rowSubtitle}>Triple tap home area to start AI</Text>
            </View>
            <Switch
              value={tripleClickHome}
              onValueChange={setTripleClickHome}
              trackColor={{ false: '#3A3A3C', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Volume Buttons</Text>
              <Text style={styles.rowSubtitle}>Use volume keys to control AI</Text>
            </View>
            <Switch
              value={volumeButtonsControl}
              onValueChange={setVolumeButtonsControl}
              trackColor={{ false: '#3A3A3C', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Shake to Activate</Text>
              <Text style={styles.rowSubtitle}>Shake device to request help</Text>
            </View>
            <Switch
              value={shakeToActivate}
              onValueChange={setShakeToActivate}
              trackColor={{ false: '#3A3A3C', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Voice Commands</Text>
              <Text style={styles.rowSubtitle}>Control app with voice</Text>
            </View>
            <Switch
              value={voiceCommands}
              onValueChange={setVoiceCommands}
              trackColor={{ false: '#3A3A3C', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Voice Commands</Text>
        </View>
        <View style={styles.commandsSection}>
          <View style={styles.commandRow}>
            <Text style={styles.commandText}>"Hey Imboni, start"</Text>
            <Text style={styles.commandDescription}>Start AI vision</Text>
          </View>
          <View style={styles.commandRow}>
            <Text style={styles.commandText}>"Hey Imboni, stop"</Text>
            <Text style={styles.commandDescription}>Stop AI vision</Text>
          </View>
          <View style={styles.commandRow}>
            <Text style={styles.commandText}>"Hey Imboni, help"</Text>
            <Text style={styles.commandDescription}>Request human helper</Text>
          </View>
          <View style={styles.commandRow}>
            <Text style={styles.commandText}>"What do you see?"</Text>
            <Text style={styles.commandDescription}>Describe surroundings</Text>
          </View>
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
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
  commandsSection: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  commandRow: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  commandText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 6,
  },
  commandDescription: {
    fontSize: 15,
    color: '#999',
  },
});

