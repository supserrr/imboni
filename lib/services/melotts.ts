/**
 * MeloTTS API service for text-to-speech synthesis.
 * Converts text to natural, human-like speech audio.
 * 
 * MeloTTS is self-hosted. Default runs on http://localhost:8888
 * To run: docker run -it -p 8888:8888 melotts
 * Or: melo-ui (runs on port 8888 by default)
 */

const MELOTTS_API_URL = process.env.EXPO_PUBLIC_MELOTTS_API_URL || 'http://localhost:8888';

/**
 * Supported languages for TTS.
 */
export type TTSLanguage = 'EN' | 'ES' | 'FR' | 'ZH' | 'JP' | 'KR';

/**
 * English speaker variants.
 */
export type EnglishSpeaker = 'EN-Default' | 'EN-US' | 'EN-BR' | 'EN_INDIA' | 'EN-AU';

/**
 * TTS request parameters.
 */
export interface TTSRequest {
  text: string;
  language: TTSLanguage;
  speaker?: string;
  speed?: number;
}

/**
 * TTS response containing audio data.
 */
export interface TTSResponse {
  audioUrl: string;
  audioBlob?: Blob;
  duration?: number;
}

/**
 * Audio cache to avoid redundant API calls.
 */
const audioCache = new Map<string, string>();

/**
 * Generates cache key for TTS request.
 *
 * @param params - TTS request parameters
 * @returns Cache key string
 */
function getCacheKey(params: TTSRequest): string {
  return `${params.language}-${params.speaker || 'default'}-${params.speed || 1.0}-${params.text}`;
}

/**
 * Synthesizes speech from text using MeloTTS API.
 *
 * @param text - Text to convert to speech
 * @param language - Language code (EN, ES, FR, ZH, JP, KR)
 * @param speaker - Optional speaker variant (for English: EN-US, EN-BR, etc.)
 * @param speed - Speech speed multiplier (default 1.0)
 * @returns Audio URL or blob
 */
export async function synthesizeSpeech(
  text: string,
  language: TTSLanguage = 'EN',
  speaker?: string,
  speed: number = 1.0
): Promise<TTSResponse> {
  // MeloTTS is self-hosted, so we check if the service is available
  // Default URL is http://localhost:8888

  const params: TTSRequest = {
    text,
    language,
    speaker,
    speed,
  };

  // Check cache
  const cacheKey = getCacheKey(params);
  const cachedUrl = audioCache.get(cacheKey);
  if (cachedUrl) {
    return { audioUrl: cachedUrl };
  }

  try {
    // MeloTTS HTTP API endpoint
    // Uses the custom HTTP wrapper server (melotts-server/server.py)
    const endpoint = `${MELOTTS_API_URL}/api/tts`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: params.text,
        language: params.language,
        speaker: params.speaker,
        speed: params.speed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MeloTTS API error: ${response.status} - ${errorText}`);
    }

    // MeloTTS returns audio file
    const audioBlob = await response.blob();
    
    // Convert blob to base64 data URI for React Native compatibility
    // This works on both web and native platforms
    const reader = new FileReader();
    const audioUrl = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    // Cache the URL
    audioCache.set(cacheKey, audioUrl);

    return {
      audioUrl,
      audioBlob,
    };
  } catch (error) {
    console.error('MeloTTS synthesis error:', error);
    throw error;
  }
}

/**
 * Clears the audio cache.
 */
export function clearAudioCache(): void {
  audioCache.clear();
}

/**
 * Gets available speakers for a language.
 *
 * @param language - Language code
 * @returns Array of available speaker IDs
 */
export function getAvailableSpeakers(language: TTSLanguage): string[] {
  if (language === 'EN') {
    return ['EN-Default', 'EN-US', 'EN-BR', 'EN_INDIA', 'EN-AU'];
  }
  return [language];
}

