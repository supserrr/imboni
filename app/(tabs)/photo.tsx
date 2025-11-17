import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import { useAI } from '@/contexts/AIContext';
import { useAudio } from '@/contexts/AudioContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatAIResponse } from '@/lib/utils/aiResponse';
import { triggerHaptic } from '@/lib/utils/accessibility';
import { supabase } from '@/lib/supabase';

/**
 * Photo mode screen component for capturing and analyzing photos.
 */
export default function PhotoModeScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const { analyzeImage } = useAI();
  // Removed custom TTS - OS accessibility handles narration
  const cameraRef = useRef<CameraView>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isRequestingVolunteer, setIsRequestingVolunteer] = useState(false);

  useEffect(() => {
    // Redirect volunteers - they don't have access to photo mode
    if (profile?.role === 'volunteer') {
      router.replace('/(tabs)');
      return;
    }

    // Request camera permission
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Screen announcement handled by OS accessibility via accessibilityLabel
  }, [profile?.role, router]);

  /**
   * Captures a photo and analyzes it.
   */
  const handleCapture = async () => {
    if (!cameraRef.current) return;

    triggerHaptic('medium');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
        setIsAnalyzing(true);

        // Analyze the photo
        if (photo.base64) {
          const result = await analyzeImage(photo.base64);
          const formattedResponse = formatAIResponse(result, profile?.verbosity_level || 'detailed');
          setAnalysis(formattedResponse);
          // Analysis will be displayed in UI, OS accessibility will announce it
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      // Error will be displayed in UI, OS accessibility will announce it
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Retakes the photo.
   */
  const handleRetry = () => {
    triggerHaptic('light');
    setCapturedPhoto(null);
    setAnalysis(null);
  };

  /**
   * Requests volunteer help for the photo.
   */
  const handleAskVolunteer = async () => {
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
          description: 'Help analyzing a photo',
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
   * Saves the photo (optional, default NO as per spec).
   */
  const handleSave = () => {
    Alert.alert(
      'Save Photo',
      'Photo saving is not implemented in MVP. Photos are analyzed but not stored.',
      [{ text: 'OK' }]
    );
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
      {!capturedPhoto ? (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            accessibilityElementsHidden={true}
          />
          <View style={styles.overlay}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              accessibilityLabel="Capture photo"
              accessibilityRole="button">
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Image source={{ uri: capturedPhoto }} style={styles.capturedImage} />

          {isAnalyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.analyzingText}>Analyzing...</Text>
            </View>
          ) : (
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisTitle}>Analysis</Text>
              <Text style={styles.analysisText}>{analysis || 'No analysis available'}</Text>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleRetry}
                  accessibilityLabel="Retry photo"
                  accessibilityRole="button">
                  <Text style={styles.actionButtonText}>Retry</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.volunteerButton]}
                  onPress={handleAskVolunteer}
                  disabled={isRequestingVolunteer}
                  accessibilityLabel="Ask volunteer for help"
                  accessibilityRole="button">
                  <Text style={styles.actionButtonText}>
                    {isRequestingVolunteer ? 'Connecting...' : 'Ask Volunteer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#007AFF',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  capturedImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain',
  },
  analyzingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  analyzingText: {
    color: '#fff',
    fontSize: 18,
  },
  analysisContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  volunteerButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
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

