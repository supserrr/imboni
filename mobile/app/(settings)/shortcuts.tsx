import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

export default function ShortcutsSettings() {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const [tripleClickHome, setTripleClickHome] = useState(true);
  const [volumeButtonsControl, setVolumeButtonsControl] = useState(true);
  const [shakeToActivate, setShakeToActivate] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState(true);

  const rowBackgroundColor = colors.text;
  const textColor = colors.background;
  const subtitleColor = dark ? 'rgba(92, 58, 58, 0.7)' : 'rgba(232, 212, 232, 0.7)';
  const borderColor = dark ? 'rgba(92, 58, 58, 0.2)' : 'rgba(232, 212, 232, 0.2)';
  // Toggle colors: OFF state uses black, ON state uses background color
  const switchTrackColorFalse = '#000000'; // Black for OFF state
  const switchTrackColorTrue = colors.background; // Background color for active state
  const switchThumbColor = '#FFFFFF'; // Always white for maximum contrast

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Shortcuts</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.infoBox, { 
          backgroundColor: dark ? 'rgba(0, 122, 255, 0.15)' : 'rgba(92, 58, 58, 0.15)',
          borderColor: dark ? 'rgba(0, 122, 255, 0.3)' : 'rgba(92, 58, 58, 0.3)'
        }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Shortcuts help you quickly access key features without navigating through menus.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        </View>
        <View style={styles.section}>
          <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Triple Click Home</Text>
              <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>Triple tap home area to start AI</Text>
            </View>
            <Switch
              value={tripleClickHome}
              onValueChange={setTripleClickHome}
              trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
              thumbColor={switchThumbColor}
              ios_backgroundColor={switchTrackColorFalse}
            />
          </View>

          <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Volume Buttons</Text>
              <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>Use volume keys to control AI</Text>
            </View>
            <Switch
              value={volumeButtonsControl}
              onValueChange={setVolumeButtonsControl}
              trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
              thumbColor={switchThumbColor}
              ios_backgroundColor={switchTrackColorFalse}
            />
          </View>

          <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Shake to Activate</Text>
              <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>Shake device to request help</Text>
            </View>
            <Switch
              value={shakeToActivate}
              onValueChange={setShakeToActivate}
              trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
              thumbColor={switchThumbColor}
              ios_backgroundColor={switchTrackColorFalse}
            />
          </View>

          <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Voice Commands</Text>
              <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>Control app with voice</Text>
            </View>
            <Switch
              value={voiceCommands}
              onValueChange={setVoiceCommands}
              trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
              thumbColor={switchThumbColor}
              ios_backgroundColor={switchTrackColorFalse}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Voice Commands</Text>
        </View>
        <View style={styles.commandsSection}>
          <View style={[styles.commandRow, { backgroundColor: rowBackgroundColor }]}>
            <Text style={[styles.commandText, { color: textColor }]}>"Hey Imboni, start"</Text>
            <Text style={[styles.commandDescription, { color: subtitleColor }]}>Start AI vision</Text>
          </View>
          <View style={[styles.commandRow, { backgroundColor: rowBackgroundColor }]}>
            <Text style={[styles.commandText, { color: textColor }]}>"Hey Imboni, stop"</Text>
            <Text style={[styles.commandDescription, { color: subtitleColor }]}>Stop AI vision</Text>
          </View>
          <View style={[styles.commandRow, { backgroundColor: rowBackgroundColor }]}>
            <Text style={[styles.commandText, { color: textColor }]}>"Hey Imboni, help"</Text>
            <Text style={[styles.commandDescription, { color: subtitleColor }]}>Request human helper</Text>
          </View>
          <View style={[styles.commandRow, { backgroundColor: rowBackgroundColor }]}>
            <Text style={[styles.commandText, { color: textColor }]}>"What do you see?"</Text>
            <Text style={[styles.commandDescription, { color: subtitleColor }]}>Describe surroundings</Text>
          </View>
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
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
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
  commandsSection: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  commandRow: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  commandText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  commandDescription: {
    fontSize: 15,
  },
});

