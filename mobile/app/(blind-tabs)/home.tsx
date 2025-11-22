import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthProvider';
import { MatchingService } from '../../services/matching';
import { NotificationService } from '../../services/notifications';
import { HistoryService, PastVolunteer } from '../../services/history';
import { supabase } from '../../services/supabase';
import VideoCall from '../../components/VideoCall';
import RatingScreen from '../../components/RatingScreen';
import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView } from 'react-native';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'rating';

interface HelpRequest {
  id: string;
  status: string;
  assigned_volunteer: string | null;
}

export default function BlindHome() {
  const { user } = useAuth();
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [helpRequest, setHelpRequest] = useState<HelpRequest | null>(null);
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string>('');
  const [timeoutTimer, setTimeoutTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [excludedVolunteers, setExcludedVolunteers] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pastVolunteers, setPastVolunteers] = useState<PastVolunteer[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
    };
  }, [timeoutTimer]);

  const cancelRequest = async () => {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      setTimeoutTimer(null);
    }
    
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    if (helpRequest?.id) {
      try {
        await supabase
          .from('help_requests')
          .update({ status: 'cancelled' })
          .eq('id', helpRequest.id);
      } catch (error) {
        console.error('Error cancelling request:', error);
      }
    }

    setConnectionState('idle');
    setHelpRequest(null);
    setVolunteerId(null);
    setAgoraToken(null);
    setChannelName('');
    setExcludedVolunteers([]);
  };

  const findAndAssignVolunteer = async (requestId: string, excludedIds?: string[]) => {
    try {
      // Use provided excludedIds or fall back to state
      const excluded = excludedIds ?? excludedVolunteers;
      const volunteer = await MatchingService.findBestVolunteer(excluded);
      
      if (!volunteer) {
        // No volunteers available - queue the request
              Alert.alert(
          'No Volunteers Available',
          'We couldn\'t find an available volunteer right now. Your request has been queued and you\'ll be notified when a volunteer becomes available.',
          [{ text: 'OK', onPress: cancelRequest }]
        );
        return;
      }

      // Assign volunteer
      await MatchingService.assignVolunteer(requestId, volunteer.id);
      setVolunteerId(volunteer.id);

      // Send push notification to volunteer
      try {
        const { data: volunteerProfile } = await supabase
          .from('users')
          .select('notification_token, full_name')
          .eq('id', volunteer.id)
          .single();

        if (volunteerProfile?.notification_token) {
          // Send push notification to volunteer
          await NotificationService.sendPushNotificationToVolunteer(
            volunteerProfile.notification_token,
            'Help Request',
            'A user needs your help. Tap to accept or decline.',
            { requestId, volunteerId: volunteer.id, type: 'help_request' }
          );
        }
      } catch (error) {
        console.error('Error sending notification:', error);
        // Continue even if notification fails
      }

      // Set up timeout (30 seconds)
      const timer = setTimeout(() => {
        handleVolunteerTimeout(requestId, volunteer.id);
      }, 30000);
      setTimeoutTimer(timer);

      // Subscribe to real-time updates
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      subscriptionRef.current = supabase
        .channel(`help_request_${requestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'help_requests',
            filter: `id=eq.${requestId}`,
          },
          (payload) => {
            const updatedRequest = payload.new as HelpRequest;
            setHelpRequest(updatedRequest);

            if (updatedRequest.status === 'accepted') {
              if (timeoutTimer) {
                clearTimeout(timeoutTimer);
                setTimeoutTimer(null);
              }
              startVideoCall(requestId, volunteer.id);
            } else if (updatedRequest.status === 'declined') {
              if (timeoutTimer) {
                clearTimeout(timeoutTimer);
                setTimeoutTimer(null);
              }
              // Retry with next volunteer - pass updated excluded list directly to avoid stale state
              const updatedExcluded: string[] = [...excludedVolunteers, volunteer.id];
              setExcludedVolunteers(updatedExcluded);
              findAndAssignVolunteer(requestId, updatedExcluded);
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error finding volunteer:', error);
      Alert.alert('Error', 'Failed to find a volunteer. Please try again.');
      cancelRequest();
    }
  };

  const handleVolunteerTimeout = async (requestId: string, currentVolunteerId: string) => {
    // Volunteer didn't respond in time, try next one
    setExcludedVolunteers([...excludedVolunteers, currentVolunteerId]);
    
    // Unassign current volunteer
    await supabase
      .from('help_requests')
      .update({ assigned_volunteer: null })
      .eq('id', requestId);

    // Try next volunteer
    findAndAssignVolunteer(requestId);
  };

  const startVideoCall = async (requestId: string, volunteerId: string) => {
    try {
      // Generate Agora token via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-agora-token', {
        body: {
          userId: user?.id,
          volunteerId: volunteerId,
          requestId: requestId,
        },
      });

      if (error) {
        throw error;
      }

      setAgoraToken(data.token);
      setChannelName(data.channelName);
      setConnectionState('connected');

      // Update request status to in_progress
      await supabase
        .from('help_requests')
        .update({ status: 'in_progress' })
        .eq('id', requestId);

      // Create session record when call starts
      if (user?.id) {
        await supabase
          .from('sessions')
          .insert({
            help_request_id: requestId,
            user_id: user.id,
            volunteer_id: volunteerId,
            started_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      Alert.alert('Error', 'Failed to start video call. Please try again.');
      cancelRequest();
    }
  };

  const loadHistory = async () => {
    if (!user?.id) return;
    
    setLoadingHistory(true);
    try {
      const volunteers = await HistoryService.getPastVolunteers(user.id);
      setPastVolunteers(volunteers);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleShowHistory = async () => {
    setShowHistory(true);
    await loadHistory();
  };

  const handleCallVolunteer = async (specificVolunteerId?: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to request help.');
      return;
    }

    setConnectionState('connecting');
    setShowHistory(false);

    try {
      // Create help request
      const request = await MatchingService.createHelpRequest(user.id);
      setHelpRequest(request);

      if (specificVolunteerId) {
        // Call specific volunteer directly
        await callSpecificVolunteer(request.id, specificVolunteerId);
      } else {
        // Find and assign volunteer
        await findAndAssignVolunteer(request.id);
      }
    } catch (error) {
      console.error('Error creating help request:', error);
      Alert.alert('Error', 'Failed to create help request. Please try again.');
      setConnectionState('idle');
    }
  };

  const callSpecificVolunteer = async (requestId: string, volunteerId: string) => {
    try {
      // Check if volunteer is available
      const { data: volunteer, error: volunteerError } = await supabase
        .from('users')
        .select('availability, type')
        .eq('id', volunteerId)
        .single();

      if (volunteerError || !volunteer) {
        throw new Error('Volunteer not found');
      }

      if (volunteer.type !== 'volunteer') {
        throw new Error('User is not a volunteer');
      }

      if (!volunteer.availability) {
        Alert.alert(
          'Volunteer Unavailable',
          'This volunteer is currently unavailable. Would you like to find another volunteer?',
          [
            { text: 'Cancel', onPress: cancelRequest, style: 'cancel' },
            { 
              text: 'Find Another', 
              onPress: () => {
                setExcludedVolunteers([]);
                findAndAssignVolunteer(requestId);
              }
            },
          ]
        );
        return;
      }

      // Assign the specific volunteer
      await MatchingService.assignVolunteer(requestId, volunteerId);
      setVolunteerId(volunteerId);

      // Send push notification
      try {
        const { data: volunteerProfile } = await supabase
          .from('users')
          .select('notification_token')
          .eq('id', volunteerId)
          .single();

        if (volunteerProfile?.notification_token) {
          await NotificationService.sendPushNotificationToVolunteer(
            volunteerProfile.notification_token,
            'Help Request',
            'A user needs your help. Tap to accept or decline.',
            { requestId, volunteerId, type: 'help_request' }
          );
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }

      // Set up timeout
      const timer = setTimeout(() => {
        handleVolunteerTimeout(requestId, volunteerId);
      }, 30000);
      setTimeoutTimer(timer);

      // Subscribe to real-time updates
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      subscriptionRef.current = supabase
        .channel(`help_request_${requestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'help_requests',
            filter: `id=eq.${requestId}`,
          },
          (payload) => {
            const updatedRequest = payload.new as HelpRequest;
            setHelpRequest(updatedRequest);

            if (updatedRequest.status === 'accepted') {
              if (timeoutTimer) {
                clearTimeout(timeoutTimer);
                setTimeoutTimer(null);
              }
              startVideoCall(requestId, volunteerId);
            } else if (updatedRequest.status === 'declined') {
              if (timeoutTimer) {
                clearTimeout(timeoutTimer);
                setTimeoutTimer(null);
              }
              Alert.alert(
                'Volunteer Declined',
                'This volunteer declined your request. Would you like to find another volunteer?',
                [
                  { text: 'Cancel', onPress: cancelRequest, style: 'cancel' },
                  { 
                    text: 'Find Another', 
                    onPress: () => {
                      setExcludedVolunteers([volunteerId]);
                      findAndAssignVolunteer(requestId);
                    }
                  },
                ]
              );
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error calling specific volunteer:', error);
      Alert.alert('Error', 'Failed to call volunteer. Please try again.');
      cancelRequest();
    }
  };

  const handleEndCall = async () => {
    if (helpRequest?.id && volunteerId && user?.id) {
      try {
        // Update request status
        await supabase
          .from('help_requests')
          .update({ status: 'completed' })
          .eq('id', helpRequest.id);

        // Update session with end time and duration
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id, started_at')
          .eq('help_request_id', helpRequest.id)
          .eq('user_id', user.id)
          .eq('volunteer_id', volunteerId)
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        if (sessions) {
          const startTime = new Date(sessions.started_at);
          const endTime = new Date();
          const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

          await supabase
            .from('sessions')
            .update({
              ended_at: endTime.toISOString(),
              duration: duration,
            })
            .eq('id', sessions.id);
           }
      } catch (error) {
        console.error('Error updating request status or session:', error);
         }
      }

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    setConnectionState('rating');
  };

  const handleRating = async (rating: number) => {
    if (helpRequest?.id && volunteerId) {
      try {
        // Save rating to session or volunteer_behavior table
        // For now, we'll update the session if it exists
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id')
          .eq('help_request_id', helpRequest.id)
          .limit(1);

        if (sessions && sessions.length > 0) {
          await supabase
            .from('sessions')
            .update({ rating })
            .eq('id', sessions[0].id);
        }
      } catch (error) {
        console.error('Error saving rating:', error);
      }
    }

    // Return to home
    setConnectionState('idle');
    setHelpRequest(null);
    setVolunteerId(null);
    setAgoraToken(null);
    setChannelName('');
    setExcludedVolunteers([]);
  };

  const handleSkipRating = () => {
    setConnectionState('idle');
    setHelpRequest(null);
    setVolunteerId(null);
    setAgoraToken(null);
    setChannelName('');
    setExcludedVolunteers([]);
  };

  const styles = createStyles(colors, dark, insets);

  // Show video call when connected
  if (connectionState === 'connected' && agoraToken && channelName) {
    return (
      <VideoCall
        channelName={channelName}
        uid={user?.id ? parseInt(user.id.slice(0, 8), 16) : 0}
        token={agoraToken}
        onEndCall={handleEndCall}
        isVolunteer={false}
      />
    );
  }

  // Show connection status screen - same layout but with "Connecting..." and Cancel button
  if (connectionState === 'connecting') {
    return (
      <View style={[styles.container, { backgroundColor: '#000000', paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.content}>
          <View style={styles.callButton}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.callButtonText}>
                Connecting...
              </Text>
            </View>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.historyButton, { justifyContent: 'center', backgroundColor: '#FF3B30', borderWidth: 0 }]}
            onPress={cancelRequest}
            accessibilityRole="button"
            accessibilityLabel="Cancel request"
          >
            <Text style={[styles.historyButtonText, { color: '#FFFFFF' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show rating screen
  if (connectionState === 'rating') {
    return (
      <RatingScreen
        onRate={handleRating}
        onSkip={handleSkipRating}
      />
    );
  }

  // Main home screen with "Call a volunteer" button
  return (
    <View style={[styles.container, { backgroundColor: '#000000', paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => handleCallVolunteer()}
          accessibilityRole="button"
          accessibilityLabel="Call a volunteer"
        >
          <Text style={styles.callButtonText}>
            Call a volunteer
          </Text>
        </TouchableOpacity>

        {/* History Button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={handleShowHistory}
          accessibilityRole="button"
          accessibilityLabel="View call history"
        >
          <Text style={styles.historyButtonText}>History</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: dark ? '#000000' : colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Call History</Text>
            <TouchableOpacity
              onPress={() => setShowHistory(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : pastVolunteers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color={colors.text} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No call history yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.text }]}>
                Your past volunteers will appear here
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.historyList} contentContainerStyle={styles.historyListContent}>
              {pastVolunteers.map((volunteer) => (
                <TouchableOpacity
                  key={volunteer.volunteer_id}
                  style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleCallVolunteer(volunteer.volunteer_id)}
                >
                  <View style={styles.historyItemContent}>
                    <View style={styles.historyItemLeft}>
                      <Ionicons name="person-circle" size={48} color={colors.primary} />
                      <View style={styles.historyItemInfo}>
                        <Text style={[styles.historyItemName, { color: colors.text }]}>
                          {volunteer.volunteer_name}
                        </Text>
                        <View style={styles.historyItemMeta}>
                          <Ionicons name="star" size={16} color="#FFD700" />
                          <Text style={[styles.historyItemRating, { color: colors.text }]}>
                            {volunteer.volunteer_rating.toFixed(1)}
                          </Text>
                          <Text style={[styles.historyItemCalls, { color: colors.text }]}>
                            • {volunteer.total_calls} {volunteer.total_calls === 1 ? 'call' : 'calls'}
                          </Text>
                        </View>
                        <Text style={[styles.historyItemDate, { color: colors.text }]}>
                          Last call: {new Date(volunteer.last_call_date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} style={{ opacity: 0.5 }} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: any, dark: boolean, insets: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    content: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    callButton: {
      backgroundColor: '#0057FF',
      borderRadius: 28,
      width: '100%',
      height: '77%',
      minHeight: 400,
      alignItems: 'center',
      justifyContent: 'center',
    },
    callButtonText: {
      color: '#FFFFFF',
      fontSize: 36,
      fontWeight: '600',
      textAlign: 'center',
    },
    connectionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    connectionText: {
      fontSize: 18,
      fontWeight: '500',
      marginTop: 20,
      textAlign: 'center',
    },
    subText: {
      fontSize: 14,
      marginTop: 10,
      textAlign: 'center',
      opacity: 0.7,
    },
    cancelButton: {
      marginTop: 40,
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 12,
      borderWidth: 1,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    historyButton: {
      marginTop: 32,
      height: 64,
      paddingHorizontal: 24,
      borderRadius: 20,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    historyButtonText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '500',
    },
    modalContainer: {
      flex: 1,
      paddingTop: insets.top + 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
      fontSize: 28,
      fontWeight: 'bold',
    },
    closeButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '600',
      marginTop: 20,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 16,
      marginTop: 8,
      textAlign: 'center',
      opacity: 0.7,
    },
    historyList: {
      flex: 1,
    },
    historyListContent: {
      padding: 20,
    },
    historyItem: {
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
      padding: 16,
    },
    historyItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    historyItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    historyItemInfo: {
      marginLeft: 16,
      flex: 1,
    },
    historyItemName: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 4,
    },
    historyItemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 4,
    },
    historyItemRating: {
      fontSize: 14,
      marginLeft: 4,
    },
    historyItemCalls: {
      fontSize: 14,
      opacity: 0.7,
    },
    historyItemDate: {
      fontSize: 12,
      opacity: 0.6,
    },
  });
}
