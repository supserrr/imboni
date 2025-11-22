import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  /**
   * Request notification permissions and get push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Ask for permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return null;
      }

      // Get the push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      });

      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  /**
   * Save notification token to database
   */
  async saveNotificationToken(userId: string, token: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ notification_token: token })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      console.log('Notification token saved successfully');
    } catch (error) {
      console.error('Error saving notification token:', error);
      throw error;
    }
  },

  /**
   * Register for notifications and save token
   */
  async initializeNotifications(userId: string) {
    try {
      const token = await this.registerForPushNotifications();
      
      if (token) {
        await this.saveNotificationToken(userId, token);
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  },

  /**
   * Schedule a local notification
   */
  async scheduleNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // null means immediate
    });
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Send push notification to a volunteer
   * This should be called via a Supabase Edge Function in production
   */
  async sendPushNotificationToVolunteer(
    volunteerToken: string,
    title: string,
    body: string,
    data?: any
  ) {
    try {
      // In production, this would call a Supabase Edge Function
      // For now, we'll use the Expo Push API directly
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: volunteerToken,
          sound: 'default',
          title,
          body,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send push notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  },
};

