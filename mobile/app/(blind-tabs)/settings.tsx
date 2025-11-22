import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const rowBackgroundColor = colors.text;
  const textColor = colors.background;
  const borderColor = dark ? 'rgba(92, 58, 58, 0.2)' : 'rgba(232, 212, 232, 0.2)';
  const chevronColor = dark ? 'rgba(92, 58, 58, 0.6)' : 'rgba(232, 212, 232, 0.6)';
  
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

export default function BlindSettings() {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();

  const handleAccount = () => {
    router.push('/(settings)/account');
  };

  const handleAppearance = () => {
    router.push('/(settings)/appearance');
  };

  const handleLanguages = () => {
    router.push('/(settings)/languages');
  };

  const handleShortcuts = () => {
    router.push('/(settings)/shortcuts');
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
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={styles.section}>
        <SettingsRow title="Account" onPress={handleAccount} colors={colors} dark={dark} />
        <SettingsRow title="Appearance" onPress={handleAppearance} colors={colors} dark={dark} />
        <SettingsRow title="Languages" onPress={handleLanguages} colors={colors} dark={dark} />
        <SettingsRow title="Shortcuts" onPress={handleShortcuts} colors={colors} dark={dark} />
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
        <Text style={[styles.footerText, { color: dark ? '#C4A4C4' : '#8B6B6B' }]}>Imboni v1.0.0</Text>
        {user?.email && <Text style={[styles.footerText, { color: dark ? '#C4A4C4' : '#8B6B6B' }]}>{user.email}</Text>}
      </View>
    </ScrollView>
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

