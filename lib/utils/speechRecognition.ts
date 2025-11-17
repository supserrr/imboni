import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Speech recognition result.
 */
export interface SpeechResult {
  text: string;
  confidence?: number;
}

/**
 * Speech recognition interface.
 */
export interface SpeechRecognition {
  start: (locale?: string) => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => Promise<void>;
  destroy: () => Promise<void>;
  removeAllListeners: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSpeechResults?: (event: { value: string[] }) => void;
  onSpeechError?: (event: { error: Error }) => void;
}

/**
 * Checks if we're running in Expo Go.
 */
function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

/**
 * Gets the Voice module with fallback for Expo Go.
 * In Expo Go, this will return null immediately.
 * For production, use a development build with @react-native-voice/voice.
 */
function getVoiceModule(): SpeechRecognition | null {
  // In Expo Go, never try to load the native module
  if (isExpoGo()) {
    return null;
  }

  // Only try to load in development builds
  // Use a lazy approach - we'll check this when actually needed
  return null; // Will be loaded lazily when start() is called
}

/**
 * Mock Voice implementation for Expo Go.
 */
class MockVoice implements SpeechRecognition {
  private isListening = false;
  private listeners: {
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
    onSpeechResults?: (event: { value: string[] }) => void;
    onSpeechError?: (event: { error: Error }) => void;
  } = {};

  async start(locale?: string): Promise<void> {
    if (this.isListening) return;
    this.isListening = true;
    if (this.listeners.onSpeechStart) {
      this.listeners.onSpeechStart();
    }
    // In Expo Go, we can't do real speech recognition
    // This is a placeholder that shows the limitation
    console.warn('Speech recognition requires a development build. Voice input will not work in Expo Go.');
  }

  async stop(): Promise<void> {
    this.isListening = false;
    if (this.listeners.onSpeechEnd) {
      this.listeners.onSpeechEnd();
    }
  }

  async cancel(): Promise<void> {
    this.isListening = false;
  }

  async destroy(): Promise<void> {
    this.isListening = false;
    this.listeners = {};
  }

  removeAllListeners(): void {
    this.listeners = {};
  }

  set onSpeechStart(callback: () => void | undefined) {
    this.listeners.onSpeechStart = callback;
  }

  set onSpeechEnd(callback: () => void | undefined) {
    this.listeners.onSpeechEnd = callback;
  }

  set onSpeechResults(callback: (event: { value: string[] }) => void | undefined) {
    this.listeners.onSpeechResults = callback;
  }

  set onSpeechError(callback: (event: { error: Error }) => void | undefined) {
    this.listeners.onSpeechError = callback;
  }
}

/**
 * Lazy Voice wrapper that only loads the native module when needed.
 */
class LazyVoice implements SpeechRecognition {
  private nativeVoice: SpeechRecognition | null = null;
  private listeners: {
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
    onSpeechResults?: (event: { value: string[] }) => void;
    onSpeechError?: (event: { error: Error }) => void;
  } = {};

  /**
   * Tries to load the native Voice module.
   * Only attempts to load in development builds, never in Expo Go.
   */
  private tryLoadNative(): SpeechRecognition | null {
    if (this.nativeVoice) {
      return this.nativeVoice;
    }

    // Never try to load in Expo Go
    if (isExpoGo()) {
      return null;
    }

    // In development builds, try to load the native module
    // Use dynamic require with string to prevent evaluation in Expo Go
    try {
      // Use Function constructor to create a require that won't be evaluated until called
      // This prevents the require from being parsed/evaluated at module load time
      const loadModule = new Function('moduleName', `
        try {
          return require(moduleName);
        } catch (e) {
          return null;
        }
      `);

      const VoiceModule = loadModule('@react-native-voice/voice');
      if (VoiceModule && (VoiceModule.start || VoiceModule.default?.start)) {
        this.nativeVoice = VoiceModule.default || VoiceModule;
        // Copy listeners to native module
        if (this.listeners.onSpeechStart) {
          this.nativeVoice.onSpeechStart = this.listeners.onSpeechStart;
        }
        if (this.listeners.onSpeechEnd) {
          this.nativeVoice.onSpeechEnd = this.listeners.onSpeechEnd;
        }
        if (this.listeners.onSpeechResults) {
          this.nativeVoice.onSpeechResults = this.listeners.onSpeechResults;
        }
        if (this.listeners.onSpeechError) {
          this.nativeVoice.onSpeechError = this.listeners.onSpeechError;
        }
        return this.nativeVoice;
      }
    } catch (error) {
      // Native module not available
      console.warn('Native voice module not available:', error);
    }
    return null;
  }

  async start(locale?: string): Promise<void> {
    const native = this.tryLoadNative();
    if (native) {
      return native.start(locale);
    }
    // Fallback to mock behavior
    throw new Error('Voice recognition not available. Requires development build.');
  }

  async stop(): Promise<void> {
    if (this.nativeVoice) {
      return this.nativeVoice.stop();
    }
  }

  async cancel(): Promise<void> {
    if (this.nativeVoice) {
      return this.nativeVoice.cancel();
    }
  }

  async destroy(): Promise<void> {
    if (this.nativeVoice) {
      await this.nativeVoice.destroy();
    }
    this.listeners = {};
  }

  removeAllListeners(): void {
    if (this.nativeVoice) {
      this.nativeVoice.removeAllListeners();
    }
    this.listeners = {};
  }

  set onSpeechStart(callback: () => void | undefined) {
    this.listeners.onSpeechStart = callback;
    if (this.nativeVoice) {
      this.nativeVoice.onSpeechStart = callback;
    }
  }

  set onSpeechEnd(callback: () => void | undefined) {
    this.listeners.onSpeechEnd = callback;
    if (this.nativeVoice) {
      this.nativeVoice.onSpeechEnd = callback;
    }
  }

  set onSpeechResults(callback: (event: { value: string[] }) => void | undefined) {
    this.listeners.onSpeechResults = callback;
    if (this.nativeVoice) {
      this.nativeVoice.onSpeechResults = callback;
    }
  }

  set onSpeechError(callback: (event: { error: Error }) => void | undefined) {
    this.listeners.onSpeechError = callback;
    if (this.nativeVoice) {
      this.nativeVoice.onSpeechError = callback;
    }
  }
}

/**
 * Gets a Voice instance (native or mock).
 * Uses lazy loading to avoid import-time errors in Expo Go.
 */
export function getVoice(): SpeechRecognition {
  // In Expo Go, always return mock to avoid any native module access
  if (isExpoGo()) {
    return new MockVoice();
  }
  // In development builds, use lazy wrapper
  // The wrapper will try to load native module only when start() is called
  return new LazyVoice();
}

/**
 * Checks if speech recognition is available.
 * In Expo Go, this will always return false.
 *
 * @returns True if available (only in development builds)
 */
export function isSpeechRecognitionAvailable(): boolean {
  // In Expo Go, never available
  if (isExpoGo()) {
    return false;
  }
  // In development builds, we can't check without trying to require
  // So we'll return true and let the LazyVoice handle the actual check
  return true;
}

