/**
 * ElevenLabs streaming TTS service.
 * Provides natural, human-like speech synthesis with streaming support.
 */

import { Audio } from 'expo-av';
import { debug, error as logError, info } from '@/lib/utils/logger';
import { waitIfThrottled, recordRequest } from '@/lib/utils/throttling';
import { categorizeError, withRetry } from '@/lib/utils/errorHandling';

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';
const ELEVENLABS_API_URL = process.env.EXPO_PUBLIC_ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1';

/**
 * TTS options for customization.
 */
export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number; // 0-1, default 0.5
  similarityBoost?: number; // 0-1, default 0.75
  style?: number; // 0-1, default 0.0
  useSpeakerBoost?: boolean; // default true
  speechRate?: number; // 0.25-4.0, default 1.0
}

/**
 * TTS audio source (streaming or static).
 */
export interface AudioSource {
  uri: string;
  type: 'streaming' | 'static';
  duration?: number;
}

/**
 * WebSocket connection state.
 */
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  STREAMING = 'streaming',
  ERROR = 'error',
}

/**
 * ElevenLabs streaming TTS client.
 */
class ElevenLabsTTSClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private currentSound: Audio.Sound | null = null;
  private audioChunks: Blob[] = [];
  private streamCallbacks: Set<(chunk: Blob) => void> = new Set();
  private completeCallbacks: Set<(audioUri: string) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();

  /**
   * Connects to ElevenLabs streaming TTS WebSocket.
   *
   * @param voiceId - Voice ID to use
   * @param options - TTS options
   * @returns Promise that resolves when connected
   */
  async connect(voiceId: string, options: TTSOptions = {}): Promise<void> {
    if (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING) {
      return;
    }

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured. Set EXPO_PUBLIC_ELEVENLABS_API_KEY in .env');
    }

    // Wait if throttled
    await waitIfThrottled('elevenlabs');

    this.state = ConnectionState.CONNECTING;

    try {
      // ElevenLabs streaming endpoint
      // Format may vary based on ElevenLabs API - adjust based on actual documentation
      const wsUrl = `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream?xi-api-key=${ELEVENLABS_API_KEY}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.state = ConnectionState.CONNECTED;
        this.audioChunks = [];
        debug('ElevenLabs TTS WebSocket connected', { voiceId, options });
      };

      this.ws.onmessage = (event) => {
        try {
          if (event.data instanceof Blob) {
            // Audio chunk received
            this.audioChunks.push(event.data);
            
            // Notify stream callbacks
            this.streamCallbacks.forEach((callback) => {
              try {
                callback(event.data);
              } catch (err) {
                logError('Error in TTS stream callback', err instanceof Error ? err : new Error(String(err)));
              }
            });
          } else if (typeof event.data === 'string') {
            // JSON message (status, metadata, etc.)
            const data = JSON.parse(event.data);
            
            if (data.audio) {
              // Base64 audio data
              const audioBlob = new Blob([Buffer.from(data.audio, 'base64')], { type: 'audio/mpeg' });
              this.audioChunks.push(audioBlob);
              
              this.streamCallbacks.forEach((callback) => {
                try {
                  callback(audioBlob);
                } catch (err) {
                  logError('Error in TTS stream callback', err instanceof Error ? err : new Error(String(err)));
                }
              });
            }

            if (data.event === 'audio_generation_complete' || data.isFinal) {
              // Streaming complete
              this.handleStreamComplete();
            }
          }
        } catch (parseError) {
          warn('Failed to parse ElevenLabs TTS response', { error: parseError });
        }
      };

      this.ws.onerror = (wsError) => {
        const error = new Error(`ElevenLabs TTS WebSocket error: ${wsError.message || 'Unknown error'}`);
        this.state = ConnectionState.ERROR;
        recordRequest('elevenlabs', false, error);
        
        this.errorCallbacks.forEach((callback) => {
          try {
            callback(error);
          } catch (err) {
            logError('Error in error callback', err instanceof Error ? err : new Error(String(err)));
          }
        });
      };

      this.ws.onclose = (event) => {
        debug('ElevenLabs TTS WebSocket closed', { code: event.code, reason: event.reason });
        this.state = ConnectionState.DISCONNECTED;
        this.ws = null;
      };

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        if (this.ws) {
          const originalOnOpen = this.ws.onopen;
          this.ws.onopen = (event) => {
            clearTimeout(timeout);
            if (originalOnOpen) originalOnOpen(event);
            resolve();
          };

          const originalOnError = this.ws.onerror;
          this.ws.onerror = (event) => {
            clearTimeout(timeout);
            if (originalOnError) originalOnError(event);
            reject(new Error('Connection error'));
          };
        }
      });

      recordRequest('elevenlabs', true);
    } catch (err) {
      this.state = ConnectionState.DISCONNECTED;
      recordRequest('elevenlabs', false, err);
      const categorized = categorizeError(err);
      logError('Failed to connect to ElevenLabs TTS', categorized);
      throw categorized;
    }
  }

  /**
   * Handles stream completion.
   */
  private handleStreamComplete(): void {
    // Combine all audio chunks into single blob
    const combinedBlob = new Blob(this.audioChunks, { type: 'audio/mpeg' });
    
    // Create object URL for playback
    // In React Native, we'll need to convert to a format expo-av can use
    const audioUri = URL.createObjectURL(combinedBlob);

    this.state = ConnectionState.DISCONNECTED;

    // Notify complete callbacks
    this.completeCallbacks.forEach((callback) => {
      try {
        callback(audioUri);
      } catch (err) {
        logError('Error in complete callback', err instanceof Error ? err : new Error(String(err)));
      }
    });

    this.audioChunks = [];
  }

  /**
   * Sends text for synthesis.
   *
   * @param text - Text to synthesize
   * @param options - TTS options
   */
  sendText(text: string, options: TTSOptions = {}): void {
    if (this.state !== ConnectionState.CONNECTED || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    try {
      // Send text with options
      const message = {
        text,
        model_id: options.modelId || 'eleven_multilingual_v2',
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0.0,
          use_speaker_boost: options.useSpeakerBoost ?? true,
        },
        generation_config: options.speechRate ? {
          chunk_length_schedule: [120],
        } : undefined,
      };

      this.ws.send(JSON.stringify(message));
      this.state = ConnectionState.STREAMING;
    } catch (err) {
      recordRequest('elevenlabs', false, err);
      throw err;
    }
  }

  /**
   * Closes the WebSocket connection.
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.state = ConnectionState.DISCONNECTED;
    this.audioChunks = [];
  }

  /**
   * Adds a callback for audio chunks.
   *
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  onStream(callback: (chunk: Blob) => void): () => void {
    this.streamCallbacks.add(callback);
    return () => {
      this.streamCallbacks.delete(callback);
    };
  }

  /**
   * Adds a callback for stream completion.
   *
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  onComplete(callback: (audioUri: string) => void): () => void {
    this.completeCallbacks.add(callback);
    return () => {
      this.completeCallbacks.delete(callback);
    };
  }

  /**
   * Adds a callback for errors.
   *
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }
}

/**
 * Synthesizes speech using ElevenLabs API.
 * Can use streaming WebSocket or HTTP fallback.
 *
 * @param text - Text to synthesize
 * @param voiceId - Optional voice ID (default from profile or API default)
 * @param options - TTS options
 * @returns Audio source for playback
 */
export async function synthesizeSpeech(
  text: string,
  voiceId?: string,
  options: TTSOptions = {}
): Promise<AudioSource> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured. Set EXPO_PUBLIC_ELEVENLABS_API_KEY in .env');
  }

  if (!text.trim()) {
    throw new Error('Text cannot be empty');
  }

  // Default voice ID if not provided
  const finalVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default ElevenLabs voice

  // Wait if throttled
  await waitIfThrottled('elevenlabs');

  try {
    // Try streaming first, fallback to HTTP if WebSocket not available
    return await withRetry(async () => {
      try {
        return await synthesizeSpeechStreaming(text, finalVoiceId, options);
      } catch (streamError) {
        // Fallback to HTTP
        debug('Streaming failed, using HTTP fallback', { error: streamError });
        return await synthesizeSpeechHTTP(text, finalVoiceId, options);
      }
    });
  } catch (err) {
    const categorized = categorizeError(err);
    logError('ElevenLabs TTS synthesis failed', categorized, {
      textLength: text.length,
      voiceId: finalVoiceId,
    });
    throw categorized;
  }
}

/**
 * Synthesizes speech using WebSocket streaming.
 *
 * @param text - Text to synthesize
 * @param voiceId - Voice ID
 * @param options - TTS options
 * @returns Audio source
 */
async function synthesizeSpeechStreaming(
  text: string,
  voiceId: string,
  options: TTSOptions
): Promise<AudioSource> {
  const client = new ElevenLabsTTSClient();

  // Connect
  await client.connect(voiceId, options);

  // Set up streaming
  const audioChunks: Blob[] = [];
  
  const unsubscribeStream = client.onStream((chunk) => {
    audioChunks.push(chunk);
  });

  // Wait for completion
  const audioUri = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Streaming timeout'));
    }, 30000); // 30 second timeout

    const unsubscribeComplete = client.onComplete((uri) => {
      clearTimeout(timeout);
      unsubscribeComplete();
      resolve(uri);
    });

    client.onError((err) => {
      clearTimeout(timeout);
      unsubscribeComplete();
      unsubscribeStream();
      reject(err);
    });
  });

  // Send text
  client.sendText(text, options);

  // Wait for completion
  await new Promise<string>((resolve) => {
    const unsubscribeComplete = client.onComplete((uri) => {
      unsubscribeComplete();
      resolve(uri);
    });
  });

  unsubscribeStream();
  client.disconnect();

  recordRequest('elevenlabs', true);

  return {
    uri: audioUri,
    type: 'streaming',
  };
}

/**
 * Synthesizes speech using HTTP API (fallback).
 *
 * @param text - Text to synthesize
 * @param voiceId - Voice ID
 * @param options - TTS options
 * @returns Audio source
 */
async function synthesizeSpeechHTTP(
  text: string,
  voiceId: string,
  options: TTSOptions
): Promise<AudioSource> {
  const url = `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`;

  const requestBody = {
    text,
    model_id: options.modelId || 'eleven_multilingual_v2',
    voice_settings: {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarityBoost ?? 0.75,
      style: options.style ?? 0.0,
      use_speaker_boost: options.useSpeakerBoost ?? true,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  const audioBlob = await response.blob();
  
  // Convert blob to data URI for React Native compatibility
  const reader = new FileReader();
  const audioUri = await new Promise<string>((resolve, reject) => {
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });

  recordRequest('elevenlabs', true);

  return {
    uri: audioUri,
    type: 'static',
  };
}

/**
 * Gets available voice IDs from ElevenLabs API.
 *
 * @returns Array of voice IDs
 */
export async function getAvailableVoices(): Promise<Array<{ id: string; name: string }>> {
  if (!ELEVENLABS_API_KEY) {
    return [];
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.voices || []).map((voice: { voice_id: string; name: string }) => ({
      id: voice.voice_id,
      name: voice.name,
    }));
  } catch (err) {
    logError('Failed to fetch ElevenLabs voices', err instanceof Error ? err : new Error(String(err)));
    return [];
  }
}

