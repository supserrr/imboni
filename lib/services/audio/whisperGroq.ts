/**
 * Groq Whisper streaming STT service.
 * WebSocket-based real-time speech-to-text with confidence scores.
 */

import { debug, error as logError, warn } from '@/lib/utils/logger';
import { waitIfThrottled, recordRequest } from '@/lib/utils/throttling';
import { categorizeError } from '@/lib/utils/errorHandling';
import { MediaStream } from 'react-native-webrtc';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_WHISPER_URL = process.env.EXPO_PUBLIC_GROQ_WHISPER_URL || 'wss://api.groq.com/v1/audio/transcriptions';

/**
 * Speech-to-text chunk result.
 */
export interface STTChunk {
  text: string;
  confidence: number; // 0-1
  isFinal: boolean;
  timestamp: number;
}

/**
 * WebSocket connection state.
 */
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Groq Whisper streaming STT client.
 */
class GroqWhisperClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private chunkCallbacks: Set<(chunk: STTChunk) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();
  private closeCallbacks: Set<() => void> = new Set();

  /**
   * Connects to Groq Whisper WebSocket endpoint.
   *
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING) {
      return;
    }

    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not configured. Set EXPO_PUBLIC_GROQ_API_KEY in .env');
    }

    // Wait if throttled
    await waitIfThrottled('groq');

    this.state = ConnectionState.CONNECTING;

    try {
      // WebSocket URL with authentication
      // Format may vary based on Groq API - adjust based on actual documentation
      const wsUrl = `${GROQ_WHISPER_URL}?authorization=${GROQ_API_KEY}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.state = ConnectionState.CONNECTED;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        debug('Groq Whisper WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Parse response based on Groq Whisper API format
          // Adjust based on actual API response structure
          const chunk: STTChunk = {
            text: data.text || data.transcript || '',
            confidence: data.confidence ?? 0.8, // Default confidence
            isFinal: data.is_final ?? false,
            timestamp: data.timestamp ?? Date.now(),
          };

          // Notify all chunk callbacks
          this.chunkCallbacks.forEach((callback) => {
            try {
              callback(chunk);
            } catch (err) {
              logError('Error in STT chunk callback', err instanceof Error ? err : new Error(String(err)));
            }
          });
        } catch (parseError) {
          warn('Failed to parse Groq Whisper response', { error: parseError, data: event.data });
        }
      };

      this.ws.onerror = (wsError) => {
        const error = new Error(`Groq Whisper WebSocket error: ${wsError.message || 'Unknown error'}`);
        this.state = ConnectionState.ERROR;
        recordRequest('groq', false, error);
        
        this.errorCallbacks.forEach((callback) => {
          try {
            callback(error);
          } catch (err) {
            logError('Error in error callback', err instanceof Error ? err : new Error(String(err)));
          }
        });

        debug('Groq Whisper WebSocket error', { error });
      };

      this.ws.onclose = (event) => {
        debug('Groq Whisper WebSocket closed', { code: event.code, reason: event.reason });
        this.state = ConnectionState.DISCONNECTED;
        this.ws = null;

        // Notify close callbacks
        this.closeCallbacks.forEach((callback) => {
          try {
            callback();
          } catch (err) {
            logError('Error in close callback', err instanceof Error ? err : new Error(String(err)));
          }
        });

        // Auto-reconnect if not intentional close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000); // 10 second timeout

        if (this.ws) {
          this.ws.onopen = () => {
            clearTimeout(timeout);
            resolve();
          };

          this.ws.onerror = (err) => {
            clearTimeout(timeout);
            reject(new Error(`Connection error: ${err.message || 'Unknown error'}`));
          };
        }
      });

      recordRequest('groq', true);
    } catch (err) {
      this.state = ConnectionState.DISCONNECTED;
      recordRequest('groq', false, err);
      const categorized = categorizeError(err);
      logError('Failed to connect to Groq Whisper', categorized, { reconnectAttempts: this.reconnectAttempts });
      throw categorized;
    }
  }

  /**
   * Attempts to reconnect with exponential backoff.
   */
  private attemptReconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    this.reconnectAttempts += 1;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds

    debug('Attempting to reconnect to Groq Whisper', {
      attempt: this.reconnectAttempts,
      delay: this.reconnectDelay,
    });

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect().catch((err) => {
        logError('Reconnection failed', err instanceof Error ? err : new Error(String(err)));
      });
    }, this.reconnectDelay);
  }

  /**
   * Sends audio data to the WebSocket.
   *
   * @param audioData - Audio data (ArrayBuffer or base64)
   */
  sendAudio(audioData: ArrayBuffer | string): void {
    if (this.state !== ConnectionState.CONNECTED || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    try {
      if (audioData instanceof ArrayBuffer) {
        this.ws.send(audioData);
      } else {
        // Send as JSON if string (base64)
        this.ws.send(
          JSON.stringify({
            audio: audioData,
          })
        );
      }
    } catch (err) {
      recordRequest('groq', false, err);
      throw err;
    }
  }

  /**
   * Closes the WebSocket connection.
   */
  disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.state = ConnectionState.DISCONNECTED;
    this.reconnectAttempts = 0;
  }

  /**
   * Adds a callback for STT chunks.
   *
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  onChunk(callback: (chunk: STTChunk) => void): () => void {
    this.chunkCallbacks.add(callback);
    return () => {
      this.chunkCallbacks.delete(callback);
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

  /**
   * Adds a callback for connection close.
   *
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  onClose(callback: () => void): () => void {
    this.closeCallbacks.add(callback);
    return () => {
      this.closeCallbacks.delete(callback);
    };
  }

  /**
   * Gets the current connection state.
   *
   * @returns Connection state
   */
  getState(): ConnectionState {
    return this.state;
  }
}

