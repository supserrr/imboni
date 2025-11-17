import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Camera from 'expo-camera';
import * as Notifications from 'expo-notifications';

/**
 * Permissions screen component requesting camera, microphone, and notification access.
 */
export default function PermissionsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  /**
   * Requests all necessary permissions for the app.
   */
  const handleContinue = async () => {
    setLoading(true);
    try {
      // On web, permissions work differently - just continue
      if (Platform.OS === 'web') {
        router.push('/(onboarding)/language');
        return;
      }

      // Request camera permissions (includes microphone on native)
      let cameraStatus;
      try {
        cameraStatus = await Camera.requestCameraPermissionsAsync();
      } catch (cameraError) {
        console.warn('Camera permission error:', cameraError);
        // Continue even if camera permission fails
        cameraStatus = { status: 'undetermined' as const };
      }

      // Request notification permissions
      let notificationStatus;
      try {
        notificationStatus = await Notifications.requestPermissionsAsync();
      } catch (notificationError) {
        console.warn('Notification permission error:', notificationError);
        // Continue even if notification permission fails
        notificationStatus = { status: 'undetermined' as const };
      }

      // Show warnings but don't block progress
      const warnings: string[] = [];
      if (cameraStatus.status !== 'granted') {
        warnings.push('Camera permission is recommended for video calls.');
      }
      if (notificationStatus.status !== 'granted') {
        warnings.push('Notification permission is recommended to receive call alerts.');
      }

      if (warnings.length > 0) {
        Alert.alert(
          'Permissions Recommended',
          warnings.join(' ') + ' You can enable them later in settings.',
          [{ text: 'Continue', onPress: () => router.push('/(onboarding)/language') }]
        );
      } else {
        router.push('/(onboarding)/language');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      // Don't block the user - allow them to continue
      Alert.alert(
        'Permission Request',
        'Some permissions could not be requested. You can enable them later in your device settings. Continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => router.push('/(onboarding)/language'),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔔</Text>
        </View>

        <Text style={styles.title}>
          To receive video calls, please allow access to your microphone and notifications
        </Text>

        <View style={styles.permissionsList}>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionIcon}>📹</Text>
            <Text style={styles.permissionText}>Camera - for video calls</Text>
          </View>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionIcon}>🎤</Text>
            <Text style={styles.permissionText}>Microphone - for audio during calls</Text>
          </View>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionIcon}>🔔</Text>
            <Text style={styles.permissionText}>Notifications - to alert you about calls</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}>
          <Text style={styles.continueButtonText}>Continue</Text>
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
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  permissionsList: {
    width: '100%',
    gap: 24,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  permissionIcon: {
    fontSize: 32,
  },
  permissionText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

