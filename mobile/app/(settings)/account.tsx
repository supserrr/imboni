import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../services/supabase';

interface SettingsRowProps {
  title: string;
  value?: string;
  onPress: () => void;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ title, value, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
    <View style={styles.rowContent}>
      <Text style={styles.rowTitle}>{title}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>
);

export default function AccountSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPersonalDetails = () => {
    Alert.prompt(
      'Full Name',
      'Enter your full name',
      async (text) => {
        if (text && user?.id) {
          const { error } = await supabase
            .from('users')
            .update({ full_name: text })
            .eq('id', user.id);

          if (error) {
            Alert.alert('Error', 'Failed to update name');
          } else {
            loadUserData();
            Alert.alert('Success', 'Name updated successfully');
          }
        }
      },
      'plain-text',
      userData?.full_name || ''
    );
  };

  const handleChangeEmail = () => {
    Alert.alert(
      'Change Email',
      'To change your email, please contact support at support@imboni.app',
      [{ text: 'OK' }]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password reset link will be sent to your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '');
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Success', 'Password reset link sent to your email');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete all your data. Type DELETE to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Delete user data from public.users
                      await supabase.from('users').delete().eq('id', user?.id);
                      
                      // Sign out
                      await supabase.auth.signOut();
                      
                      Alert.alert('Account Deleted', 'Your account has been deleted.');
                      router.replace('/');
                    } catch (error: any) {
                      Alert.alert('Error', error.message);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Account</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <SettingsRow
            title="Personal details"
            value={userData?.full_name || user?.email?.split('@')[0] || 'Edit'}
            onPress={handleEditPersonalDetails}
          />
          <SettingsRow title="Change email" value={user?.email || ''} onPress={handleChangeEmail} />
          <SettingsRow title="Password" value="••••••••" onPress={handleChangePassword} />
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>User ID: {user?.id}</Text>
          <Text style={styles.infoText}>Account Type: {userData?.type || 'blind'}</Text>
          <Text style={styles.infoText}>
            Created: {new Date(user?.created_at || '').toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
    marginLeft: 5,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 0.5,
    borderBottomColor: '#3A3A3C',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    color: '#fff',
    marginBottom: 4,
  },
  rowValue: {
    fontSize: 15,
    color: '#999',
  },
  deleteButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 17,
    color: '#FF3B30',
  },
  infoSection: {
    padding: 20,
    marginTop: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginVertical: 4,
  },
});