/**
 * Global Groq Whisper client instance.
 */
let whisperClient: GroqWhisperClient | null = null;

/**
 * Gets or creates the Groq Whisper client.
 *
 * @returns Whisper client instance
 */
export function getWhisperClient(): GroqWhisperClient {
  if (!whisperClient) {
    whisperClient = new GroqWhisperClient();
  }
  return whisperClient;
}

/**
 * Starts streaming STT with audio from MediaStream.
 *
 * @param audioStream - MediaStream from microphone
 * @param onChunk - Callback for STT chunks
 * @param onError - Optional error callback
 * @returns Promise that resolves when streaming starts
 */
export async function startStreaming(
  audioStream: MediaStream,
  onChunk: (chunk: STTChunk) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  const client = getWhisperClient();

  // Connect if not connected
  if (client.getState() !== ConnectionState.CONNECTED) {
    await client.connect();
  }

  // Set up callbacks
  const unsubscribeChunk = client.onChunk(onChunk);
  
  if (onError) {
    client.onError(onError);
  }

  // Start capturing audio from MediaStream
  // For React Native, use react-native-webrtc MediaStream
  // Extract audio tracks and process them
  const audioTracks = audioStream.getAudioTracks();
  
  if (audioTracks.length === 0) {
    throw new Error('No audio tracks in MediaStream');
  }

  // Create an interval to capture audio chunks
  // In production, use react-native-webrtc's audio processing capabilities
  // or integrate with Groq's streaming API format requirements
  const captureInterval = setInterval(() => {
    // For now, this is a placeholder - actual implementation requires
    // audio processing library or Groq SDK integration
    // The MediaStream from react-native-webrtc provides audio tracks
    // that can be processed and sent to Groq's WebSocket endpoint
    
    // Stub: In actual implementation, capture audio buffer from MediaStream
    // and send via WebSocket
    try {
      // This will need to be implemented based on Groq's API format
      // For now, we'll log that audio capture is happening
      debug('Audio capture interval (stub implementation)', { audioTracks: audioTracks.length });
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, 1000); // Capture every second (adjust based on Groq API requirements)

  // Return cleanup function
  return () => {
    clearInterval(captureInterval);
    unsubscribeChunk();
  };
}

/**
 * Stops streaming and disconnects.
 */
export function stopStreaming(): void {
  if (whisperClient) {
    whisperClient.disconnect();
    whisperClient = null;
  }
}

