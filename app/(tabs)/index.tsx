import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAudio } from '@/contexts/AudioContext';
import { triggerHaptic } from '@/lib/utils/accessibility';

/**
 * Home screen component with large camera button.
 */
export default function HomeScreen() {
  const { profile, user, updateProfile } = useAuth();
  const router = useRouter();
  // Removed custom TTS - OS accessibility handles narration

  // Removed custom TTS - OS accessibility (VoiceOver/TalkBack) handles announcements

  /**
   * Handles camera button press.
   */
  const handleCameraPress = () => {
    triggerHaptic('medium');
    router.push('/ai-camera');
  };

  /**
   * Handles photo mode navigation.
   */
  const handlePhotoMode = () => {
    triggerHaptic('light');
    router.push('/(tabs)/photo');
  };

  /**
   * Toggles volunteer availability.
   */
  const handleToggleAvailability = async () => {
    if (!user || !profile) return;

    triggerHaptic('light');
    const newAvailability = !profile.is_available;

    const { error } = await updateProfile({ is_available: newAvailability });

    if (error) {
      console.error('Error updating availability:', error);
    }
    // Status change will be announced by OS accessibility via accessibilityLabel
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {profile?.role === 'user' ? (
          <>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleCameraPress}
              accessibilityLabel="Camera button. Double tap to start AI assistance."
              accessibilityRole="button"
              accessibilityHint="Opens the AI camera for real-time visual assistance">
              <Text style={styles.cameraButtonIcon}>📷</Text>
              <Text style={styles.cameraButtonText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoModeButton}
              onPress={handlePhotoMode}
              accessibilityLabel="Photo mode. Double tap to take a picture for analysis."
              accessibilityRole="button">
              <Text style={styles.photoModeText}>Photo Mode</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.volunteerStatus}>
              <Text style={styles.volunteerStatusText}>
                {profile?.is_available ? 'Available' : 'Unavailable'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.availabilityButton, profile?.is_available && styles.availabilityButtonActive]}
              onPress={handleToggleAvailability}
              accessibilityLabel={`Toggle availability. Currently ${profile?.is_available ? 'available' : 'unavailable'}`}
              accessibilityRole="button">
              <Text style={styles.availabilityButtonText}>
                {profile?.is_available ? 'Go Offline' : 'Go Online'}
              </Text>
            </TouchableOpacity>
          </>
          )}
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
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cameraButtonIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  cameraButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  photoModeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  photoModeText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  volunteerStatus: {
    marginBottom: 24,
  },
  volunteerStatusText: {
    fontSize: 20,
    color: '#999',
    textAlign: 'center',
  },
  availabilityButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 18,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  availabilityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  availabilityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
