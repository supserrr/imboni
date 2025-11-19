import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useState, useCallback, useEffect, useRef } from 'react';
import { synthesizeSpeech } from '@/lib/bentoml-api';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);
  const pendingPlayRef = useRef(false);

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

  const speak = useCallback(async (text: string) => {
    try {
      // Stop any current playback
      if (player.playing) {
        player.pause();
      }

      const base64Audio = await synthesizeSpeech(text);
      
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
  }, [player]);

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

