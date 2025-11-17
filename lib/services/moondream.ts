/**
 * Moondream API service for vision analysis.
 * Analyzes image frames and returns descriptions with confidence scores.
 * Uses Moondream Cloud API with API key authentication.
 */

const MOONDREAM_API_KEY = process.env.EXPO_PUBLIC_MOONDREAM_API_KEY || '';
const MOONDREAM_API_URL = 'https://api.moondream.ai/v1'; // Moondream Cloud API endpoint

/**
 * Moondream analysis response structure.
 */
export interface MoondreamResponse {
  description: string;
  confidence: number;
  objects?: string[];
  text?: string;
  safety_cues?: string[];
}

/**
 * Analyzes an image frame using Moondream API.
 *
 * @param imageBase64 - Base64 encoded image data
 * @param query - Optional user query/question about the image
 * @returns Analysis response with description and confidence score
 */
export async function analyzeFrame(
  imageBase64: string,
  query?: string
): Promise<MoondreamResponse> {
  if (!MOONDREAM_API_KEY) {
    throw new Error('Moondream API key not configured. Set EXPO_PUBLIC_MOONDREAM_API_KEY in .env');
  }

  try {
    // Moondream API uses /v1/query endpoint
    // Image should be in data URI format: data:image/jpeg;base64,...
    const imageDataUri = `data:image/jpeg;base64,${imageBase64}`;
    
    const response = await fetch(`${MOONDREAM_API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Moondream-Auth': MOONDREAM_API_KEY,
      },
      body: JSON.stringify({
        image_url: imageDataUri,
        question: query || 'Describe what you see in detail.',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Moondream API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Moondream returns the answer directly in the response
    // We'll need to parse it and extract confidence if available
    // Adjust based on actual Moondream API response format
    return {
      description: data.answer || data.response || data.description || '',
      confidence: data.confidence || 0.8, // Default confidence if not provided
      objects: data.objects || [],
      text: data.text || '',
      safety_cues: data.safety_cues || [],
    };
  } catch (error) {
    console.error('Moondream analysis error:', error);
    throw error;
  }
}

/**
 * Checks if confidence is below threshold.
 *
 * @param confidence - Confidence score from 0 to 1
 * @param threshold - Confidence threshold (default 0.7)
 * @returns True if confidence is low
 */
export function isLowConfidence(confidence: number, threshold: number = 0.7): boolean {
  return confidence < threshold;
}

