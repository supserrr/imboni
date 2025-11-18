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
import { Audio } from 'expo-av';
// TODO: Update to use new interaction loop and services
// The new architecture uses:
// - lib/services/realtime/interactionLoop.ts for continuous loop
// - lib/services/audio/whisperGroq.ts for STT (requires MediaStream)
// - lib/services/audio/elevenLabsTTS.ts for TTS
// - lib/services/camera/frameCapture.ts for camera
// - lib/services/vision/moondreamReasoning.ts for vision
// 
// Note: Full integration requires MediaStream setup for audio capture.
// For now, keeping basic structure with new imports.

import { useAI } from '@/contexts/AIContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatAIResponse } from '@/lib/utils/aiResponse';
import { triggerHaptic } from '@/lib/utils/accessibility';
import { synthesizeSpeech } from '@/lib/services/audio/elevenLabsTTS';
import { supabase } from '@/lib/supabase';
import { MoondreamResponse } from '@/lib/services/vision/moondreamReasoning';
import { startContinuousCapture, stopCapture } from '@/lib/services/camera/frameCapture';
import { searchVolunteer } from '@/lib/services/realtime/volunteerMatching';

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
  // TODO: Voice recognition will be handled by interactionLoop with Groq Whisper (requires MediaStream setup)
  const soundRef = useRef<Audio.Sound | null>(null);
  const isSpeakingRef = useRef(false); // Prevent race conditions
  const isProcessingFrameRef = useRef(false); // Prevent multiple frames processing simultaneously
  const lastSpeechTimeRef = useRef<number>(0); // Track last time we spoke to prevent rapid responses
  const currentAnalysisAbortRef = useRef<AbortController | null>(null); // For canceling pending analysis
  const samplingCleanupRef = useRef<(() => void) | null>(null); // Ref for immediate access to cleanup
  const isRateLimitedRef = useRef(false); // Track if we're rate limited
  const rateLimitRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Retry timeout for rate limits

  /**
   * Immediately interrupts any ongoing speech playback.
   */
  const interruptSpeech = async () => {
    if (soundRef.current) {
      try {
        const sound = soundRef.current;
        soundRef.current = null; // Clear ref first to prevent race conditions
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error interrupting speech:', error);
        // Ensure ref is cleared even on error
        soundRef.current = null;
      }
    }
    isSpeakingRef.current = false;
  };

  /**
   * Speaks text using ElevenLabs TTS.
   */
  const speakResponse = async (text: string) => {
    if (!text.trim()) return;

    // If already speaking, don't interrupt - just skip this response
    // This prevents cutting mid-response and restarting
    if (isSpeakingRef.current) {
      console.log('[speakResponse] Skipping - already speaking');
      return;
    }

    // Prevent rapid successive responses - minimum 2 seconds between responses
    const now = Date.now();
    const timeSinceLastSpeech = now - lastSpeechTimeRef.current;
    const minDelayBetweenResponses = 2000; // 2 seconds minimum
    
    if (timeSinceLastSpeech < minDelayBetweenResponses) {
      console.log(`[speakResponse] Skipping - too soon after last response (${timeSinceLastSpeech}ms < ${minDelayBetweenResponses}ms)`);
      return;
    }

    // Set flag immediately to prevent race conditions
    isSpeakingRef.current = true;
    lastSpeechTimeRef.current = now;

    try {
      // Get user's voice preferences
      const voiceId = profile?.preferred_voice || undefined;
      const speechRate = profile?.speech_rate || 1.0;

      // Synthesize speech using ElevenLabs TTS
      const audioSource = await synthesizeSpeech(text, voiceId, {
        speechRate,
      });

      // Check if we should still speak (user might have interrupted)
      if (!isSpeakingRef.current) {
        return;
      }

      // Ensure no other audio is playing before creating new sound
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (error) {
          // Ignore errors if already unloaded
        }
        soundRef.current = null;
      }

      // Load and play the audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioSource.uri },
        { 
          shouldPlay: true,
          volume: 1.0,
          isMuted: false,
        }
      );

      soundRef.current = sound;

      // Set up playback status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish || status.isStopped) {
            isSpeakingRef.current = false;
            sound.unloadAsync().catch(console.error);
            soundRef.current = null;
            
            // Auto-resume frame sampling after response completes
            if (isActive) {
              restartFrameSampling();
            }
          }
        } else if (status.error) {
          console.error('Playback error:', status.error);
          isSpeakingRef.current = false;
          soundRef.current = null;
          
          // Auto-resume frame sampling even on error
          if (isActive) {
            restartFrameSampling();
          }
        }
      });
    } catch (error) {
      console.error('Error speaking with ElevenLabs TTS:', error);
      isSpeakingRef.current = false;
      // Auto-resume frame sampling even on error
      if (isActive) {
        restartFrameSampling();
      }
    }
  };

  /**
   * Restarts frame sampling after user question is processed.
   */
  const restartFrameSampling = () => {
    if (!isActive || !cameraRef.current) return;

    // Don't restart if rate limited - wait for retry timeout
    if (isRateLimitedRef.current) {
      return;
    }

    // Stop any existing sampling using ref for immediate access
    if (samplingCleanupRef.current) {
      samplingCleanupRef.current();
      samplingCleanupRef.current = null;
      setSamplingCleanup(null);
    }

    // Restart frame sampling using new frameCapture service
    const fps = 2; // Default 2 FPS
    const cleanup = startContinuousCapture(
      cameraRef,
      fps,
      async (frame) => {
        // Skip if rate limited, processing, speaking, or listening
        if (isRateLimitedRef.current || isProcessingFrameRef.current || isListening || isSpeakingRef.current) {
          return;
        }

        // Set processing flag to prevent concurrent frame processing
        isProcessingFrameRef.current = true;

        try {
          // Double-check we're still not speaking/listening/rate limited
          if (isSpeakingRef.current || isListening || isRateLimitedRef.current) {
            return;
          }

          // Clear rate limit flag if we got a successful response
          isRateLimitedRef.current = false;

          // Analyze frame using new service
          const analysis = await analyzeImage(frame.base64);

          // Check confidence (using new threshold 0.55)
          const confidenceThreshold = profile?.confidence_threshold || 0.55;
          const isLow = analysis.confidence < confidenceThreshold;
          const response = formatAIResponse(
            analysis, 
            profile?.verbosity_level || 'detailed',
            isLow
          );
          
          // Only speak if we're still not speaking (final check)
          if (!isSpeakingRef.current && !isListening && !isRateLimitedRef.current) {
            triggerHaptic('light'); // Light haptic to indicate analysis
            await speakResponse(response);
          }
        } catch (error) {
          console.error('Frame analysis error:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          const isRateLimitError = errorMsg.includes('429') || errorMsg.includes('Too many requests');
          
          if (isRateLimitError) {
            isRateLimitedRef.current = true;
            if (samplingCleanupRef.current) {
              samplingCleanupRef.current();
              samplingCleanupRef.current = null;
            }
            // Retry after 30 seconds
            rateLimitRetryTimeoutRef.current = setTimeout(() => {
              isRateLimitedRef.current = false;
              rateLimitRetryTimeoutRef.current = null;
              if (isActive && cameraRef.current) {
                restartFrameSampling();
              }
            }, 30000);
          }
        } finally {
          isProcessingFrameRef.current = false;
        }
      },
      {
        shouldSkip: () => {
          return isRateLimitedRef.current || isSpeakingRef.current || isListening;
        },
      }
    );
    samplingCleanupRef.current = cleanup;
    setSamplingCleanup(() => cleanup);
  };

  /**
   * Handles voice query submission.
   * TODO: Will be used when Groq Whisper STT is integrated via interactionLoop.
   */
  const handleVoiceQuery = async (query: string) => {
    if (!query.trim() || !cameraRef.current) return;

    triggerHaptic('light');
    setQuery(query);
    setIsListening(false);

    // Cancel any pending analysis
    if (currentAnalysisAbortRef.current) {
      currentAnalysisAbortRef.current.abort();
      currentAnalysisAbortRef.current = null;
    }

    try {
      // Capture current frame and analyze with query
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (photo?.base64) {
        // Create new AbortController for this analysis
        const abortController = new AbortController();
        currentAnalysisAbortRef.current = abortController;

        // Add timeout to prevent hanging
        const analysisPromise = analyzeImage(photo.base64, query);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            abortController.abort();
            reject(new Error('Analysis timeout - request took too long'));
          }, 30000); // 30 second timeout
        });

        const analysis = await Promise.race([analysisPromise, timeoutPromise]);
        
        // Check if analysis was aborted
        if (abortController.signal.aborted) {
          return;
        }

        currentAnalysisAbortRef.current = null;
        
        // Check confidence for this specific analysis (using new threshold 0.55)
        const confidenceThreshold = profile?.confidence_threshold || 0.55;
        const isLow = analysis.confidence < confidenceThreshold;
        const response = formatAIResponse(
          analysis, 
          profile?.verbosity_level || 'detailed',
          isLow
        );
        
        // Speak the response (no text display)
        triggerHaptic('medium'); // Indicate response is starting
        await speakResponse(response);
      } else {
        throw new Error('Failed to capture photo');
      }
    } catch (error) {
      // Ignore aborted errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('Query error:', error);
      const errorMessage = error instanceof Error && error.message.includes('timeout')
        ? 'The analysis is taking too long. Please try again.'
        : 'Sorry, I encountered an error analyzing the image. Please try again.';
      await speakResponse(errorMessage);
    }
  };

  useEffect(() => {
    // Redirect volunteers - this screen is only for users
    if (profile?.role === 'volunteer') {
      router.replace('/(tabs)');
      return;
    }
  }, [profile?.role, router]);

  useEffect(() => {
    // Reset session state on mount to prevent stale state from previous sessions
    stopSession();

    // Configure audio mode for playback
    // Note: allowsRecordingIOS must be true for voice input to work
    (async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: true, // Required for voice input
      });
    })();

    // Request camera permission
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // TODO: Voice recognition will be handled by interactionLoop with Groq Whisper
    // This requires MediaStream setup which needs additional configuration
    // For now, voice recognition is disabled

    // Cleanup
    return () => {
      // Stop any ongoing speech
      interruptSpeech().catch(console.error);
      
      // Stop frame sampling (use ref for immediate access)
      if (samplingCleanupRef.current) {
        samplingCleanupRef.current();
        samplingCleanupRef.current = null;
      }
      
      // Clear rate limit retry timeout if exists
      if (rateLimitRetryTimeoutRef.current) {
        clearTimeout(rateLimitRetryTimeoutRef.current);
        rateLimitRetryTimeoutRef.current = null;
      }
      
      // Reset rate limit flag
      isRateLimitedRef.current = false;
      
      // Cancel any pending analysis
      if (currentAnalysisAbortRef.current) {
        currentAnalysisAbortRef.current.abort();
        currentAnalysisAbortRef.current = null;
      }
      
      stopSession();
      stopCapture(); // Stop any frame capture
    };
  }, []);

  /**
   * Starts the AI session, begins frame sampling, and automatically starts voice recognition.
   */
  const handleStartSession = async () => {
    if (!cameraRef.current) return;

    triggerHaptic('medium');
    startSession();

    // TODO: Voice recognition will be integrated via interactionLoop with Groq Whisper
    // This requires MediaStream setup which needs additional configuration
    // For now, only frame analysis is active

    // Start continuous frame capture using new service
    restartFrameSampling();
  };

  /**
   * Requests microphone permission for Android.
   * TODO: Will be used when Groq Whisper STT is integrated via interactionLoop.
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
   * Requests human volunteer help.
   */
  const handleRequestVolunteer = async () => {
    if (!user || isRequestingVolunteer) return;

    triggerHaptic('medium');
    setIsRequestingVolunteer(true);

    try {
      // Use new volunteer matching service
      // Note: Requires user location for proximity matching
      // For now, using default location (0,0) - update with actual user location
      const userLatitude = 0; // TODO: Get from user location
      const userLongitude = 0; // TODO: Get from user location
      
      const result = await searchVolunteer(
        user.id,
        userLatitude,
        userLongitude,
        3, // max attempts
        (match) => {
          console.log('Found volunteer:', match);
        },
        () => {
          Alert.alert('No Volunteers Available', 'No volunteers are currently available. Please try again later.');
        }
      );

      if (result?.callRequestId) {
        // Navigate to call screen
        router.push({
          pathname: '/call',
          params: { callId: result.callRequestId, role: 'user' },
        });
      }
    } catch (error) {
      console.error('Error requesting volunteer:', error);
      Alert.alert('Error', 'Failed to connect with volunteer. Please try again.');
    } finally {
      setIsRequestingVolunteer(false);
    }
  };

  /**
   * Ends the AI session and stops all operations.
   */
  const handleEndSession = async () => {
    triggerHaptic('light');
    
    // Stop frame sampling (use ref for immediate access)
    if (samplingCleanupRef.current) {
      samplingCleanupRef.current();
      samplingCleanupRef.current = null;
      setSamplingCleanup(null);
    }
    
    // Clear rate limit retry timeout if exists
    if (rateLimitRetryTimeoutRef.current) {
      clearTimeout(rateLimitRetryTimeoutRef.current);
      rateLimitRetryTimeoutRef.current = null;
    }
    
    // Reset rate limit flag
    isRateLimitedRef.current = false;
    
    // Cancel any pending analysis
    if (currentAnalysisAbortRef.current) {
      currentAnalysisAbortRef.current.abort();
      currentAnalysisAbortRef.current = null;
    }
    
    // Stop any ongoing speech
    await interruptSpeech();
    
    // Stop frame capture service
    stopCapture();
    
    stopSession();
    router.back();
  };

  // Don't render anything if user is a volunteer (will be redirected)
  if (profile?.role === 'volunteer') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
              accessibilityLabel="Start AI analysis. Voice recognition will begin automatically."
              accessibilityRole="button">
              <Text style={styles.startButtonText}>Start Analysis</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeContainer}>
            {lowConfidenceDetected && isActive && profile?.role === 'user' && isSampling && (
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
              accessibilityLabel="End session and stop all operations"
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

