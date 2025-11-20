import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTheme } from '@react-navigation/native';

interface SettingsRowProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  showChevron?: boolean;
  isDestructive?: boolean;
  colors: any;
  dark: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ title, onPress, icon, showChevron = true, isDestructive = false, colors, dark }) => {
  const rowBackgroundColor = dark ? colors.card : colors.text; // Dark brown (#5C3A3A) in light mode, matches title color
  const textColor = dark ? colors.text : colors.background; // Lavender (#E8D4E8) in light mode, matches background
  const borderColor = dark ? '#3A3A3C' : 'rgba(232, 212, 232, 0.2)';
  const chevronColor = dark ? '#8E8E93' : 'rgba(232, 212, 232, 0.6)';
  
  return (
  <TouchableOpacity
      style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
  >
      {icon && <Ionicons name={icon} size={20} color={isDestructive ? '#FF3B30' : textColor} style={styles.rowIcon} />}
      <Text style={[styles.rowText, { color: textColor }, isDestructive && styles.destructiveText]}>{title}</Text>
      {showChevron && <Ionicons name="chevron-forward" size={20} color={chevronColor} />}
  </TouchableOpacity>
);
};

export default function Settings() {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const { colors, dark } = useTheme();

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

  const dynamicStyles = createStyles(colors, dark);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={styles.section}>
        <SettingsRow title="Account" onPress={handleAccount} colors={colors} dark={dark} />
        <SettingsRow title="Languages" onPress={handleLanguages} colors={colors} dark={dark} />
        <SettingsRow title="Notifications" onPress={handleNotifications} colors={colors} dark={dark} />
        <SettingsRow title="Shortcuts" onPress={handleShortcuts} colors={colors} dark={dark} />
      </View>

      <View style={styles.section}>
        <SettingsRow title="AI Settings" onPress={handleAISettings} colors={colors} dark={dark} />
      </View>

      <View style={styles.section}>
        <SettingsRow title="Support" onPress={handleSupport} colors={colors} dark={dark} />
      </View>

      <View style={styles.section}>
        <SettingsRow title="Privacy and terms" onPress={handlePrivacyAndTerms} colors={colors} dark={dark} />
      </View>

      <View style={styles.section}>
        <SettingsRow 
          title="Log out" 
          onPress={handleLogout}
          showChevron={false}
          isDestructive={true}
          colors={colors}
          dark={dark}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: dark ? '#666' : '#999' }]}>Imboni v1.0.0</Text>
        {user?.email && <Text style={[styles.footerText, { color: dark ? '#666' : '#999' }]}>{user.email}</Text>}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: any, dark: boolean) {
  return StyleSheet.create({
    // Dynamic styles moved inline to component
  });
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
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 17,
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
    marginVertical: 2,
  },
});
