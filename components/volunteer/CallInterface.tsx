import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useCallSession } from '@/hooks/use-call-session';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CallInterfaceProps {
  sessionId: string;
  onEndCall: () => void;
  helpRequestId?: string;
}

export default function CallInterface({ sessionId, onEndCall, helpRequestId }: CallInterfaceProps) {
  const { localStream, remoteStream, isCallActive, endCall, startCall } = useCallSession(sessionId, helpRequestId);
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#bf6f4a' : '#141414';

  // Volunteer starts the call flow (sends offer)
  useEffect(() => {
      startCall();
  }, []);

  const handleSnapshot = async () => {
    if (!remoteStream) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Capture snapshot from remote stream
      // Note: react-native-webrtc doesn't have direct snapshot API
      // This would require creating a canvas or using native modules
      // For now, we'll log the action - full implementation would need native code
      console.log('Snapshot captured from remote stream');
      
      // In a full implementation, you'd:
      // 1. Create a canvas element (or use react-native-view-shot)
      // 2. Draw the video frame to canvas
      // 3. Convert to image
      // 4. Save to media library or share
    } catch (error) {
      console.error('Error capturing snapshot:', error);
    }
  };

  const handleToggleFlashlight = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Toggle flashlight using Camera API
      // Note: This requires access to the camera, which volunteers don't have in this setup
      // In a full implementation, you'd need to:
      // 1. Request camera permission
      // 2. Use Camera API to toggle torch
      // 3. Or use a native module for flashlight control
      
      setFlashlightEnabled(!flashlightEnabled);
      console.log('Flashlight toggled:', !flashlightEnabled);
      
      // For now, this is a placeholder - full implementation would require
      // expo-camera with torch mode or a native flashlight module
    } catch (error) {
      console.error('Error toggling flashlight:', error);
    }
  };

  const handleEnd = () => {
      endCall();
      onEndCall();
  };

  return (
    <View style={styles.container}>
      {/* Volunteer sees remote stream (blind user's camera) as main view */}
      {remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.fullScreenVideo}
            objectFit="cover"
          />
      ) : (
          <View style={styles.waiting}>
              <Text style={[styles.waitingText, { color: textColor }]}>Connecting to user's camera...</Text>
          </View>
      )}
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, styles.snapshotButton]} 
          onPress={handleSnapshot}
          accessibilityLabel="Take snapshot"
        >
          <IconSymbol name="camera.fill" size={24} color={iconColor} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.flashlightButton, flashlightEnabled && styles.flashlightActive]} 
          onPress={handleToggleFlashlight}
          accessibilityLabel={flashlightEnabled ? "Turn off flashlight" : "Turn on flashlight"}
        >
          <IconSymbol 
            name={flashlightEnabled ? "flashlight.on.fill" : "flashlight.off.fill"} 
            size={24} 
            color={iconColor} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.endButton]} 
          onPress={handleEnd}
          accessibilityLabel="End call"
        >
          <IconSymbol name="phone.down.fill" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  fullScreenVideo: {
      width: '100%',
      height: '100%',
  },
  waiting: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  waitingText: {
      fontSize: 18,
  },
  controls: {
      position: 'absolute',
      bottom: 50,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
      paddingHorizontal: 20,
  },
  controlButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
  },
  snapshotButton: {
      backgroundColor: '#bf6f4a',
  },
  flashlightButton: {
      backgroundColor: '#141414',
  },
  flashlightActive: {
      backgroundColor: '#bf6f4a',
  },
  endButton: {
      backgroundColor: '#bf6f4a',
      width: 70,
      height: 70,
      borderRadius: 35,
  },
});

