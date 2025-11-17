import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CallRequest } from '@/lib/types';

/**
 * Home screen component that displays different UI based on user role.
 */
export default function HomeScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeCall, setActiveCall] = useState<CallRequest | null>(null);
  const [availableVolunteers, setAvailableVolunteers] = useState(0);

  useEffect(() => {
    if (profile?.role === 'volunteer') {
      fetchAvailableVolunteers();
      const unsubscribe = subscribeToCallRequests();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else if (profile?.role === 'user') {
      fetchActiveCall();
    }
  }, [profile]);

  /**
   * Fetches the count of available volunteers.
   */
  const fetchAvailableVolunteers = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'volunteer')
      .eq('is_available', true);
    setAvailableVolunteers(count || 0);
  };

  /**
   * Subscribes to real-time call request updates for volunteers.
   *
   * @returns Cleanup function to unsubscribe
   */
  const subscribeToCallRequests = () => {
    const channel = supabase
      .channel('call_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_requests',
          filter: `status=eq.pending`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            Alert.alert(
              'New Call Request',
              'A user needs help. Would you like to accept?',
              [
                { text: 'Decline', style: 'cancel' },
                {
                  text: 'Accept',
                  onPress: () => acceptCallRequest(payload.new as CallRequest),
                },
              ]
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  /**
   * Fetches the active call for the current user.
   */
  const fetchActiveCall = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('call_requests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data && !error) {
      setActiveCall(data);
    }
  };

  /**
   * Creates a new call request for users.
   */
  const handleRequestHelp = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('call_requests')
      .insert({
        user_id: user.id,
        status: 'pending',
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to create call request');
      return;
    }

    setActiveCall(data);
    Alert.alert('Request Sent', 'Waiting for a volunteer to accept your call...');
  };

  /**
   * Accepts a call request for volunteers.
   *
   * @param callRequest - The call request to accept
   */
  const acceptCallRequest = async (callRequest: CallRequest) => {
    if (!user) return;

    const { error } = await supabase
      .from('call_requests')
      .update({
        volunteer_id: user.id,
        status: 'active',
      })
      .eq('id', callRequest.id);

    if (error) {
      Alert.alert('Error', 'Failed to accept call request');
      return;
    }

    router.push({
      pathname: '/call',
      params: { callId: callRequest.id, role: 'volunteer' },
    });
  };

  /**
   * Joins an active call.
   */
  const handleJoinCall = () => {
    if (activeCall) {
      router.push({
        pathname: '/call',
        params: { callId: activeCall.id, role: profile?.role || 'user' },
      });
    }
  };

  /**
   * Cancels an active call request.
   */
  const handleCancelCall = async () => {
    if (!activeCall || !user) return;

    const { error } = await supabase
      .from('call_requests')
      .update({ status: 'cancelled' })
      .eq('id', activeCall.id);

    if (error) {
      Alert.alert('Error', 'Failed to cancel call');
      return;
    }

    setActiveCall(null);
  };

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {profile.full_name}</Text>
        <Text style={styles.subtitle}>
          {profile.role === 'user' ? 'How can we help you today?' : 'Ready to help others?'}
        </Text>
      </View>

      {profile.role === 'user' ? (
        <View style={styles.userView}>
          {activeCall ? (
            <View style={styles.callCard}>
              <Text style={styles.callStatus}>
                Call Status: {activeCall.status === 'pending' ? 'Waiting for volunteer...' : 'Active'}
              </Text>
              {activeCall.status === 'active' && (
                <TouchableOpacity style={styles.primaryButton} onPress={handleJoinCall}>
                  <Text style={styles.buttonText}>Join Call</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.secondaryButton} onPress={handleCancelCall}>
                <Text style={styles.secondaryButtonText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRequestHelp}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Request Help</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.volunteerView}>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{availableVolunteers}</Text>
            <Text style={styles.statsLabel}>Available Volunteers</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, !profile.is_available && styles.buttonInactive]}
            onPress={async () => {
              const { error } = await supabase
                .from('profiles')
                .update({ is_available: !profile.is_available })
                .eq('id', user?.id);

              if (!error) {
                Alert.alert('Success', `You are now ${!profile.is_available ? 'available' : 'unavailable'}`);
              }
            }}>
            <Text style={styles.buttonText}>
              {profile.is_available ? 'Go Offline' : 'Go Online'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            When you're online, you'll receive notifications when users need help.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  userView: {
    alignItems: 'center',
  },
  volunteerView: {
    alignItems: 'center',
  },
  callCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  callStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonInactive: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
});
