import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraFeed } from '../../components/CameraFeed';
import { AIButton } from '../../components/AIButton';
import { StateIndicator } from '../../components/StateIndicator';
import { AudioLevelBar } from '../../components/AudioLevelBar';
import { useAIState } from '../../context/AIStateContext';
import { useAuth } from '../../context/AuthContext';
import { analyzeCameraFrame, isLowConfidence, CONFIDENCE_THRESHOLD } from '../../utils/MoondreamAPI';
import { textToSpeech, playTTS, closeRealtimeTTS } from '../../utils/ElevenLabsAudio';
import { 
  createHelpRequest, 
  logAIInteraction,
  selectBestVolunteer,
  RankedVolunteer,
  setupWebRTCConnection,
  supabase
} from '../../utils/SupabaseClient';

/**
 * Full-screen live mode screen for users.
 * Implements complete state machine: Idle → Listening → Processing → Speaking → LowConfidence → Request Human Help.
 */
const VOLUNTEER_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;

export function LiveMode() {
  const { user } = useAuth();
  const { state, dispatch } = useAIState();
  const [audioLevel, setAudioLevel] = useState(0);
  const [lastFrameUri, setLastFrameUri] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isRequestingHelp, setIsRequestingHelp] = useState(false);
  const [helpRequestStatus, setHelpRequestStatus] = useState<string>('');
  const [rankedVolunteers, setRankedVolunteers] = useState<RankedVolunteer[]>([]);
  const declinedVolunteersRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      closeRealtimeTTS();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Handles AI button press - starts listening state.
   */
  const handleAIButtonPress = useCallback(async () => {
    if (state !== 'idle') return;

    dispatch({ type: 'SET_LISTENING' });
  }, [state, dispatch]);

  /**
   * Handles frame capture during listening or processing state.
   */
  const handleFrameCapture = useCallback(
    async (uri: string) => {
      setLastFrameUri(uri);

      if (state === 'listening') {
        dispatch({ type: 'SET_PROCESSING' });

        const result = await analyzeCameraFrame(uri);
        setConfidence(result.confidence);

        if (isLowConfidence(result.confidence, CONFIDENCE_THRESHOLD)) {
          dispatch({ type: 'SET_LOW_CONFIDENCE' });

          if (user) {
            showLowConfidenceDialog(result.confidence, uri, result.description);
          }
        } else {
          dispatch({ type: 'SET_SPEAKING' });

          await playTTS(result.description);

          if (user) {
            await logAIInteraction(user.id, uri, result.description, result.confidence);
          }

          setTimeout(() => {
            dispatch({ type: 'SET_IDLE' });
            setLastFrameUri(null);
            setConfidence(null);
          }, 3000);
        }
      }
    },
    [state, user, dispatch]
  );

  /**
   * Shows confirmation dialog for low confidence help request.
   *
   * @param confidence - The confidence score.
   * @param query - The user query/image URI.
   * @param description - The AI description.
   */
  const showLowConfidenceDialog = useCallback(
    (confidence: number, query: string, description: string) => {
      Alert.alert(
        'Request Human Help?',
        'The AI has low confidence in its analysis. Would you like to request help from a volunteer?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              dispatch({ type: 'SET_IDLE' });
              setLastFrameUri(null);
              setConfidence(null);
            },
          },
          {
            text: 'Request Help',
            onPress: () => {
              handleLowConfidence(confidence, query, description);
            },
          },
        ]
      );
    },
    [dispatch, handleLowConfidence]
  );

  /**
   * Handles low confidence scenario - requests human help with retry logic.
   *
   * @param confidence - The confidence score.
   * @param query - The user query/image URI.
   * @param description - The AI description.
   */
  const handleLowConfidence = useCallback(
    async (confidence: number, query: string, description: string) => {
      if (!user || isRequestingHelp) return;

      setIsRequestingHelp(true);
      setHelpRequestStatus('Finding volunteer...');
      declinedVolunteersRef.current.clear();

      try {
        const ranked = await selectBestVolunteer({
          userId: user.id,
          confidence,
        });

        if (ranked.length === 0) {
          Alert.alert(
            'No Volunteers Available',
            'No volunteers are currently available. Please try again later.',
            [
              {
                text: 'OK',
                onPress: () => {
                  dispatch({ type: 'SET_IDLE' });
                  setIsRequestingHelp(false);
                  setHelpRequestStatus('');
                },
              },
            ]
          );
          return;
        }

        setRankedVolunteers(ranked);
        await tryVolunteerChain(ranked, confidence, query, description);
      } catch (error) {
        console.error('Error requesting help:', error);
        Alert.alert('Error', 'An error occurred while requesting help.');
        dispatch({ type: 'SET_IDLE' });
        setIsRequestingHelp(false);
        setHelpRequestStatus('');
      }
    },
    [user, isRequestingHelp, dispatch]
  );

  /**
   * Tries volunteers in order with timeout and retry logic.
   *
   * @param volunteers - Ranked list of volunteers.
   * @param confidence - The confidence score.
   * @param query - The user query/image URI.
   * @param description - The AI description.
   */
  const tryVolunteerChain = useCallback(
    async (
      volunteers: RankedVolunteer[],
      confidence: number,
      query: string,
      description: string
    ) => {
      const availableVolunteers = volunteers.filter(
        (v) => !declinedVolunteersRef.current.has(v.volunteerId)
      );

      if (availableVolunteers.length === 0) {
        Alert.alert(
          'No Volunteers Available',
          'All volunteers declined or timed out. Please try again later.',
          [
            {
              text: 'OK',
              onPress: () => {
                dispatch({ type: 'SET_IDLE' });
                setIsRequestingHelp(false);
                setHelpRequestStatus('');
              },
            },
          ]
        );
        return;
      }

      const volunteer = availableVolunteers[0];
      setHelpRequestStatus(`Waiting for volunteer... (${volunteer.volunteerId.substring(0, 8)})`);

      const requestId = await createHelpRequest(user!.id, volunteer.volunteerId, confidence);
      
      if (!requestId) {
        declinedVolunteersRef.current.add(volunteer.volunteerId);
        if (availableVolunteers.length > 1) {
          await tryVolunteerChain(volunteers, confidence, query, description);
        } else {
          Alert.alert('Error', 'Failed to request help. Please try again.');
          dispatch({ type: 'SET_IDLE' });
          setIsRequestingHelp(false);
          setHelpRequestStatus('');
        }
        return;
      }

      setSessionId(requestId);
      await logAIInteraction(user!.id, query, description, confidence);

      timeoutRef.current = setTimeout(async () => {
        const { data } = await supabase
          .from('help_requests')
          .select('status')
          .eq('id', requestId)
          .single();

        if (data?.status !== 'accepted') {
          declinedVolunteersRef.current.add(volunteer.volunteerId);
          
          if (availableVolunteers.length > 1) {
            await tryVolunteerChain(volunteers, confidence, query, description);
          } else {
            Alert.alert(
              'No Response',
              'The volunteer did not respond. Please try again later.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    dispatch({ type: 'SET_IDLE' });
                    setIsRequestingHelp(false);
                    setHelpRequestStatus('');
                  },
                },
              ]
            );
          }
        }
      }, VOLUNTEER_TIMEOUT_MS);

      const unsubscribe = supabase
        .channel(`help-request-${requestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'help_requests',
            filter: `id=eq.${requestId}`,
          },
          async (payload) => {
            if (payload.new.status === 'accepted') {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              unsubscribe.unsubscribe();

              setHelpRequestStatus('Connecting to volunteer...');
              
              const connection = await setupWebRTCConnection(requestId, true);
              if (connection) {
                setHelpRequestStatus('Connected');
              } else {
                setHelpRequestStatus('Connection failed');
              }
            } else if (payload.new.status === 'declined') {
              declinedVolunteersRef.current.add(volunteer.volunteerId);
              
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              unsubscribe.unsubscribe();

              if (availableVolunteers.length > 1) {
                await tryVolunteerChain(volunteers, confidence, query, description);
              } else {
                Alert.alert(
                  'Request Declined',
                  'The volunteer declined. Please try again later.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        dispatch({ type: 'SET_IDLE' });
                        setIsRequestingHelp(false);
                        setHelpRequestStatus('');
                      },
                    },
                  ]
                );
              }
            }
          }
        )
        .subscribe();
    },
    [user, dispatch]
  );

  /**
   * Handles ending the session.
   */
  const handleEndSession = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    dispatch({ type: 'END_SESSION' });
    setSessionId(null);
    setLastFrameUri(null);
    setConfidence(null);
    setIsRequestingHelp(false);
    setHelpRequestStatus('');
    declinedVolunteersRef.current.clear();
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.cameraContainer}>
        <CameraFeed
          onFrameCapture={handleFrameCapture}
          autoCapture={state === 'listening' || state === 'processing'}
          captureInterval={2000}
        />
        <StateIndicator />
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.buttonContainer}>
          <AIButton onPress={handleAIButtonPress} disabled={state !== 'idle'} />
        </View>

        {state === 'listening' && (
          <View style={styles.audioContainer}>
            <AudioLevelBar level={audioLevel} />
            <Text style={styles.audioText}>Listening...</Text>
          </View>
        )}

        {state === 'processing' && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#FF9500" />
            <Text style={styles.processingText}>Processing image...</Text>
          </View>
        )}

        {confidence !== null && (
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceText}>
              Confidence: {(confidence * 100).toFixed(0)}%
            </Text>
          </View>
        )}

        {isRequestingHelp && (
          <View style={styles.sessionContainer}>
            <ActivityIndicator size="small" color="#FF3B30" style={styles.spinner} />
            <Text style={styles.sessionText}>{helpRequestStatus || 'Requesting help...'}</Text>
            <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
              <Text style={styles.endButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {sessionId && !isRequestingHelp && (
          <View style={styles.sessionContainer}>
            <Text style={styles.sessionText}>Connected to volunteer</Text>
            <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
              <Text style={styles.endButtonText}>End Call</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 40,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  audioContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  audioText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  processingContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  processingText: {
    color: '#FF9500',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  spinner: {
    marginRight: 10,
  },
  confidenceContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  sessionContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  sessionText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  endButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
