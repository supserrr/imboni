import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

interface CameraFeedProps {
  onFrameCapture?: (uri: string) => void;
  autoCapture?: boolean;
  captureInterval?: number;
  streamMode?: boolean;
  onStreamReady?: (stream: MediaStream) => void;
}

/**
 * Full-screen camera feed component.
 * Handles camera permissions and live feed.
 */
export function CameraFeed({
  onFrameCapture,
  autoCapture = false,
  captureInterval = 1000,
  streamMode = false,
  onStreamReady,
}: CameraFeedProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (autoCapture && permission?.granted && onFrameCapture) {
      captureIntervalRef.current = setInterval(() => {
        captureFrame();
      }, captureInterval);
    }

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, [autoCapture, permission?.granted, captureInterval, onFrameCapture]);

  useEffect(() => {
    if (streamMode && permission?.granted && onStreamReady) {
      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing === 'back' ? 'environment' : 'user' },
            audio: true,
          });
          
          if (stream) {
            streamRef.current = stream;
            onStreamReady(stream);
          }
        } catch (error) {
          console.error('Error getting media stream:', error);
        }
      })();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [streamMode, permission?.granted, onStreamReady, facing]);

  /**
   * Captures a frame from the camera.
   */
  async function captureFrame() {
    if (!cameraRef.current || !onFrameCapture) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        onFrameCapture(photo.uri);
      }
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required to use this feature.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode={streamMode ? "video" : "picture"}
      >
        <View style={styles.overlay} />
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

