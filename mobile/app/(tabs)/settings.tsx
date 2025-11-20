import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

interface SettingsRowProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  showChevron?: boolean;
  isDestructive?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ title, onPress, icon, showChevron = true, isDestructive = false }) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
  >
    {icon && <Ionicons name={icon} size={20} color={isDestructive ? '#FF3B30' : '#666'} style={styles.rowIcon} />}
    <Text style={[styles.rowText, isDestructive && styles.destructiveText]}>{title}</Text>
    {showChevron && <Ionicons name="chevron-forward" size={20} color="#999" />}
  </TouchableOpacity>
);

export default function Settings() {
  const { signOut, user } = useAuth();
  const router = useRouter();

  const handleAccount = () => {
    router.push('/(settings)/account');
  };

  const handleLanguages = () => {
    router.push('/(settings)/languages');
  };

  const handleNotifications = () => {
    router.push('/(settings)/notifications');
  };

  const handleShortcuts = () => {
    router.push('/(settings)/shortcuts');
  };

  const handleAISettings = () => {
    router.push('/(settings)/ai-settings');
  };

  const handleSupport = () => {
    Linking.openURL('https://imboni.app/support');
  };

  const handlePrivacyAndTerms = () => {
    Linking.openURL('https://imboni.app/privacy');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log out', 
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.section}>
        <SettingsRow title="Account" onPress={handleAccount} />
        <SettingsRow title="Languages" onPress={handleLanguages} />
        <SettingsRow title="Notifications" onPress={handleNotifications} />
        <SettingsRow title="Shortcuts" onPress={handleShortcuts} />
      </View>

      <View style={styles.section}>
        <SettingsRow title="AI Settings" onPress={handleAISettings} />
      </View>

      <View style={styles.section}>
        <SettingsRow title="Support" onPress={handleSupport} />
      </View>

      <View style={styles.section}>
        <SettingsRow title="Privacy and terms" onPress={handlePrivacyAndTerms} />
      </View>

      <View style={styles.section}>
        <SettingsRow 
          title="Log out" 
          onPress={handleLogout}
          showChevron={false}
          isDestructive={true}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Imboni v1.0.0</Text>
        {user?.email && <Text style={styles.footerText}>{user.email}</Text>}
      </View>
    </ScrollView>
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
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 0.5,
    borderBottomColor: '#3A3A3C',
  },
  rowIcon: {
    marginRight: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 17,
    color: '#fff',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    marginVertical: 2,
  },
});
