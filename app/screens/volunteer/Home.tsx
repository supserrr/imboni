import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useVolunteer } from '../../context/VolunteerContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Home screen for volunteers.
 * Contains online/offline toggle and notification list for incoming help requests.
 */
export function Home() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { isOnline, helpRequests, toggleOnline, acceptRequest, declineRequest } = useVolunteer();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (helpRequests.length > 0) {
      // Navigate to VideoCall when a request is accepted
      // This will be handled by acceptRequest
    }
  }, [helpRequests]);

  /**
   * Handles toggling online status.
   */
  const handleToggleOnline = async () => {
    setLoading(true);
    await toggleOnline();
    setLoading(false);
  };

  /**
   * Handles accepting a help request.
   *
   * @param requestId - The ID of the help request.
   */
  const handleAcceptRequest = async (requestId: string) => {
    await acceptRequest(requestId);
    // Navigate to VideoCall screen
    navigation.navigate('VideoCall' as never);
  };

  /**
   * Handles declining a help request.
   *
   * @param requestId - The ID of the help request.
   */
  const handleDeclineRequest = async (requestId: string) => {
    await declineRequest(requestId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Volunteer Dashboard</Text>

        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Online Status</Text>
              <Text style={styles.settingDescription}>
                {isOnline ? 'You are available to receive help requests' : 'You are offline'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              disabled={loading}
              trackColor={{ false: '#767577', true: '#34C759' }}
              thumbColor={isOnline ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help Requests</Text>

          {helpRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isOnline
                  ? 'No incoming help requests. You will be notified when a request comes in.'
                  : 'Turn on online status to receive help requests.'}
              </Text>
            </View>
          ) : (
            helpRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestTitle}>Help Request</Text>
                  <Text style={styles.requestTime}>
                    {new Date(request.timestamp).toLocaleTimeString()}
                  </Text>
                </View>

                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.acceptButton]}
                    onPress={() => handleAcceptRequest(request.id)}
                  >
                    <Text style={styles.requestButtonText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.requestButton, styles.declineButton]}
                    onPress={() => handleDeclineRequest(request.id)}
                  >
                    <Text style={styles.requestButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  requestTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  requestButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

