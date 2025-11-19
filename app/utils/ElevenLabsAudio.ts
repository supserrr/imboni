import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * ElevenLabs Realtime API integration for text-to-speech and sound effects.
 */

const ELEVENLABS_API_URL =
  process.env.EXPO_PUBLIC_ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';
const DEFAULT_VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

export type AIState = 'idle' | 'listening' | 'processing' | 'speaking' | 'lowConfidence';

/**
 * Sound file mappings for AI states.
 * These should be generated sound effects or use ElevenLabs sound generation.
 */
const STATE_SOUND_MAP: Record<AIState, string> = {
  idle: '',
  listening: 'listening_chime',
  processing: 'processing_tone',
  speaking: 'speaking_flourish',
  lowConfidence: 'low_confidence_alert',
};

let audioPlayer: Audio.Sound | null = null;
let realtimeWebSocket: WebSocket | null = null;

/**
 * Initializes the audio system.
 */
async function initializeAudio(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('Error initializing audio:', error);
  }
}

/**
 * Generates a sound effect URL using ElevenLabs or returns a local sound file.
 * Checks cache before making API call.
 *
 * @param state - The AI state.
 * @returns URL or local file path for the sound effect.
 */
async function getSoundEffectUrl(state: AIState): Promise<string | null> {
  if (state === 'idle' || !STATE_SOUND_MAP[state]) {
    return null;
  }

  try {
    const soundName = STATE_SOUND_MAP[state];
    const cachedUri = `${FileSystem.cacheDirectory}${soundName}.mp3`;
    
    const fileInfo = await FileSystem.getInfoAsync(cachedUri);
    if (fileInfo.exists) {
      return cachedUri;
    }
    
    if (ELEVENLABS_API_KEY) {
      try {
        const response = await fetch(`${ELEVENLABS_API_URL}/audio-generation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: soundName,
            voice_id: DEFAULT_VOICE_ID,
            model_id: 'eleven_multilingual_v2',
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
          await FileSystem.writeAsStringAsync(cachedUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return cachedUri;
        }
      } catch (error) {
        console.error('Error generating sound effect:', error);
      }
    }

    return null;
  } catch (error) {
    console.error('Error generating sound effect:', error);
    return null;
  }
}

/**
 * Plays a sound effect based on AI state.
 *
 * @param state - The current AI state.
 * @returns Promise that resolves when sound starts playing.
 */
export async function playStateSound(state: AIState): Promise<void> {
  try {
    await initializeAudio();

    if (state === 'idle') {
      return;
    }

    const soundUrl = await getSoundEffectUrl(state);
    
    if (!soundUrl) {
      return;
    }

    if (audioPlayer) {
      await audioPlayer.unloadAsync();
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: soundUrl },
      { shouldPlay: true, volume: 0.8 }
    );

    audioPlayer = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        audioPlayer = null;
      }
    });
  } catch (error) {
    console.error('Error playing state sound:', error);
  }
}

/**
 * Converts text to speech using ElevenLabs API and plays it.
 *
 * @param text - The text to convert to speech.
 * @param voiceId - The voice ID to use (optional).
 * @param rate - The speech rate (optional, default 1.0).
 * @returns Promise that resolves when TTS starts playing.
 */
export async function textToSpeech(
  text: string,
  voiceId?: string,
  rate: number = 1.0
): Promise<void> {
  try {
    await initializeAudio();

    if (!ELEVENLABS_API_KEY) {
      console.warn('ElevenLabs API key not configured');
      return;
    }

    const voice = voiceId || DEFAULT_VOICE_ID;

    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
        speed: Math.max(0.25, Math.min(2.0, rate)),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const audioBlob = await response.blob();
    const uri = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
    
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));

    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (audioPlayer) {
      await audioPlayer.unloadAsync();
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 }
    );

    audioPlayer = sound;

    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.isLoaded && status.didJustFinish) {
        await sound.unloadAsync();
        audioPlayer = null;
        try {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (error) {
          console.error('Error deleting TTS file:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error with text-to-speech:', error);
  }
}

/**
 * Initializes the ElevenLabs Realtime WebSocket connection.
 *
 * @param onAudioData - Callback for received audio data.
 * @returns Promise resolving to the WebSocket connection.
 */
export async function initializeRealtimeTTS(
  onAudioData: (audioData: ArrayBuffer) => void
): Promise<WebSocket | null> {
  try {
    if (!ELEVENLABS_API_KEY) {
      console.warn('ElevenLabs API key not configured');
      return null;
    }

    if (realtimeWebSocket) {
      realtimeWebSocket.close();
    }

    const wsUrl = `${ELEVENLABS_API_URL.replace(/^https?/, 'wss')}/realtime/v1?model_id=eleven_turbo_v2_5`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'connection_init',
        xi_api_key: ELEVENLABS_API_KEY,
      }));
    };

    ws.onmessage = async (event) => {
      if (event.data instanceof ArrayBuffer) {
        onAudioData(event.data);
      } else if (typeof event.data === 'string') {
        const message = JSON.parse(event.data);
        if (message.type === 'audio') {
          const audioData = Buffer.from(message.audio, 'base64');
          onAudioData(audioData.buffer);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      realtimeWebSocket = null;
    };

    realtimeWebSocket = ws;
    return ws;
  } catch (error) {
    console.error('Error initializing Realtime TTS:', error);
    return null;
  }
}

/**
 * Sends text to the Realtime TTS WebSocket for streaming audio.
 *
 * @param text - The text to convert to speech.
 * @returns Promise that resolves when text is sent.
 */
export async function sendRealtimeText(text: string): Promise<void> {
  if (!realtimeWebSocket || realtimeWebSocket.readyState !== WebSocket.OPEN) {
    console.warn('Realtime WebSocket not connected');
    return;
  }

  try {
    realtimeWebSocket.send(JSON.stringify({
      type: 'text',
      text,
    }));
  } catch (error) {
    console.error('Error sending realtime text:', error);
  }
}

/**
 * Closes the Realtime TTS WebSocket connection.
 */
export async function closeRealtimeTTS(): Promise<void> {
  if (realtimeWebSocket) {
    realtimeWebSocket.close();
    realtimeWebSocket = null;
  }

  if (audioPlayer) {
    await audioPlayer.unloadAsync();
    audioPlayer = null;
  }
}

/**
 * Alias for textToSpeech function.
 *
 * @param text - The text to convert to speech.
 * @returns Promise that resolves when TTS starts playing.
 */
export async function playTTS(text: string): Promise<void> {
  return textToSpeech(text);
}

/**
 * Alias for playStateSound function.
 *
 * @param state - The current AI state.
 * @returns Promise that resolves when sound starts playing.
 */
export async function playSoundEffect(state: AIState): Promise<void> {
  return playStateSound(state);
}
