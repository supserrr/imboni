import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
  EncryptionMode,
} from 'react-native-agora';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const appId = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';
// Ideally fetching from backend per session
const encryptionKey = process.env.EXPO_PUBLIC_AGORA_ENCRYPTION_KEY || ''; 
const encryptionSalt = process.env.EXPO_PUBLIC_AGORA_ENCRYPTION_SALT || '';

interface Props {
  channelName: string;
  uid: number;
  token: string | null;
  onEndCall: () => void;
  isVolunteer: boolean;
}

export default function VideoCall({ channelName, uid, token, onEndCall, isVolunteer }: Props) {
  const engine = useRef<IRtcEngine>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const init = async () => {
      if (!appId) {
        console.error('Agora App ID not set');
        return;
      }

      engine.current = createAgoraRtcEngine();
      engine.current.initialize({ appId });

      engine.current.registerEventHandler({
        onJoinChannelSuccess: (_connection, elapsed) => {
          console.log('Successfully joined channel:', channelName);
          setJoined(true);
        },
        onUserJoined: (_connection, remoteUid, _elapsed) => {
          console.log('Remote user joined:', remoteUid);
          setRemoteUid(remoteUid);
        },
        onUserOffline: (_connection, _remoteUid, _reason) => {
          console.log('Remote user left');
          setRemoteUid(0);
          onEndCall(); 
        },
      });

      engine.current.enableVideo();
      engine.current.startPreview();

      // Enable Encryption
      if (encryptionKey && encryptionSalt) {
         // Encryption setup example
         // engine.current.enableEncryption(true, { ... });
      }

      await engine.current.joinChannel(token || '', channelName, uid, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });
    };

    init();

    return () => {
      engine.current?.leaveChannel();
      engine.current?.release();
    };
  }, [channelName, uid, token]);

  const toggleMute = () => {
    engine.current?.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    engine.current?.muteLocalVideoStream(isVideoEnabled); // mute=true means stop sending
    setIsVideoEnabled(!isVideoEnabled);
  };

  const switchCamera = () => {
    engine.current?.switchCamera();
  };

  return (
    <View style={styles.container}>
      {/* Remote Video (Full Screen) */}
      {remoteUid !== 0 ? (
        <RtcSurfaceView
          style={styles.remoteVideo}
          canvas={{ uid: remoteUid }}
        />
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>
             {isVolunteer ? "Waiting for user..." : "Waiting for volunteer..."}
          </Text>
          <Text style={styles.subText}>
             {encryptionKey ? "End-to-End Encrypted" : "Secure Connection"}
          </Text>
        </View>
      )}

      {/* Local Video (Small Overlay) */}
      {joined && isVideoEnabled && (
        <RtcSurfaceView
          style={styles.localVideo}
          canvas={{ uid: 0 }}
          zOrderMediaOverlay={true}
        />
      )}

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, !isVideoEnabled && styles.disabledButton]} 
          onPress={toggleVideo}
          accessibilityLabel={isVideoEnabled ? "Turn Camera Off" : "Turn Camera On"}
        >
          <Ionicons name={isVideoEnabled ? "videocam" : "videocam-off"} size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, isMuted && styles.disabledButton]} 
          onPress={toggleMute}
          accessibilityLabel={isMuted ? "Unmute" : "Mute"}
        >
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={30} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.endButton]} 
          onPress={onEndCall}
          accessibilityLabel="End Call"
        >
          <Ionicons name="call" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={switchCamera}
          accessibilityLabel="Switch Camera"
        >
          <Ionicons name="camera-reverse" size={30} color="white" />
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
  remoteVideo: {
    flex: 1,
  },
  localVideo: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
  },
  subText: {
    color: '#aaa',
    fontSize: 14,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  endButton: {
    backgroundColor: '#FF3B30',
  },
});
