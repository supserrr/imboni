import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { triggerHaptic } from '@/lib/utils/accessibility';

/**
 * Volunteer home screen component with availability toggle.
 */
export default function VolunteerHomeScreen() {
  const { profile, user, updateProfile } = useAuth();

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
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
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

