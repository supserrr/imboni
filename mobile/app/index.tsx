import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';

export default function Welcome() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && session) {
      router.replace('/(tabs)/home');
    }
  }, [session, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Imboni</Text>
        <Text style={styles.tagline}>See the world together</Text>
      </View>

      {/* Eye Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.eyeBackground}>
          <Ionicons name="eye" size={100} color="#007AFF" />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => router.push({ pathname: '/(auth)/privacy-terms', params: { userType: 'blind' } })}
          accessibilityRole="button"
          accessibilityLabel="I need visual assistance"
        >
          <Text style={styles.buttonText}>I need visual assistance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push({ pathname: '/(auth)/privacy-terms', params: { userType: 'volunteer' } })}
          accessibilityRole="button"
          accessibilityLabel="I'd like to volunteer"
        >
          <Text style={styles.buttonText}>I'd like to volunteer</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="button"
          accessibilityLabel="Already have an account? Log in"
        >
          <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Log in</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  tagline: {
    fontSize: 20,
    color: '#999',
    textAlign: 'center',
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loginLinkText: {
    color: '#999',
    fontSize: 15,
  },
  loginLinkBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
