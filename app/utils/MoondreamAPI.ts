import * as FileSystem from 'expo-file-system/legacy';

/**
 * Moondream API integration for visual understanding.
 */

const MOONDREAM_API_URL =
  process.env.EXPO_PUBLIC_MOONDREAM_API_URL || 'https://api.moondream.com/v1';
const MOONDREAM_API_KEY =
  process.env.EXPO_PUBLIC_MOONDREAM_API_KEY || process.env.MOONDREAM_API_KEY || '';

/**
 * Default confidence threshold for requesting human help.
 */
export const CONFIDENCE_THRESHOLD = 0.7;

export interface MoondreamResponse {
  description: string;
  confidence: number;
}

/**
 * Converts a camera frame/image to base64.
 *
 * @param imageUri - The URI of the image (file:// or https://).
 * @returns Base64 encoded image string without data URI prefix.
 */
async function imageToBase64(imageUri: string): Promise<string> {
  try {
    let base64: string;
    
    if (imageUri.startsWith('file://')) {
      base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } else if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
    } else {
      throw new Error('Unsupported image URI format');
    }

    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

/**
 * Analyzes a camera frame and returns a description with confidence score.
 * Includes retry logic for API failures.
 *
 * @param imageUri - The URI of the camera frame/image.
 * @param prompt - Optional prompt for the vision model.
 * @param retries - Number of retry attempts (default 3).
 * @returns Promise resolving to description and confidence score.
 */
export async function analyzeCameraFrame(
  imageUri: string,
  prompt?: string,
  retries: number = 3
): Promise<MoondreamResponse> {
  const defaultPrompt = 'Describe what you see in this image in detail. Focus on objects, people, text, and spatial relationships.';
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const base64Image = await imageToBase64(imageUri);

      const response = await fetch(`${MOONDREAM_API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${MOONDREAM_API_KEY}`,
        },
        body: JSON.stringify({
          image: base64Image,
          prompt: prompt || defaultPrompt,
          model: 'moondream2',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status >= 500 && attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`Moondream API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data) {
        throw new Error('Invalid response from Moondream API');
      }
      
      const description = data.description || data.text || 'Unable to analyze image';
      const confidence = typeof data.confidence === 'number' 
        ? Math.max(0, Math.min(1, data.confidence)) 
        : (typeof data.score === 'number' ? Math.max(0, Math.min(1, data.score)) : 0.5);

      return {
        description,
        confidence,
      };
    } catch (error) {
      console.error(`Error analyzing camera frame (attempt ${attempt + 1}/${retries}):`, error);
      
      if (attempt === retries - 1) {
        return {
          description: 'Error analyzing image. Please try again.',
          confidence: 0,
        };
      }
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    description: 'Error analyzing image. Please try again.',
    confidence: 0,
  };
}

/**
 * Checks if the confidence score is below the threshold for requesting human help.
 *
 * @param confidence - The confidence score from Moondream (0-1).
 * @param threshold - The threshold value (default 0.7).
 * @returns True if confidence is below threshold.
 */
export function isLowConfidence(confidence: number, threshold: number = CONFIDENCE_THRESHOLD): boolean {
  return confidence < threshold;
}

/**
 * Gets the confidence threshold value.
 *
 * @returns The confidence threshold.
 */
export function getConfidenceThreshold(): number {
  return CONFIDENCE_THRESHOLD;
}
