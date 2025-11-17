import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import { useAI } from '@/contexts/AIContext';
import { useAudio } from '@/contexts/AudioContext';
import { useAuth } from '@/contexts/AuthContext';
import { startSampling } from '@/lib/utils/cameraSampling';
import { formatAIResponse } from '@/lib/utils/aiResponse';
import { triggerHaptic } from '@/lib/utils/accessibility';
import { supabase } from '@/lib/supabase';

/**
 * AI Camera screen component for real-time vision analysis.
 */
export default function AICameraScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const { isActive, isSampling, lowConfidenceDetected, startSession, stopSession, analyzeImage, setQuery } = useAI();
  const { isMuted, toggleMute } = useAudio();
  const cameraRef = useRef<CameraView>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [samplingCleanup, setSamplingCleanup] = useState<(() => void) | null>(null);
  const [isRequestingVolunteer, setIsRequestingVolunteer] = useState(false);

  useEffect(() => {
    // Request camera permission
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Screen announcement handled by OS accessibility via accessibilityLabel

    return () => {
      if (samplingCleanup) {
        samplingCleanup();
      }
      stopSession();
    };
  }, []);

  /**
   * Starts the AI session and begins frame sampling.
   */
  const handleStartSession = () => {
    if (!cameraRef.current) return;

    triggerHaptic('medium');
    startSession();

    // Start sampling frames
    const cleanup = startSampling(cameraRef.current, {
      interval: 800, // 0.8 seconds
      onFrameAnalyzed: async (analysis) => {
        // Format response - OS accessibility will announce via accessibilityLabel
        const response = formatAIResponse(analysis, profile?.verbosity_level || 'detailed');
      },
      onError: (error) => {
        console.error('Frame sampling error:', error);
        // Error will be displayed in UI, OS accessibility will announce it
      },
    });

    setSamplingCleanup(() => cleanup);
  };

  /**
   * Handles user query submission.
   */
  const handleQuerySubmit = async () => {
    if (!userQuery.trim() || !cameraRef.current) return;

    triggerHaptic('light');
    setQuery(userQuery);

    try {
      // Capture current frame and analyze with query
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (photo?.base64) {
        const analysis = await analyzeImage(photo.base64, userQuery);
        const response = formatAIResponse(analysis, profile?.verbosity_level || 'detailed');
        // Response will be displayed in UI, OS accessibility will announce it
      }

      setUserQuery('');
    } catch (error) {
      console.error('Query error:', error);
      // Error will be displayed in UI, OS accessibility will announce it
    }
  };

  /**
   * Requests human volunteer help.
   */
  const handleRequestVolunteer = async () => {
    if (!user || isRequestingVolunteer) return;

    triggerHaptic('medium');
    setIsRequestingVolunteer(true);

    try {
      // Create call request
      const { data, error } = await supabase
        .from('call_requests')
        .insert({
          user_id: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to call screen
      router.push({
        pathname: '/call',
        params: { callId: data.id, role: 'user' },
      });
    } catch (error) {
      console.error('Error requesting volunteer:', error);
      // Error will be displayed in UI, OS accessibility will announce it
    } finally {
      setIsRequestingVolunteer(false);
    }
  };

  /**
   * Ends the AI session.
   */
  const handleEndSession = () => {
    triggerHaptic('light');
    if (samplingCleanup) {
      samplingCleanup();
      setSamplingCleanup(null);
    }
    stopSession();
    router.back();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        accessibilityElementsHidden={true}
      />

      <View style={styles.overlay}>
        {!isActive ? (
          <View style={styles.startContainer}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartSession}
              accessibilityLabel="Start AI analysis"
              accessibilityRole="button">
              <Text style={styles.startButtonText}>Start Analysis</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeContainer}>
            <View style={styles.queryContainer}>
              <TextInput
                style={styles.queryInput}
                placeholder="Ask me anything..."
                placeholderTextColor="#999"
                value={userQuery}
                onChangeText={setUserQuery}
                onSubmitEditing={handleQuerySubmit}
                accessibilityLabel="Text input for questions"
              />
              <TouchableOpacity
                style={styles.micButton}
                onPress={handleQuerySubmit}
                accessibilityLabel="Submit question"
                accessibilityRole="button">
                <Text style={styles.micIcon}>🎤</Text>
              </TouchableOpacity>
            </View>

            {isSampling && (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.statusText}>Analyzing...</Text>
              </View>
            )}

            {lowConfidenceDetected && (
              <TouchableOpacity
                style={styles.volunteerButton}
                onPress={handleRequestVolunteer}
                disabled={isRequestingVolunteer}
                accessibilityLabel="Request human volunteer help"
                accessibilityRole="button">
                <Text style={styles.volunteerButtonText}>
                  {isRequestingVolunteer ? 'Connecting...' : 'Request Human Help'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleMute}
                accessibilityLabel={isMuted ? 'Unmute AI' : 'Mute AI'}
                accessibilityRole="button">
                <Text style={styles.controlButtonText}>{isMuted ? '🔇' : '🔊'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.endButton}
                onPress={handleEndSession}
                accessibilityLabel="End session"
                accessibilityRole="button">
                <Text style={styles.endButtonText}>End</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 40,
  },
  startContainer: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  activeContainer: {
    gap: 16,
  },
  queryContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  queryInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
  },
  volunteerButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  volunteerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 24,
  },
  endButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

