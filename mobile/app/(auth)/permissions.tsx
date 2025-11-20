import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { requestPermissionsAsync } from 'expo-audio';
import { BrandColors } from '../../constants/theme';

interface PermissionStatus {
  camera: boolean;
  microphone: boolean;
  notifications: boolean;
}

export default function Permissions() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userType = params.userType as string;
  
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: false,
    microphone: false,
    notifications: false,
  });

  const [checking, setChecking] = useState(false);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setPermissions(prev => ({ ...prev, camera: status === 'granted' }));
      return status === 'granted';
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const { status, granted } = await requestPermissionsAsync();
      setPermissions(prev => ({ ...prev, microphone: granted }));
      return granted;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissions(prev => ({ ...prev, notifications: status === 'granted' }));
      return status === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  };

  const handleRequestAll = async () => {
    setChecking(true);
    
    // Request all permissions
    const cameraGranted = await requestCameraPermission();
    const micGranted = await requestMicrophonePermission();
    const notifGranted = await requestNotificationPermission();

    setChecking(false);

    // All permissions granted, proceed to signup
    if (cameraGranted && micGranted && notifGranted) {
      router.push({
        pathname: '/(auth)/signup',
        params: { userType, acceptedTerms: 'true', permissionsGranted: 'true' }
      });
    } else {
      Alert.alert(
        'Permissions Required',
        'Imboni requires Camera and Microphone access to function. Notifications help you receive help requests.',
        [
          { text: 'Try Again', onPress: handleRequestAll },
          { text: 'Skip Notifications', onPress: () => {
            if (cameraGranted && micGranted) {
              router.push({
                pathname: '/(auth)/signup',
                params: { userType, acceptedTerms: 'true', permissionsGranted: 'true' }
              });
            }
          }}
        ]
      );
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Permissions?',
      'You can grant permissions later in Settings, but some features may not work until then.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue Anyway',
          onPress: () => router.push({
            pathname: '/(auth)/signup',
            params: { userType, acceptedTerms: 'true' }
          })
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={24} color={BrandColors.darkBrown} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Permissions</Text>
        <Text style={styles.subtitle}>
          To provide you with the best experience, Imboni needs access to:
        </Text>

        {/* Camera Permission */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <View style={[styles.iconContainer, permissions.camera && styles.iconContainerGranted]}>
              <Ionicons 
                name={permissions.camera ? "checkmark" : "camera"} 
                size={28} 
                color={permissions.camera ? "#34C759" : BrandColors.lightBrown} 
              />
            </View>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Camera</Text>
              <Text style={styles.permissionDescription}>
                {userType === 'blind' 
                  ? 'To capture your surroundings for AI analysis and share with volunteers'
                  : 'To see what users need help with'}
              </Text>
            </View>
          </View>
          {permissions.camera && (
            <View style={styles.grantedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.grantedText}>Granted</Text>
            </View>
          )}
        </View>

        {/* Microphone Permission */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <View style={[styles.iconContainer, permissions.microphone && styles.iconContainerGranted]}>
              <Ionicons 
                name={permissions.microphone ? "checkmark" : "mic"} 
                size={28} 
                color={permissions.microphone ? "#34C759" : BrandColors.lightBrown} 
              />
            </View>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Microphone</Text>
              <Text style={styles.permissionDescription}>
                To communicate during video calls with volunteers
              </Text>
            </View>
          </View>
          {permissions.microphone && (
            <View style={styles.grantedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.grantedText}>Granted</Text>
            </View>
          )}
        </View>

        {/* Notifications Permission */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <View style={[styles.iconContainer, permissions.notifications && styles.iconContainerGranted]}>
              <Ionicons 
                name={permissions.notifications ? "checkmark" : "notifications"} 
                size={28} 
                color={permissions.notifications ? "#34C759" : BrandColors.lightBrown} 
              />
            </View>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Notifications</Text>
              <Text style={styles.permissionDescription}>
                {userType === 'blind'
                  ? 'To notify you when a volunteer accepts your request'
                  : 'To alert you when someone needs help'}
              </Text>
            </View>
          </View>
          {permissions.notifications && (
            <View style={styles.grantedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.grantedText}>Granted</Text>
            </View>
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleRequestAll}
          disabled={checking}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.continueButtonText}>
            {checking ? 'Checking...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.lavender,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  backText: {
    color: BrandColors.darkBrown,
    fontSize: 17,
    marginLeft: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: BrandColors.darkBrown,
    marginBottom: 15,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 17,
    color: BrandColors.lightBrown,
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionCard: {
    backgroundColor: BrandColors.white,
    borderWidth: 2,
    borderColor: BrandColors.darkBrown,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: BrandColors.darkBrown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionHeader: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconContainerGranted: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  permissionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: BrandColors.darkBrown,
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: BrandColors.lightBrown,
    lineHeight: 20,
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 212, 232, 0.3)',
  },
  grantedText: {
    color: '#34C759',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  spacer: {
    height: 20,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: BrandColors.lavender,
    borderTopWidth: 1,
    borderTopColor: 'rgba(92, 58, 58, 0.1)',
  },
  continueButton: {
    backgroundColor: BrandColors.darkBrown,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    color: BrandColors.lavender,
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    color: BrandColors.darkBrown,
    fontSize: 17,
  },
});

