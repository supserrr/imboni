import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHelpRequest } from '@/hooks/use-help-request';
import VolunteerModal from '@/components/volunteer/VolunteerModal';
import CallInterface from '@/components/volunteer/CallInterface';
import { useAppStore } from '@/store/app-store';
import { updateUserStatus } from '@/api/users';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';

export default function VolunteerHome() {
  const { user } = useAppStore();
  const { incomingRequest, acceptRequest, declineRequest } = useHelpRequest();
  const [showModal, setShowModal] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
      if (incomingRequest && incomingRequest.status === 'pending') {
          setShowModal(true);
      }
  }, [incomingRequest]);

  useEffect(() => {
      // Load initial availability status
      if (user) {
          // Fetch user's current availability
          fetchAvailability();
      }
  }, [user]);

  const fetchAvailability = async () => {
      if (!user) return;
      try {
          const { data } = await updateUserStatus(user.id, isOnline);
          if (data && data.length > 0) {
              setIsOnline(data[0].availability || false);
          }
      } catch (error) {
          console.error('Error fetching availability:', error);
      }
  };

  const handleToggleAvailability = async (value: boolean) => {
      if (!user || isUpdating) return;
      
      setIsUpdating(true);
      try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await updateUserStatus(user.id, value);
          setIsOnline(value);
      } catch (error) {
          console.error('Error updating availability:', error);
      } finally {
          setIsUpdating(false);
      }
  };

  const handleAccept = async () => {
      if (!incomingRequest) return;
      await acceptRequest(incomingRequest.id);
      setShowModal(false);
      setActiveCallId(incomingRequest.id);
  };

  const handleDecline = async () => {
      if (!incomingRequest) return;
      await declineRequest(incomingRequest.id);
      setShowModal(false);
  };

  const handleEndCall = () => {
      setActiveCallId(null);
  };

  if (activeCallId && incomingRequest) {
      return <CallInterface sessionId={activeCallId} onEndCall={handleEndCall} helpRequestId={incomingRequest.id} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>Dashboard</ThemedText>
      
      <ScrollView contentContainerStyle={styles.content}>
          <ThemedView style={styles.card}>
                <View style={styles.statusRow}>
                    <View style={styles.statusInfo}>
                        <IconSymbol 
                            name={isOnline ? "circle.fill" : "circle"} 
                            size={16} 
                            color={isOnline ? "#bf6f4a" : "#141414"} 
                        />
                        <ThemedText type="subtitle" style={styles.statusText}>
                            Status: {isOnline ? 'Online' : 'Offline'}
                        </ThemedText>
                    </View>
                    <Switch
                        value={isOnline}
                        onValueChange={handleToggleAvailability}
                        disabled={isUpdating}
                        trackColor={{ false: '#141414', true: '#bf6f4a' }}
                        thumbColor="#FFFFFF"
                    />
                </View>
                
                {isOnline ? (
                    <ThemedText style={styles.waitingText}>Waiting for help requests...</ThemedText>
                ) : (
                    <ThemedText style={styles.offlineText}>
                        Turn on availability to receive help requests
                    </ThemedText>
                )}
          </ThemedView>
          
          {/* Additional statistics or history could go here */}
      </ScrollView>

      <VolunteerModal 
        visible={showModal} 
        onAccept={handleAccept} 
        onDecline={handleDecline} 
      />
    </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
      paddingHorizontal: 20,
  },
  content: {
      padding: 20,
  },
  card: {
      padding: 20,
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: 10,
  },
  statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  statusInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  statusText: {
      marginLeft: 4,
  },
  waitingText: {
      marginTop: 8,
      opacity: 0.7,
  },
  offlineText: {
      marginTop: 8,
      opacity: 0.5,
      fontStyle: 'italic',
  },
});

