import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '../../constants/theme';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../services/supabase';

export default function VerifyEmail() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    if (!user?.email) return;

    try {
      setResending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      Alert.alert(
        'Email Sent',
        'A new verification email has been sent. Please check your inbox.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      if (refreshedUser?.email_confirmed_at) {
        // Email is verified, redirect to home
        router.replace('/(tabs)/home');
      } else {
        Alert.alert(
          'Not Verified Yet',
          'Your email has not been verified yet. Please check your inbox and click the verification link.'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check verification status');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={80} color={BrandColors.darkBrown} />
        </View>

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification email to
        </Text>
        <Text style={styles.email}>{user?.email}</Text>

        <Text style={styles.instructions}>
          Please check your inbox and click the verification link to continue using Imboni.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCheckVerification}
          accessibilityRole="button"
          accessibilityLabel="I've verified my email"
        >
          <Text style={styles.primaryButtonText}>I've verified my email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleResendEmail}
          disabled={resending}
          accessibilityRole="button"
          accessibilityLabel="Resend verification email"
        >
          <Text style={styles.secondaryButtonText}>
            {resending ? 'Sending...' : 'Resend verification email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={signOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>Sign out</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 50,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: BrandColors.darkBrown,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: BrandColors.darkBrown,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 17,
    color: BrandColors.darkBrown,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  instructions: {
    fontSize: 15,
    color: BrandColors.lightBrown,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: BrandColors.darkBrown,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: BrandColors.lavender,
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: BrandColors.white,
    borderWidth: 2,
    borderColor: BrandColors.darkBrown,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  secondaryButtonText: {
    color: BrandColors.darkBrown,
    fontSize: 17,
    fontWeight: '600',
  },
  signOutButton: {
    paddingVertical: 12,
  },
  signOutText: {
    color: BrandColors.lightBrown,
    fontSize: 15,
  },
});

