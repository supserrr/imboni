import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface ActiveCallScreenProps {
  onEndCall: () => void;
  callDuration?: number; // Duration in seconds
  showVideoFeed?: boolean; // Whether to show the actual video call feed
  videoFeedComponent?: React.ReactNode; // Optional video call component to overlay
}

/**
 * Active call screen component for blind users.
 * Displays a full-screen camera view with a single end call button.
 */
export default function ActiveCallScreen({
  onEndCall,
  callDuration = 0,
  showVideoFeed = false,
  videoFeedComponent,
}: ActiveCallScreenProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [currentTime, setCurrentTime] = useState(new Date());
  const cameraRef = useRef<CameraView>(null);

  // Update current time every minute
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timeInterval);
  }, []);

  // Format call duration
  const formattedDuration = React.useMemo(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleEndCallPress = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: onEndCall,
        },
      ],
      { cancelable: true }
    );
  };

  const styles = createStyles(insets);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Camera Feed Area */}
      <View style={styles.cameraContainer}>
        {/* Always show camera when permission is granted */}
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          />
        ) : (
          <View style={styles.cameraPlaceholder} />
        )}
        
        {/* Overlay video feed when available */}
        {showVideoFeed && videoFeedComponent && (
          <View style={styles.videoFeedOverlay}>
            {videoFeedComponent}
          </View>
        )}
      </View>

      {/* End Call Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.endCallButton}
          onPress={handleEndCallPress}
          accessibilityRole="button"
          accessibilityLabel="End call"
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={32} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(insets: { top: number; bottom: number; left: number; right: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    cameraContainer: {
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
    },
    camera: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    cameraPlaceholder: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    videoFeedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flex: 1,
    },
    bottomActions: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      // Position above tab bar: tab bar height (~80px) + safe area + spacing
      paddingBottom: Math.max(insets.bottom, 0) + 90, // 80px tab bar + 10px spacing
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
    },
    endCallButton: {
      width: 75,
      height: 75,
      borderRadius: 37.5,
      backgroundColor: '#FF3B30',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
  });
}

