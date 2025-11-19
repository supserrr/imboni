import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

/**
 * Settings screen for users.
 * Contains voice selection, speech rate, verbosity, privacy options, and sign out.
 */
export function Settings() {
  const { user, logout } = useAuth();
  const [speechRate, setSpeechRate] = useState(1.0);
  const [verbosity, setVerbosity] = useState('normal');
  const [privacyEnabled, setPrivacyEnabled] = useState(true);

  /**
   * Handles sign out.
   */
  const handleSignOut = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Settings</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Speech Rate</Text>
            <View style={styles.rateControls}>
              <TouchableOpacity
                style={styles.rateButton}
                onPress={() => setSpeechRate(Math.max(0.5, speechRate - 0.1))}
              >
                <Text style={styles.rateButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.rateValue}>{speechRate.toFixed(1)}x</Text>
              <TouchableOpacity
                style={styles.rateButton}
                onPress={() => setSpeechRate(Math.min(2.0, speechRate + 0.1))}
              >
                <Text style={styles.rateButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Verbosity</Text>
            <View style={styles.verbosityControls}>
              <TouchableOpacity
                style={[
                  styles.verbosityButton,
                  verbosity === 'minimal' && styles.verbosityButtonActive,
                ]}
                onPress={() => setVerbosity('minimal')}
              >
                <Text
                  style={[
                    styles.verbosityButtonText,
                    verbosity === 'minimal' && styles.verbosityButtonTextActive,
                  ]}
                >
                  Minimal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.verbosityButton,
                  verbosity === 'normal' && styles.verbosityButtonActive,
                ]}
                onPress={() => setVerbosity('normal')}
              >
                <Text
                  style={[
                    styles.verbosityButtonText,
                    verbosity === 'normal' && styles.verbosityButtonTextActive,
                  ]}
                >
                  Normal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.verbosityButton,
                  verbosity === 'detailed' && styles.verbosityButtonActive,
                ]}
                onPress={() => setVerbosity('detailed')}
              >
                <Text
                  style={[
                    styles.verbosityButtonText,
                    verbosity === 'detailed' && styles.verbosityButtonTextActive,
                  ]}
                >
                  Detailed
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Privacy Mode</Text>
            <Switch
              value={privacyEnabled}
              onValueChange={setPrivacyEnabled}
              trackColor={{ false: '#767577', true: '#34C759' }}
              thumbColor={privacyEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Email</Text>
            <Text style={styles.settingValue}>{user?.email || 'N/A'}</Text>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingLabel: {
    fontSize: 16,
    color: '#000000',
  },
  settingValue: {
    fontSize: 16,
    color: '#8E8E93',
  },
  rateControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rateValue: {
    marginHorizontal: 20,
    fontSize: 16,
    minWidth: 50,
    textAlign: 'center',
  },
  verbosityControls: {
    flexDirection: 'row',
  },
  verbosityButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    marginLeft: 10,
  },
  verbosityButtonActive: {
    backgroundColor: '#007AFF',
  },
  verbosityButtonText: {
    color: '#000000',
    fontSize: 14,
  },
  verbosityButtonTextActive: {
    color: '#FFFFFF',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

