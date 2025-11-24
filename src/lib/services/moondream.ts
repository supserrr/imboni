/**
 * Moondream API client for image analysis
 * Based on the reference implementation from m87-labs/Analyze-Live-Video-Solution
 */

const MOONDREAM_API_KEY = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MOONDREAM_API_KEY) || '';

export interface MoondreamQueryRequest {
  image_url: string;
  question: string;
}

export interface MoondreamQueryResponse {
  answer: string;
}

export interface MoondreamError {
  error: string;
  message?: string;
}

/**
 * Query Moondream API with an image and question
 * Matches the exact pattern from the reference implementation
 * @param imageDataUrl - Base64 data URL of the image
 * @param question - Question to ask about the image
 * @param inferenceUrl - Base URL for the Moondream API (defaults to https://api.moondream.ai/v1)
 * @param retryCount - Current retry attempt (for internal use)
 * @returns Promise with the analysis result
 */
export async function queryMoondream(
  imageDataUrl: string,
  question: string,
  inferenceUrl: string = 'https://api.moondream.ai/v1',
  retryCount: number = 0
): Promise<string> {
  const sanitizedBase = inferenceUrl?.replace(/\/$/, '') || 'https://api.moondream.ai/v1';
  const endpoint = sanitizedBase.endsWith('/query') ? sanitizedBase : `${sanitizedBase}/query`;
  const maxRetries = 3;
  const apiKey = MOONDREAM_API_KEY.trim();

  if (!apiKey) {
    throw new Error('Missing Moondream API key. Set NEXT_PUBLIC_MOONDREAM_API_KEY in your .env file.');
  }

    try {
    const response = await fetch(endpoint, {
      method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'X-Moondream-Auth': apiKey,
        },
        body: JSON.stringify({
          image_url: imageDataUrl,
          question,
        } as MoondreamQueryRequest),
    });

      if (!response.ok) {
      if (response.status === 429 && retryCount < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 8000);
        console.log('Backoff for', backoffMs, 'ms before retrying...');
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return queryMoondream(imageDataUrl, question, inferenceUrl, retryCount + 1);
      }
      throw new Error(`API error: ${response.status}`);
      }

    const data = (await response.json()) as MoondreamQueryResponse;
    return data.answer || '';
    } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limit')) {
      throw error;
    }
    throw new Error('Network error. Please check your connection.');
  }
}
