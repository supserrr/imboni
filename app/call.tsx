import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CallRequest } from '@/lib/types';

/**
 * Video call screen component for handling live video calls between users and volunteers.
 * Note: This is a basic implementation. For production, integrate a proper WebRTC solution.
 */
export default function CallScreen() {
  const { callId, role } = useLocalSearchParams<{ callId: string; role: string }>();
  const { profile, user } = useAuth();
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
  const [callRequest, setCallRequest] = useState<CallRequest | null>(null);
  const [otherUser, setOtherUser] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    if (callId) {
      fetchCallRequest();
      subscribeToCallUpdates();
    }

    return () => {
      if (callId) {
        supabase.removeAllChannels();
      }
    };
  }, [callId]);

  /**
   * Fetches the call request details.
   */
  const fetchCallRequest = async () => {
    if (!callId) return;

    const { data, error } = await supabase
      .from('call_requests')
      .select('*')
      .eq('id', callId)
      .single();

    if (error || !data) {
      Alert.alert('Error', 'Call not found');
      router.back();
      return;
    }

    setCallRequest(data);

    const otherUserId = role === 'user' ? data.volunteer_id : data.user_id;
    if (otherUserId) {
      const { data: otherUserData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', otherUserId)
        .single();

      if (otherUserData) {
        setOtherUser(otherUserData);
      }
    }

    if (data.status === 'active') {
      setCallStatus('active');
    }
  };

  /**
   * Subscribes to real-time call updates.
   */
  const subscribeToCallUpdates = () => {
    if (!callId) return;

    const channel = supabase
      .channel(`call_${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_requests',
          filter: `id=eq.${callId}`,
        },
        (payload) => {
          const updatedCall = payload.new as CallRequest;
          setCallRequest(updatedCall);

          if (updatedCall.status === 'completed' || updatedCall.status === 'cancelled') {
            setCallStatus('ended');
            setTimeout(() => {
              router.back();
            }, 2000);
          } else if (updatedCall.status === 'active') {
            setCallStatus('active');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  /**
   * Ends the call.
   */
  const handleEndCall = async () => {
    if (!callId) return;

    const { error } = await supabase
      .from('call_requests')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', callId);

    if (error) {
      Alert.alert('Error', 'Failed to end call');
      return;
    }

    setCallStatus('ended');
    setTimeout(() => {
      router.back();
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Video Call</Text>
        {otherUser && <Text style={styles.subtitle}>With {otherUser.full_name}</Text>}
      </View>

      <View style={styles.videoContainer}>
        {callStatus === 'connecting' ? (
          <View style={styles.connectingView}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.connectingText}>
              {role === 'user' ? 'Connecting to volunteer...' : 'Connecting to user...'}
            </Text>
          </View>
        ) : callStatus === 'active' ? (
          <View style={styles.activeCallView}>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>Video Feed</Text>
              <Text style={styles.videoNote}>
                Note: Integrate WebRTC (e.g., react-native-webrtc) for actual video streaming
              </Text>
            </View>
            <View style={styles.localVideoPlaceholder}>
              <Text style={styles.localVideoText}>Your Video</Text>
            </View>
          </View>
        ) : (
          <View style={styles.endedView}>
            <Text style={styles.endedText}>Call Ended</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {callStatus === 'active' && (
          <>
            <TouchableOpacity style={styles.muteButton}>
              <Text style={styles.controlButtonText}>Mute</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
              <Text style={styles.endCallButtonText}>End Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.videoButton}>
              <Text style={styles.controlButtonText}>Video</Text>
            </TouchableOpacity>
          </>
        )}
        {callStatus === 'connecting' && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleEndCall}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingView: {
    alignItems: 'center',
  },
  connectingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  activeCallView: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    borderRadius: 12,
  },
  videoPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 8,
  },
  videoNote: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  localVideoPlaceholder: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  localVideoText: {
    color: '#fff',
    fontSize: 12,
  },
  endedView: {
    alignItems: 'center',
  },
  endedText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
    gap: 16,
  },
  muteButton: {
    backgroundColor: '#333',
    borderRadius: 30,
    padding: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  videoButton: {
    backgroundColor: '#333',
    borderRadius: 30,
    padding: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 30,
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  endCallButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

