import React, { createContext, useContext } from 'react';

/**
 * Audio context interface - simplified to rely on OS accessibility.
 * All narration is handled by the OS screen reader (VoiceOver/TalkBack).
 */
interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  playText: (text: string, language?: any, interrupt?: boolean) => Promise<void>;
  stop: () => Promise<void>;
  toggleMute: () => void;
  clearQueue: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

/**
 * Audio provider component - no-op implementation.
 * Relies on OS accessibility features (VoiceOver/TalkBack) for narration.
 *
 * @param children - Child components
 * @returns AudioContext provider
 */
export function AudioProvider({ children }: { children: React.ReactNode }) {
  // No-op functions - OS accessibility handles all narration
  const playText = async () => {
    // Do nothing - OS screen reader will handle announcements via accessibility labels
  };

  const stop = async () => {
    // No-op
  };

  const toggleMute = () => {
    // No-op - mute is handled by OS accessibility settings
  };

  const clearQueue = () => {
    // No-op
  };

  const value = {
    isPlaying: false,
    isMuted: false,
    playText,
    stop,
    toggleMute,
    clearQueue,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

/**
 * Hook to access the audio context.
 *
 * @returns Audio context
 * @throws Error if used outside AudioProvider
 */
export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

