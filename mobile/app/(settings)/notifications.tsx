import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../services/supabase';
import { useTheme } from '@react-navigation/native';

export default function NotificationSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, dark } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [helpRequests, setHelpRequests] = useState(true);
  const [volunteerResponses, setVolunteerResponses] = useState(true);
  const [callStatusUpdates, setCallStatusUpdates] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [userType, setUserType] = useState<'blind' | 'volunteer'>('blind');

  useEffect(() => {
    checkNotificationPermissions();
    loadUserType();
  }, []);

  const loadUserType = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('type')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUserType(data.type);
      }
    } catch (error) {
      console.error('Error loading user type:', error);
    }
  };

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotificationsEnabled(true);
        Alert.alert('Success', 'Notifications enabled');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings');
      }
    } else {
      setNotificationsEnabled(false);
      Alert.alert(
        'Disable Notifications',
        'To disable notifications, please go to your device settings'
      );
    }
  };

  const handleToggleHelpRequests = (value: boolean) => {
    setHelpRequests(value);
    // Save to database or local storage
  };

  const handleToggleVolunteerResponses = (value: boolean) => {
    setVolunteerResponses(value);
    // Save to database or local storage
  };

  const handleToggleCallStatusUpdates = (value: boolean) => {
    setCallStatusUpdates(value);
    // Save to database or local storage
  };

  const handleToggleSessionReminders = (value: boolean) => {
    setSessionReminders(value);
    // Save to database or local storage
  };

  const handleToggleSound = (value: boolean) => {
    setSoundEnabled(value);
    // Save to database or local storage
  };

  const handleToggleVibration = (value: boolean) => {
    setVibrationEnabled(value);
    // Save to database or local storage
  };

  const rowBackgroundColor = colors.text;
  const textColor = colors.background;
  const subtitleColor = dark ? 'rgba(92, 58, 58, 0.7)' : 'rgba(232, 212, 232, 0.7)';
  const borderColor = dark ? 'rgba(92, 58, 58, 0.2)' : 'rgba(232, 212, 232, 0.2)';
  const switchTrackColorFalse = '#000000';
  const switchTrackColorTrue = colors.background;
  const switchThumbColor = '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Enable Notifications</Text>
              <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>Allow Imboni to send notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
              thumbColor={switchThumbColor}
              ios_backgroundColor={switchTrackColorFalse}
            />
          </View>
        </View>

        {notificationsEnabled && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notification Types</Text>
            </View>
            <View style={styles.section}>
              {/* Help Requests - Only for volunteers */}
              {userType === 'volunteer' && (
                <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowTitle, { color: textColor }]}>Help Requests</Text>
                    <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>Get notified when someone needs help</Text>
                  </View>
                  <Switch
                    value={helpRequests}
                    onValueChange={handleToggleHelpRequests}
                    trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
                    thumbColor={switchThumbColor}
                    ios_backgroundColor={switchTrackColorFalse}
                  />
                </View>
              )}

              {/* Volunteer Responses - Only for blind users */}
              {userType === 'blind' && (
                <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowTitle, { color: textColor }]}>Volunteer Responses</Text>
                    <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>When a volunteer accepts or declines your request</Text>
                  </View>
                  <Switch
                    value={volunteerResponses}
                    onValueChange={handleToggleVolunteerResponses}
                    trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
                    thumbColor={switchThumbColor}
                    ios_backgroundColor={switchTrackColorFalse}
                  />
                </View>
              )}

              <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: textColor }]}>Call Status Updates</Text>
                  <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>
                    {userType === 'volunteer' 
                      ? 'Updates about active calls and sessions'
                      : 'Updates when your call connects or disconnects'}
                  </Text>
                </View>
                <Switch
                  value={callStatusUpdates}
                  onValueChange={handleToggleCallStatusUpdates}
                  trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
                  thumbColor={switchThumbColor}
                  ios_backgroundColor={switchTrackColorFalse}
                />
              </View>

              <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: textColor }]}>Session Reminders</Text>
                  <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>
                    {userType === 'volunteer' 
                      ? 'Reminders about upcoming or active sessions'
                      : 'Reminders about your call history and past volunteers'}
                  </Text>
                </View>
                <Switch
                  value={sessionReminders}
                  onValueChange={handleToggleSessionReminders}
                  trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
                  thumbColor={switchThumbColor}
                  ios_backgroundColor={switchTrackColorFalse}
                />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Alert Style</Text>
            </View>
            <View style={styles.section}>
              <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: textColor }]}>Sound</Text>
                  <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>Play sound for notifications</Text>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={handleToggleSound}
                  trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
                  thumbColor={switchThumbColor}
                  ios_backgroundColor={switchTrackColorFalse}
                />
              </View>

              <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: textColor }]}>Vibration</Text>
                  <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>Vibrate for notifications</Text>
                </View>
                <Switch
                  value={vibrationEnabled}
                  onValueChange={handleToggleVibration}
                  trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
                  thumbColor={switchThumbColor}
                  ios_backgroundColor={switchTrackColorFalse}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginLeft: 5,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
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
    borderBottomWidth: 0.5,
  },
  rowContent: {
    flex: 1,
    marginRight: 16,
  },
  rowTitle: {
    fontSize: 17,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 15,
  },
});
