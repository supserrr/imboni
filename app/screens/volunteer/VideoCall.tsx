import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CameraFeed } from '../../components/CameraFeed';
import { VolunteerVideoControls } from '../../components/VolunteerVideoControls';
import { AudioLevelBar } from '../../components/AudioLevelBar';
import { useVolunteer } from '../../context/VolunteerContext';
import { useAuth } from '../../context/AuthContext';
import { updateVolunteerLoad, endHelpSession } from '../../utils/SupabaseClient';
import { setupWebRTCConnection, closeWebRTCConnection, WebRTCConnection } from '../../utils/WebRTCClient';

/**
 * Video call screen for volunteers.
 * Connects to user via WebRTC or Supabase Realtime.
 * Tracks all volunteer actions for scoring algorithm.
 */
export function VideoCall() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { currentCall, endCall, trackAction } = useVolunteer();
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [webrtcConnection, setWebrtcConnection] = useState<WebRTCConnection | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const startTimeRef = useRef<number | null>(null);
  const actionCountRef = useRef<{ snap: number; flash: number }>({ snap: 0, flash: 0 });

  useEffect(() => {
    if (currentCall) {
      startTimeRef.current = Date.now();
      initializeCall();

      return () => {
        cleanupCall();
      };
    }
  }, [currentCall]);

  /**
   * Initializes the video call.
   */
  async function initializeCall() {
    if (!currentCall || !user) return;

    try {
      setConnectionStatus('connecting');
      
      await trackAction('call_started', {
        sessionId: currentCall.sessionId,
        userId: currentCall.userId,
      });

      await updateVolunteerLoad(user.id, 1);

      const connection = await setupWebRTCConnection(currentCall.sessionId, false);
      if (connection) {
        setWebrtcConnection(connection);
        setConnectionStatus('connected');

        if (connection.peerConnection) {
          connection.peerConnection.onconnectionstatechange = () => {
            const state = connection.peerConnection.connectionState;
            if (state === 'connected') {
              setConnectionStatus('connected');
            } else if (state === 'disconnected' || state === 'failed') {
              setConnectionStatus('disconnected');
            }
          };
        }
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error initializing call:', error);
      setConnectionStatus('disconnected');
    }
  }

  /**
   * Cleans up the video call.
   */
  async function cleanupCall() {
    if (webrtcConnection) {
      await closeWebRTCConnection(webrtcConnection);
      setWebrtcConnection(null);
    }

    if (currentCall && user && startTimeRef.current) {
      const duration = Date.now() - startTimeRef.current;

      await trackAction('call_ended', {
        sessionId: currentCall.sessionId,
        duration,
        snapCount: actionCountRef.current.snap,
        flashCount: actionCountRef.current.flash,
      });

      await updateVolunteerLoad(user.id, -1);
    }
  }

  /**
   * Handles snapping a photo.
   */
  const handleSnap = async () => {
    if (!user || !currentCall) return;

    actionCountRef.current.snap += 1;

    await trackAction('snap', {
      sessionId: currentCall.sessionId,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Handles ending the call.
   */
  const handleEndCall = async () => {
    if (!currentCall || !user) return;

    const duration = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : 0;

    await trackAction('call_ended_by_volunteer', {
      sessionId: currentCall.sessionId,
      duration,
      snapCount: actionCountRef.current.snap,
      flashCount: actionCountRef.current.flash,
    });

    await endHelpSession(currentCall.sessionId);
    await updateVolunteerLoad(user.id, -1);

    if (webrtcConnection) {
      await closeWebRTCConnection(webrtcConnection);
      setWebrtcConnection(null);
    }

    await endCall();
    navigation.goBack();
  };

  /**
   * Handles toggling flash.
   */
  const handleToggleFlash = async () => {
    if (!user || !currentCall) return;

    actionCountRef.current.flash += 1;
    const newFlashState = !flashEnabled;

    await trackAction('flash_toggle', {
      sessionId: currentCall.sessionId,
      enabled: newFlashState,
      timestamp: new Date().toISOString(),
    });

    setFlashEnabled(newFlashState);
  };

  /**
   * Handles frame capture.
   *
   * @param uri - The URI of the captured frame.
   */
  const handleFrameCapture = (uri: string) => {
    if (webrtcConnection && webrtcConnection.localStream) {
    }
  };

  if (!currentCall) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active call</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.cameraContainer}>
        {webrtcConnection && webrtcConnection.remoteStream ? (
          <View style={styles.videoContainer}>
            <CameraFeed
              onFrameCapture={handleFrameCapture}
              autoCapture={false}
              streamMode={true}
            />
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {connectionStatus === 'connecting' && 'Connecting...'}
                {connectionStatus === 'connected' && 'Connected'}
                {connectionStatus === 'disconnected' && 'Disconnected'}
              </Text>
            </View>
          </View>
        ) : (
          <CameraFeed
            onFrameCapture={handleFrameCapture}
            autoCapture={false}
          />
        )}
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.audioContainer}>
          <AudioLevelBar level={audioLevel} color="#34C759" />
        </View>

        <VolunteerVideoControls
          onSnap={handleSnap}
          onEndCall={handleEndCall}
          onToggleFlash={handleToggleFlash}
          flashEnabled={flashEnabled}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  cameraContainer: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  audioContainer: {
    width: '100%',
    paddingBottom: 10,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  statusContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
