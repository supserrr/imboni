import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { AuthService } from '../../services/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  // Bottom sheet refs
  const emailBottomSheetRef = useRef<BottomSheet>(null);
  const googleBottomSheetRef = useRef<BottomSheet>(null);
  const emailSnapPoints = useMemo(() => ['50%', '70%'], []);
  const googleSnapPoints = useMemo(() => ['40%'], []);

  const handleEmailLogin = async () => {
    try {
      setLoading(true);
      await AuthService.signInWithEmail(email, password);
      emailBottomSheetRef.current?.close();
      // Redirect handled by AuthProvider/RootLayout
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async () => {
    try {
      console.log('Starting Google OAuth for login');
      setLoading(true);
      // For login, we default to 'blind' but this will be overridden by existing user data
      const result = await AuthService.signInWithGoogle('blind');
      console.log('OAuth login result:', result);
      googleBottomSheetRef.current?.close();
    } catch (e: any) {
      console.error('OAuth login error:', e);
      Alert.alert('Authentication Error', e.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
        pressBehavior="close"
      />
    ),
    []
  );

  const CustomBackground = ({ style }: any) => (
    <BlurView
      intensity={100}
      tint="dark"
      style={[style, styles.blurContainer]}
    />
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centeredContent}>
          <Text style={styles.title}>Welcome back</Text>

          {/* Continue with Email */}
          <TouchableOpacity
            style={[styles.authButton, styles.emailButton]}
            onPress={() => emailBottomSheetRef.current?.expand()}
            accessibilityRole="button"
            accessibilityLabel="Continue with Email"
          >
            <Text style={styles.emailButtonText}>Continue with Email</Text>
          </TouchableOpacity>

          {/* Continue with Google */}
          <TouchableOpacity
            style={[styles.authButton, styles.secondaryButton]}
            onPress={() => googleBottomSheetRef.current?.expand()}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <Ionicons name="logo-google" size={24} color="#000" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Sign up link */}
          <View style={styles.signupLinkContainer}>
            <Text style={styles.signupPrompt}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Email Bottom Sheet */}
        <BottomSheet
          ref={emailBottomSheetRef}
          index={-1}
          snapPoints={emailSnapPoints}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          backgroundComponent={CustomBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <Text style={styles.bottomSheetTitle}>Welcome back</Text>
            
            <TextInput
              style={styles.input}
              placeholder={t('email')}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              accessibilityLabel={t('email')}
            />
            
            <TextInput
              style={styles.input}
              placeholder={t('password')}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel={t('password')}
            />
            
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleEmailLogin} 
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>

        {/* Google Bottom Sheet */}
        <BottomSheet
          ref={googleBottomSheetRef}
          index={-1}
          snapPoints={googleSnapPoints}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          backgroundComponent={CustomBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <Ionicons name="logo-google" size={52} color="#007AFF" style={styles.googleIcon} />
            <Text style={styles.bottomSheetTitle}>Continue with Google</Text>
            <Text style={styles.bottomSheetSubtitle}>
              You'll be redirected to Google to complete sign in
            </Text>
            
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleOAuthSignIn}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Continue"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backText: {
    color: '#007AFF',
    fontSize: 17,
    marginLeft: 5,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  authButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
  },
  emailButton: {
    backgroundColor: '#007AFF',
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#E8E8E8',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 10,
  },
  signupLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  signupPrompt: {
    color: '#999',
    fontSize: 15,
  },
  signupLink: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Bottom sheet styles - Liquid Glass Effect
  blurContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(28, 28, 30, 0.75)',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomSheetIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  bottomSheetTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bottomSheetSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  googleIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  // Email form styles - Glassmorphism
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 18,
    marginBottom: 14,
    fontSize: 16,
    color: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
