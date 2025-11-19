import { useEffect, useState, useCallback, useRef } from 'react';
import { webRTCManager } from '@/lib/webrtc';
import { supabase } from '@/lib/supabase';
import { MediaStream } from 'react-native-webrtc';
import { useAppStore } from '@/store/app-store';
import { endSession, createSession } from '@/api/sessions';

export const useCallSession = (sessionId: string | null, helpRequestId?: string) => {
  const { user } = useAppStore();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const callStartTimeRef = useRef<number | null>(null);
  const sessionRecordIdRef = useRef<string | null>(null);
  const helpRequestIdRef = useRef<string | null>(helpRequestId || null);

  useEffect(() => {
    if (!sessionId) return;

    // Initialize WebRTC
    const init = async () => {
      const stream = await webRTCManager.startLocalStream();
      setLocalStream(stream);
      webRTCManager.onRemoteStream = (stream) => {
        setRemoteStream(stream);
        setIsCallActive(true);
        callStartTimeRef.current = Date.now();
        
        // Create session record when call becomes active
        if (helpRequestIdRef.current && user) {
          createSessionRecord();
        }
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

  }, [sessionId, user]);

  const createSessionRecord = async () => {
    if (!user || !helpRequestIdRef.current) return;
    
    try {
      // Get help request to find user_id and volunteer_id
      const { data: helpRequest } = await supabase
        .from('help_requests')
        .select('user_id, assigned_volunteer')
        .eq('id', helpRequestIdRef.current)
        .single();
      
      if (!helpRequest) return;
      
      const userId = helpRequest.user_id;
      const volunteerId = helpRequest.assigned_volunteer;
      
      if (!volunteerId) return;
      
      // Create session record
      const session = await createSession(helpRequestIdRef.current, userId, volunteerId);
      sessionRecordIdRef.current = session.id;
      
      // Update help request status
      await supabase
        .from('help_requests')
        .update({ status: 'in_progress' })
        .eq('id', helpRequestIdRef.current);
    } catch (error) {
      console.error('Error creating session record:', error);
    }
  };

  const startCall = async () => {
      if (!sessionId) return;
      const offer = await webRTCManager.createOffer();
      await supabase.channel(`session:${sessionId}`).send({
          type: 'broadcast',
          event: 'offer',
          payload: offer,
      });
  };

  const endCall = async () => {
      const duration = callStartTimeRef.current 
        ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        : 0;
      
      // Update session record
      if (sessionRecordIdRef.current) {
        try {
          await endSession(sessionRecordIdRef.current, duration);
          
          // Update help request status
          if (helpRequestIdRef.current) {
            await supabase
              .from('help_requests')
              .update({ status: 'completed' })
              .eq('id', helpRequestIdRef.current);
          }
          
          // Update volunteer behavior metrics
          if (user && user.user_metadata?.type === 'volunteer' && duration > 0) {
            await updateVolunteerMetrics(user.id, duration);
          }
        } catch (error) {
          console.error('Error ending session:', error);
        }
      }
      
      webRTCManager.cleanup();
      setIsCallActive(false);
      callStartTimeRef.current = null;
      sessionRecordIdRef.current = null;
  };

  const updateVolunteerMetrics = async (volunteerId: string, duration: number) => {
    try {
      // Get current behavior stats
      const { data: behavior } = await supabase
        .from('volunteer_behavior')
        .select('*')
        .eq('volunteer_id', volunteerId)
        .single();
      
      if (!behavior) return;
      
      const currentAvg = behavior.response_time_avg || 0;
      const acceptCount = behavior.accept_count || 0;
      const successSessions = behavior.success_sessions || 0;
      
      // Calculate new average response time (simplified - would need actual response time)
      // For now, just increment success sessions
      const newSuccessSessions = successSessions + 1;
      
      // Update behavior
      await supabase
        .from('volunteer_behavior')
        .update({
          success_sessions: newSuccessSessions,
          accept_count: acceptCount + 1,
          last_active: new Date().toISOString(),
        })
        .eq('volunteer_id', volunteerId);
    } catch (error) {
      console.error('Error updating volunteer metrics:', error);
    }
  };

  return {
    localStream,
    remoteStream,
    isCallActive,
    startCall,
    endCall
  };
};

