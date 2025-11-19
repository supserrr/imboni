import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHelpRequest } from '@/hooks/use-help-request';
import VolunteerModal from '@/components/volunteer/VolunteerModal';
import CallInterface from '@/components/volunteer/CallInterface';

export default function VolunteerHome() {
  const { incomingRequest, acceptRequest, declineRequest } = useHelpRequest();
  const [showModal, setShowModal] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  useEffect(() => {
      if (incomingRequest && incomingRequest.status === 'pending') {
          setShowModal(true);
      }
  }, [incomingRequest]);

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

  if (activeCallId) {
      return <CallInterface sessionId={activeCallId} onEndCall={handleEndCall} />;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>Dashboard</ThemedText>
      
      <ScrollView contentContainerStyle={styles.content}>
          <ThemedView style={styles.card}>
              <ThemedText type="subtitle">Status: Online</ThemedText>
              <ThemedText>Waiting for help requests...</ThemedText>
          </ThemedView>
          
          {/* Additional statistics or history could go here */}
      </ScrollView>

      <VolunteerModal 
        visible={showModal} 
        onAccept={handleAccept} 
        onDecline={handleDecline} 
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
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
  }
});

