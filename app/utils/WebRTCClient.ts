import { supabase } from './SupabaseClient';

/**
 * WebRTC client for real-time video and audio streaming between users and volunteers.
 */

export interface WebRTCConnection {
  peerConnection: RTCPeerConnection;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

/**
 * Creates a WebRTC peer connection with configuration.
 *
 * @returns RTCPeerConnection instance.
 */
function createPeerConnection(): RTCPeerConnection {
  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  return new RTCPeerConnection(configuration);
}

/**
 * Sets up a WebRTC connection for video call.
 *
 * @param sessionId - The session ID for the call.
 * @param isInitiator - Whether this client is initiating the call.
 * @returns Promise resolving to WebRTC connection.
 */
export async function setupWebRTCConnection(
  sessionId: string,
  isInitiator: boolean
): Promise<WebRTCConnection | null> {
  try {
    const peerConnection = createPeerConnection();
    let localStream: MediaStream | null = null;
    let remoteStream: MediaStream | null = null;

    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream!);
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }

    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
    };

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await supabase
          .from('webrtc_signals')
          .insert({
            session_id: sessionId,
            from_initiator: isInitiator,
            candidate: event.candidate,
            created_at: new Date().toISOString(),
          });
      }
    };

    if (isInitiator) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      await supabase.from('webrtc_signals').insert({
        session_id: sessionId,
        from_initiator: true,
        offer: offer,
        created_at: new Date().toISOString(),
      });
    }

    const channel = supabase
      .channel(`webrtc-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signals',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const signal = payload.new;

          if (signal.from_initiator !== isInitiator) {
            if (signal.offer && !isInitiator) {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.offer));
              const answer = await peerConnection.createAnswer();
              await peerConnection.setLocalDescription(answer);

              await supabase.from('webrtc_signals').insert({
                session_id: sessionId,
                from_initiator: false,
                answer: answer,
                created_at: new Date().toISOString(),
              });
            } else if (signal.answer && isInitiator) {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.answer));
            } else if (signal.candidate) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
          }
        }
      )
      .subscribe();

    return {
      peerConnection,
      localStream,
      remoteStream,
    };
  } catch (error) {
    console.error('Error setting up WebRTC connection:', error);
    return null;
  }
}

/**
 * Closes a WebRTC connection.
 *
 * @param connection - The WebRTC connection to close.
 */
export async function closeWebRTCConnection(
  connection: WebRTCConnection
): Promise<void> {
  try {
    if (connection.localStream) {
      connection.localStream.getTracks().forEach((track) => track.stop());
    }

    connection.peerConnection.close();

    await supabase.removeChannel(`webrtc-${connection.peerConnection.localDescription?.type}`);
  } catch (error) {
    console.error('Error closing WebRTC connection:', error);
  }
}

