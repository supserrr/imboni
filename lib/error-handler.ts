import { Alert } from 'react-native';
import { synthesizeSpeech } from './bentoml-api'; // Avoid circular dep with hooks if possible, direct api call okay
import { Audio } from 'expo-av';

export const handleError = async (error: any, userFriendlyMessage: string) => {
  console.error(error);
  
  // 1. Show visual alert
  Alert.alert('Error', userFriendlyMessage);

  // 2. TTS Feedback
  try {
      // Quick fire and forget TTS for error
      // Note: Ideally use the central TTS hook, but for global error handler 
      // we might need a direct utility or access the store/manager.
      // For simplicity, simple console log for now as handling audio playback outside hook is complex without manager.
      console.log(`TTS Error Announcement: ${userFriendlyMessage}`);
  } catch (e) {
      console.error('Failed to announce error', e);
  }
};

