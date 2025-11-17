import * as Speech from 'expo-speech';

/**
 * Speech recognition result.
 */
export interface SpeechResult {
  text: string;
  confidence?: number;
}

/**
 * Starts listening for speech input.
 * Note: expo-speech is for TTS, not STT. For production, use @react-native-voice/voice or similar.
 *
 * @param onResult - Callback when speech is recognized
 * @param onError - Callback for errors
 * @returns Cleanup function to stop listening
 */
export function startListening(
  onResult: (result: SpeechResult) => void,
  onError?: (error: Error) => void
): () => void {
  // Placeholder implementation
  // In production, integrate with @react-native-voice/voice or similar STT service
  console.warn('Speech recognition not yet implemented. Use text input instead.');

  if (onError) {
    onError(new Error('Speech recognition not implemented'));
  }

  // Return no-op cleanup
  return () => {};
}

/**
 * Checks if speech recognition is available.
 *
 * @returns True if available
 */
export function isSpeechRecognitionAvailable(): boolean {
  // Placeholder - will be true when STT is integrated
  return false;
}

