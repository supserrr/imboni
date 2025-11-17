import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

/**
 * Welcome screen component showing community statistics and app introduction.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [stats, setStats] = useState({ users: 0, volunteers: 0 });

  useEffect(() => {
    fetchStatistics();
  }, []);

  /**
   * Fetches community statistics from the database.
   */
  const fetchStatistics = async () => {
    const [usersResult, volunteersResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user'),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'volunteer'),
    ]);

    setStats({
      users: usersResult.count || 0,
      volunteers: volunteersResult.count || 0,
    });
  };

  /**
   * Handles navigation based on user role or onboarding flow.
   */
  const handleGetStarted = () => {
    if (profile) {
      router.replace('/(tabs)');
    } else {
      router.push('/(onboarding)/role-selection');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Imboni</Text>
        <Text style={styles.subtitle}>AI-powered visual assistance</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
          <Text style={styles.primaryButtonText}>Get started</Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#999',
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

