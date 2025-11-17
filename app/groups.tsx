import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * Groups screen component for managing friends and family groups.
 */
export default function GroupsScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  /**
   * Fetches user's groups from the database.
   */
  const fetchGroups = async () => {
    // Placeholder - groups table would need to be created
    // For now, show a welcome message
  };

  /**
   * Creates a new group.
   */
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    // Placeholder - would create group in database
    Alert.alert('Success', `Group "${groupName}" created!`, [
      {
        text: 'OK',
        onPress: () => {
          setShowCreateForm(false);
          setGroupName('');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Groups</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Welcome to Imboni Groups</Text>
            <Text style={styles.emptyStateText}>
              With Imboni Groups you can create and manage personalized groups to provide visual
              descriptions.
            </Text>
            <Text style={styles.emptyStateText}>
              The group members can be friends or family; it doesn't matter if they are blind, have
              low vision or sighted.
            </Text>
            <Text style={styles.emptyStateText}>
              When a blind or low vision user calls the group, any available sighted group member is
              able to answer the call and provide visual description.
            </Text>
            <Text style={styles.emptyStateText}>
              To get started, let's set up your first group.
            </Text>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group) => (
              <TouchableOpacity key={group.id} style={styles.groupCard}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupMembers}>{group.members_count} members</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showCreateForm && (
          <View style={styles.createForm}>
            <Text style={styles.formLabel}>Group name</Text>
            <Text style={styles.formHint}>
              Give your group a short name that can be easily recognized by all group members.
            </Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter group name"
              placeholderTextColor="#999"
              value={groupName}
              onChangeText={setGroupName}
              autoFocus
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateForm(false);
                  setGroupName('');
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
                <Text style={styles.createButtonText}>Create group</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {!showCreateForm && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowCreateForm(true)}>
            <Text style={styles.primaryButtonText}>
              {groups.length === 0 ? 'Create your first group' : 'Create new group'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  emptyState: {
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    lineHeight: 22,
  },
  groupsList: {
    gap: 16,
  },
  groupCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  groupMembers: {
    fontSize: 14,
    color: '#999',
  },
  createForm: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  formHint: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    lineHeight: 20,
  },
  formInput: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

