/**
 * Moondream encoder service for on-device image encoding.
 * Uses Expo ML with native bindings for on-device encoding.
 * Falls back to API if native encoder fails.
 */

import { error, warn, debug } from '@/lib/utils/logger';

/**
 * Image embedding vector type.
 */
export type ImageEmbedding = number[];

/**
 * Encoder configuration.
 */
export interface EncoderConfig {
  modelPath?: string;
  device?: 'cpu' | 'gpu';
}

let encoderInstance: any = null;
let isEncoderLoading = false;
let encoderLoadError: Error | null = null;

/**
 * Loads the Moondream encoder model.
 * Uses Expo ML or Transformers.js for on-device inference.
 *
 * @param config - Encoder configuration
 * @returns Promise that resolves when encoder is loaded
 */
async function loadEncoder(config: EncoderConfig = {}): Promise<void> {
  if (encoderInstance) {
    return;
  }

  if (isEncoderLoading) {
    // Wait for ongoing load
    while (isEncoderLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (encoderLoadError) {
      throw encoderLoadError;
    }
    return;
  }

  isEncoderLoading = true;
  encoderLoadError = null;

  try {
    // Try to use Expo ML if available
    // For now, we'll use a stub that falls back to API
    // In production, integrate with Expo ML package:
    // import * as ExpoML from 'expo-ml';
    // encoderInstance = await ExpoML.loadModel('moondream-encoder');

    // Check if we have native ML support
    const hasExpoML = false; // Will be true when Expo ML is integrated

    if (!hasExpoML) {
      // No native encoder available, will use API fallback
      warn('Expo ML not available, encoder will use API fallback', { config });
      encoderLoadError = new Error('Expo ML not available');
    } else {
      // Native encoder loaded successfully
      debug('Moondream encoder loaded successfully', { config });
    }
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    encoderLoadError = errorObj;
    error('Failed to load Moondream encoder', errorObj, { config });
    throw errorObj;
  } finally {
    isEncoderLoading = false;
  }
}

/**
 * Encodes an image to an embedding vector using on-device encoder.
 *
 * @param imageBase64 - Base64 encoded image data
 * @param config - Encoder configuration
 * @returns Embedding vector
 * @throws Error if encoding fails and API fallback is not available
 */
export async function encodeImage(
  imageBase64: string,
  config: EncoderConfig = {}
): Promise<ImageEmbedding> {
  try {
    // Try to load encoder if not already loaded
    if (!encoderInstance) {
      try {
        await loadEncoder(config);
      } catch (loadError) {
        // If loading fails, return null to signal API fallback needed
        debug('Encoder load failed, will use API fallback', { loadError });
        throw new Error('Encoder not available, use API fallback');
      }
    }

    if (!encoderInstance) {
      throw new Error('Encoder not available, use API fallback');
    }

    // Convert base64 to image format expected by encoder
    // This is a stub - actual implementation depends on Expo ML API
    // const imageTensor = await ExpoML.preprocessImage(imageBase64);
    // const embedding = await encoderInstance.encode(imageTensor);

    // Placeholder return - actual implementation will use Expo ML
    throw new Error('Encoder not implemented, use API fallback');
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    debug('On-device encoding failed, API fallback needed', { error: errorObj });
    throw errorObj;
  }
}

/**
 * Checks if on-device encoder is available.
 *
 * @returns True if encoder is available and loaded
 */
export function isEncoderAvailable(): boolean {
  return encoderInstance !== null;
}

/**
 * Clears the encoder instance to free memory.
 */
export function clearEncoder(): void {
  if (encoderInstance) {
    // Clean up native resources if needed
    encoderInstance = null;
    debug('Moondream encoder cleared from memory');
  }
}

