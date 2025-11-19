import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useCallSession } from '@/hooks/use-call-session';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CallInterfaceProps {
  sessionId: string;
  onEndCall: () => void;
}

export default function CallInterface({ sessionId, onEndCall }: CallInterfaceProps) {
  const { localStream, remoteStream, isCallActive, endCall, startCall } = useCallSession(sessionId);

  const handleEnd = () => {
      endCall();
      onEndCall();
  };

  // Auto-start call when component mounts
  // useEffect(() => { startCall(); }, []); 
  // Actually startCall sends offer, so only one side should do it ideally, or we handle glare. 
  // Typically volunteer joins and offers, or blind user initiates. 
  // Let's assume caller (blind user?) sends offer?
  // The plan says: "Volunteer joins... Can see live feed". 
  // So volunteer probably initiates the connection after accepting.
  // So blind user just waits for offer.
  
  return (
    <View style={styles.container}>
      {/* We show local camera as background if no remote stream, or picture-in-picture */}
      {/* Blind user mainly wants to show their camera to volunteer */}
      
      {localStream && (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.fullScreenVideo}
            objectFit="cover"
            mirror={false} 
          />
      )}

      {/* In a real app, blind user might not need to see volunteer, but audio is key */}
      
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

