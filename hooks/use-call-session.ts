import { useEffect, useState, useCallback } from 'react';
import { webRTCManager } from '@/lib/webrtc';
import { supabase } from '@/lib/supabase';
import { MediaStream } from 'react-native-webrtc';

export const useCallSession = (sessionId: string | null) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    // Initialize WebRTC
    const init = async () => {
      const stream = await webRTCManager.startLocalStream();
      setLocalStream(stream);
      webRTCManager.onRemoteStream = (stream) => {
        setRemoteStream(stream);
        setIsCallActive(true);
      };

      // Signaling subscription
      const channel = supabase.channel(`session:${sessionId}`);
      
      webRTCManager.onIceCandidate = (candidate) => {
        channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: candidate,
        });
      };

      channel
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
           await webRTCManager.setRemoteDescription(payload);
           const answer = await webRTCManager.createAnswer();
           channel.send({ type: 'broadcast', event: 'answer', payload: answer });
        })
        .on('broadcast', { event: 'answer' }, async ({ payload }) => {
           await webRTCManager.setRemoteDescription(payload);
        })
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
           await webRTCManager.addIceCandidate(payload);
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
        webRTCManager.cleanup();
      };
    };

    init();

    return () => {
        webRTCManager.cleanup();
    }

  }, [sessionId]);

  const startCall = async () => {
      if (!sessionId) return;
      const offer = await webRTCManager.createOffer();
      await supabase.channel(`session:${sessionId}`).send({
          type: 'broadcast',
          event: 'offer',
          payload: offer,
      });
  };

  const endCall = () => {
      webRTCManager.cleanup();
      setIsCallActive(false);
      // Update session in Supabase to ended
  };

  return {
    localStream,
    remoteStream,
    isCallActive,
    startCall,
    endCall
  };
};

