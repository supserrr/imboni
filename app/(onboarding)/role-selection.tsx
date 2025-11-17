import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Role selection screen component for choosing between blind user or volunteer.
 */
export default function RoleSelectionScreen() {
  const router = useRouter();
  // Removed custom TTS - OS accessibility handles narration
  const [selectedRole, setSelectedRole] = useState<'user' | 'volunteer' | null>(null);

  // Screen announcement handled by OS accessibility via accessibilityLabel

  /**
   * Handles role selection and navigation.
   *
   * @param role - Selected role
   */
  const handleRoleSelect = async (role: 'user' | 'volunteer') => {
    setSelectedRole(role);
    // Selection will be announced by OS accessibility via accessibilityLabel
    // Navigate to auth
    router.push({
      pathname: '/(auth)/signup',
      params: { role },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose your role</Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.roleButton, selectedRole === 'user' && styles.roleButtonSelected]}
            onPress={() => handleRoleSelect('user')}
            accessibilityLabel="Blind user - I need visual assistance"
            accessibilityRole="button">
            <Text style={[styles.roleButtonText, selectedRole === 'user' && styles.roleButtonTextSelected]}>
              Blind user
            </Text>
            <Text style={styles.roleButtonSubtext}>I need visual assistance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, selectedRole === 'volunteer' && styles.roleButtonSelected]}
            onPress={() => handleRoleSelect('volunteer')}
            accessibilityLabel="Volunteer - I want to help others"
            accessibilityRole="button">
            <Text
              style={[styles.roleButtonText, selectedRole === 'volunteer' && styles.roleButtonTextSelected]}>
              Volunteer
            </Text>
            <Text style={styles.roleButtonSubtext}>I want to help others</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 48,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: 24,
  },
  roleButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    minHeight: 120,
    justifyContent: 'center',
  },
  roleButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#1a3a5a',
  },
  roleButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  roleButtonTextSelected: {
    color: '#007AFF',
  },
  roleButtonSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

