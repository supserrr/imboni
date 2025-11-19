import { Audio } from 'expo-av';
import { useState, useCallback } from 'react';
import { synthesizeSpeech } from '@/lib/bentoml-api';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Stop any current playback
      if (sound) {
        await sound.unloadAsync();
      }

      const base64Audio = await synthesizeSpeech(text);
      
      // Create a sound object from base64
      // Expo AV doesn't support base64 directly in some versions, need to write to file or use uri with data scheme if supported
      // For cross-platform, writing to cache is safer, but data URI works on many new versions.
      // Let's try data URI first.
      const uri = `data:audio/wav;base64,${base64Audio}`;
      
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      
      await newSound.playAsync();
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsSpeaking(false);
        }
      });
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  }, [sound]);

  const stop = useCallback(async () => {
    if (sound) {
      await sound.stopAsync();
      setIsSpeaking(false);
    }
  }, [sound]);

  return {
    speak,
    stop,
    isSpeaking,
  };
};

