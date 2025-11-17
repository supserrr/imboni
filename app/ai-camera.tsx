import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import { getVoice, isSpeechRecognitionAvailable } from '@/lib/utils/speechRecognition';
import { useAI } from '@/contexts/AIContext';
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
  const cameraRef = useRef<CameraView>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [samplingCleanup, setSamplingCleanup] = useState<(() => void) | null>(null);
  const [isRequestingVolunteer, setIsRequestingVolunteer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const voiceRef = useRef(getVoice());

  /**
   * Handles voice query submission.
   */
  const handleVoiceQuery = async (query: string) => {
    if (!query.trim() || !cameraRef.current) return;

    triggerHaptic('light');
    setQuery(query);
    setIsListening(false);

    try {
      // Capture current frame and analyze with query
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (photo?.base64) {
        const analysis = await analyzeImage(photo.base64, query);
        const response = formatAIResponse(analysis, profile?.verbosity_level || 'detailed');
        // Response will be displayed in UI, OS accessibility will announce it
      }
    } catch (error) {
      console.error('Query error:', error);
      // Error will be displayed in UI, OS accessibility will announce it
    }
  };

  useEffect(() => {
    // Request camera permission
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Set up voice recognition event listeners
    const Voice = voiceRef.current;
    
    Voice.onSpeechStart = () => {
      setIsListening(true);
      triggerHaptic('light');
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    Voice.onSpeechResults = (event) => {
      if (event.value && event.value.length > 0) {
        const text = event.value[0];
        setRecognizedText(text);
        handleVoiceQuery(text);
      }
    };

    Voice.onSpeechError = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      triggerHaptic('error');
    };

    // Cleanup
    return () => {
      if (samplingCleanup) {
        samplingCleanup();
      }
      stopSession();
      Voice.destroy().then(() => Voice.removeAllListeners());
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
   * Requests microphone permission for Android.
   */
  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Imboni needs access to your microphone for voice input.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting microphone permission:', err);
      return false;
    }
  };

  /**
   * Starts voice input for asking questions.
   */
  const handleStartVoiceInput = async () => {
    // Request microphone permission if needed
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required for voice input. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if voice recognition is available
    if (!isSpeechRecognitionAvailable()) {
      Alert.alert(
        'Development Build Required',
        'Voice input requires a development build. In Expo Go, this feature is not available. Please create a development build to use voice input.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      triggerHaptic('medium');
      setRecognizedText('');
      await voiceRef.current.start('en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      Alert.alert(
        'Error',
        'Could not start voice recognition. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Stops voice input.
   */
  const handleStopVoiceInput = async () => {
    try {
      await voiceRef.current.stop();
      setIsListening(false);
      triggerHaptic('light');
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
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
            <TouchableOpacity
              style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
              onPress={isListening ? handleStopVoiceInput : handleStartVoiceInput}
              accessibilityLabel={isListening ? 'Stop listening. Tap to stop voice input.' : 'Tap to ask a question using voice'}
              accessibilityRole="button"
              accessibilityHint={isListening ? 'Double tap to stop listening' : 'Double tap to start voice input and ask a question about what you see'}>
              <Text style={styles.voiceButtonText}>
                {isListening ? 'Listening... Tap to Stop' : 'Tap to Ask Question'}
              </Text>
            </TouchableOpacity>

            {recognizedText && !isListening && (
              <View style={styles.recognizedTextContainer}>
                <Text style={styles.recognizedTextLabel}>You said:</Text>
                <Text style={styles.recognizedText}>{recognizedText}</Text>
              </View>
            )}

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

            <TouchableOpacity
              style={styles.endButton}
              onPress={handleEndSession}
              accessibilityLabel="End session"
              accessibilityRole="button">
              <Text style={styles.endButtonText}>End Session</Text>
            </TouchableOpacity>
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
    alignItems: 'stretch',
  },
  voiceButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  recognizedTextContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  recognizedTextLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  recognizedText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
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
  endButton: {
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

