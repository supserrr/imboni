import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useThemePreference } from '../../context/ThemeContext';

interface SelectionRowProps {
  title: string;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
  dark: boolean;
}

const SelectionRow: React.FC<SelectionRowProps> = ({ title, isSelected, onPress, colors, dark }) => {
  const rowBackgroundColor = colors.text;
  const textColor = colors.background;
  const borderColor = dark ? 'rgba(92, 58, 58, 0.2)' : 'rgba(232, 212, 232, 0.2)';

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${isSelected ? 'selected' : 'not selected'}`}
    >
      <Text style={[styles.rowTitle, { color: textColor }]}>{title}</Text>
      {isSelected && <Ionicons name="checkmark" size={24} color={colors.background} />}
    </TouchableOpacity>
  );
};

export default function AppearanceSettings() {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const { theme, setTheme } = useThemePreference();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
      </View>

      <View style={styles.section}>
        <SelectionRow
          title="Automatic (System)"
          isSelected={theme === 'system'}
          onPress={() => setTheme('system')}
          colors={colors}
          dark={dark}
        />
        <SelectionRow
          title="Light"
          isSelected={theme === 'light'}
          onPress={() => setTheme('light')}
          colors={colors}
          dark={dark}
        />
        <SelectionRow
          title="Dark"
          isSelected={theme === 'dark'}
          onPress={() => setTheme('dark')}
          colors={colors}
          dark={dark}
        />
      </View>
      
      <View style={styles.footer}>
         <Text style={[styles.footerText, { color: dark ? '#C4A4C4' : '#8B6B6B' }]}>
            Automatic mode uses your device's system settings to switch between light and dark appearance.
         </Text>
      </View>
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
  rowTitle: {
    fontSize: 17,
  },
  footer: {
      paddingHorizontal: 32,
      marginTop: 10,
  },
  footerText: {
      fontSize: 13,
      textAlign: 'center',
  }
});

