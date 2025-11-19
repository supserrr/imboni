import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useCallSession } from '@/hooks/use-call-session';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useEffect } from 'react';

interface CallInterfaceProps {
  sessionId: string;
  onEndCall: () => void;
}

export default function CallInterface({ sessionId, onEndCall }: CallInterfaceProps) {
  const { localStream, remoteStream, isCallActive, endCall, startCall } = useCallSession(sessionId);

  // Volunteer starts the call flow (sends offer)
  useEffect(() => {
      startCall();
  }, []);

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
              <Text style={styles.waitingText}>Connecting to user's camera...</Text>
          </View>
      )}
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.endButton} onPress={handleEnd}>
             <IconSymbol name="phone.down.fill" size={40} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
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
      color: 'white',
      fontSize: 18,
  },
  controls: {
      position: 'absolute',
      bottom: 50,
      width: '100%',
      alignItems: 'center',
  },
  endButton: {
      backgroundColor: '#FF3B30',
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
  }
});

