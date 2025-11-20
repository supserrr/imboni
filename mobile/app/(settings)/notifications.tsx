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
  const [sessionUpdates, setSessionUpdates] = useState(true);
  const [aiAlerts, setAiAlerts] = useState(true);
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

  const handleToggleSessionUpdates = (value: boolean) => {
    setSessionUpdates(value);
    // Save to database or local storage
  };

  const handleToggleAiAlerts = (value: boolean) => {
    setAiAlerts(value);
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

  const rowBackgroundColor = dark ? colors.card : colors.text;
  const textColor = dark ? colors.text : colors.background;
  const subtitleColor = dark ? '#999' : 'rgba(232, 212, 232, 0.7)';
  const borderColor = dark ? '#3A3A3C' : 'rgba(232, 212, 232, 0.2)';
  const switchTrackColorFalse = dark ? '#3A3A3C' : 'rgba(232, 212, 232, 0.5)';
  const switchTrackColorTrue = dark ? colors.primary : colors.background;
  const switchThumbColorOff = dark ? '#f4f3f4' : colors.background;
  const switchThumbColorOn = dark ? '#fff' : colors.text;

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
              thumbColor={notificationsEnabled ? switchThumbColorOn : switchThumbColorOff}
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
                    thumbColor={helpRequests ? switchThumbColorOn : switchThumbColorOff}
                  />
                </View>
              )}

              <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: textColor }]}>Session Updates</Text>
                  <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>
                    {userType === 'volunteer' 
                      ? 'Updates about your active sessions'
                      : 'Updates when connected to helpers'}
                  </Text>
                </View>
                <Switch
                  value={sessionUpdates}
                  onValueChange={handleToggleSessionUpdates}
                  trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
                  thumbColor={sessionUpdates ? switchThumbColorOn : switchThumbColorOff}
                />
              </View>

              {/* AI Alerts - Only for blind users */}
              {userType === 'blind' && (
                <View style={[styles.row, { backgroundColor: rowBackgroundColor, borderBottomColor: borderColor }]}>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowTitle, { color: textColor }]}>AI Alerts</Text>
                    <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>Low confidence warnings</Text>
                  </View>
                  <Switch
                    value={aiAlerts}
                    onValueChange={handleToggleAiAlerts}
                    trackColor={{ false: switchTrackColorFalse, true: switchTrackColorTrue }}
                    thumbColor={aiAlerts ? switchThumbColorOn : switchThumbColorOff}
                  />
                </View>
              )}
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
                  thumbColor={soundEnabled ? switchThumbColorOn : switchThumbColorOff}
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
                  thumbColor={vibrationEnabled ? switchThumbColorOn : switchThumbColorOff}
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

