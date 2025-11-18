import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { triggerHaptic } from '@/lib/utils/accessibility';

/**
 * User home screen component with large camera button.
 */
export default function UserHomeScreen() {
  const router = useRouter();

  /**
   * Handles camera button press.
   */
  const handleCameraPress = () => {
    triggerHaptic('medium');
    router.push('/ai-camera');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleCameraPress}
          accessibilityLabel="Start AI assistance. Double tap to begin live visual analysis."
          accessibilityRole="button"
          accessibilityHint="Opens the AI camera for real-time visual assistance">
          <Text style={styles.cameraButtonText}>Start AI Assistance</Text>
        </TouchableOpacity>
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
  cameraButton: {
    width: '100%',
    maxWidth: 320,
    minHeight: 80,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cameraButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

