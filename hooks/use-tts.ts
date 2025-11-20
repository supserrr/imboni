import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useState, useCallback, useEffect, useRef } from 'react';
import { synthesizeSpeech } from '@/lib/bentoml-api';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/app-store';

export const useTTS = () => {
  const { user } = useAppStore();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<{
    language: string;
    speaker: string;
    speed: number;
  }>({
    language: 'EN',
    speaker: 'EN-Default',
    speed: 1.0,
  });
  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);
  const pendingPlayRef = useRef(false);

  // Load user preferences
  useEffect(() => {
    if (!user) return;

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('preferred_language, preferred_speaker, preferred_speed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading preferences:', error);
          return;
        }

        if (data) {
          setPreferences({
            language: data.preferred_language || 'EN',
            speaker: data.preferred_speaker || 'EN-Default',
            speed: data.preferred_speed || 1.0,
          });
        }
      } catch (error) {
        console.error('Error in loadPreferences:', error);
      }
    };

    loadPreferences();
  }, [user]);

  // Handle playback status changes
  useEffect(() => {
    if (status.isLoaded && status.isPlaying) {
      setIsSpeaking(true);
      pendingPlayRef.current = false;
    }
    if (status.isLoaded && !status.isPlaying && isSpeaking) {
      // Playback finished
      setIsSpeaking(false);
      setAudioSource(null);
    }
  }, [status.isLoaded, status.isPlaying, isSpeaking]);

  // Auto-play when source is loaded and ready
  useEffect(() => {
    if (audioSource && player.isLoaded && !player.playing && pendingPlayRef.current) {
      player.play();
      pendingPlayRef.current = false;
    }
  }, [audioSource, player.isLoaded, player.playing, player]);

  const speak = useCallback(async (text: string, overrides?: { language?: string; speaker?: string; speed?: number }) => {
    try {
      // Stop any current playback
      if (player.playing) {
        player.pause();
      }

      // Use overrides if provided, otherwise use stored preferences
      const language = overrides?.language || preferences.language;
      const speaker = overrides?.speaker || preferences.speaker;
      const speed = overrides?.speed || preferences.speed;

      const base64Audio = await synthesizeSpeech(text, language, speaker, speed);
      
      // Create audio source from base64
      const uri = `data:audio/wav;base64,${base64Audio}`;
      pendingPlayRef.current = true;
      setAudioSource(uri);
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      setAudioSource(null);
      pendingPlayRef.current = false;
    }
  }, [player, preferences]);

  const stop = useCallback(() => {
    if (player.playing) {
      player.pause();
    }
    setIsSpeaking(false);
    setAudioSource(null);
    pendingPlayRef.current = false;
  }, [player]);

  return {
    speak,
    stop,
    isSpeaking,
  };
};

