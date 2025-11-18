/**
 * Moondream reasoning service for cloud-based vision analysis.
 * Accepts embedding vectors + user text + session context.
 * Enforces helpful, human tone via system prompts.
 */

import { withRetry, categorizeError } from '@/lib/utils/errorHandling';
import { waitIfThrottled, recordRequest } from '@/lib/utils/throttling';
import { error as logError, debug, info } from '@/lib/utils/logger';
import { encodeImage, isEncoderAvailable } from './moondreamEncoder';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/moondream-reasoning`;

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
 * Session context for reasoning.
 */
export interface SessionContext {
  conversationHistory?: Array<{
    userInput?: string;
    aiResponse?: string;
    timestamp: number;
  }>;
  userPreferences?: {
    language?: string;
    verbosity?: 'detailed' | 'concise';
  };
}

/**
 * Reasoning request parameters.
 */
export interface ReasoningRequest {
  embedding?: number[]; // Optional embedding vector (if on-device encoding succeeded)
  imageBase64?: string; // Fallback to base64 image if embedding not available
  userText?: string; // User query/question
  context?: SessionContext; // Session context for better responses
}

/**
 * System prompt for helpful, human tone.
 */
const SYSTEM_PROMPT = `You are a helpful, supportive AI assistant helping a visually impaired user understand their surroundings through images. 

Guidelines:
- Respond in a friendly, supportive tone, as if helping a visually impaired user
- Be reassuring and context-aware
- Describe what you see clearly and naturally
- Anticipate what information might be useful
- If unsure, say so gently and offer to connect with a human volunteer
- Keep responses conversational and easy to understand
- Avoid technical jargon unless necessary`;

/**
 * Formats conversation history for context.
 *
 * @param context - Session context
 * @returns Formatted context string
 */
function formatContext(context?: SessionContext): string {
  if (!context?.conversationHistory || context.conversationHistory.length === 0) {
    return '';
  }

  const recentHistory = context.conversationHistory.slice(-5); // Last 5 exchanges
  const formatted = recentHistory
    .map((exchange) => {
      const parts: string[] = [];
      if (exchange.userInput) {
        parts.push(`User: ${exchange.userInput}`);
      }
      if (exchange.aiResponse) {
        parts.push(`Assistant: ${exchange.aiResponse}`);
      }
      return parts.join('\n');
    })
    .join('\n\n');

  return `Previous conversation:\n${formatted}\n\n`;
}

/**
 * Performs reasoning using Supabase Edge Function (proxies to Moondream API).
 *
 * @param request - Reasoning request parameters
 * @returns Analysis response with confidence
 */
async function performReasoning(request: ReasoningRequest): Promise<MoondreamResponse> {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not configured. Set EXPO_PUBLIC_SUPABASE_URL in .env');
  }

  // Wait if throttled
  await waitIfThrottled('moondream');

  try {
    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated. Please log in.');
    }

    // Build request body
    const body: Record<string, unknown> = {};

    // Add context if available
    if (request.context) {
      const contextStr = formatContext(request.context);
      if (contextStr) {
        body.context = contextStr;
      }

      if (request.context.userPreferences?.verbosity) {
        body.verbosity = request.context.userPreferences.verbosity;
      }
    }

    // Use embedding if available, otherwise use base64 image
    if (request.embedding && request.embedding.length > 0) {
      body.embedding = request.embedding;
      body.question = request.userText || 'Describe what you see in detail.';
    } else if (request.imageBase64) {
      // Convert base64 to data URI for Edge Function
      const imageDataUri = `data:image/jpeg;base64,${request.imageBase64}`;
      body.image_url = imageDataUri;
      body.question = request.userText || 'Describe what you see in detail.';
    } else {
      throw new Error('Either embedding or imageBase64 must be provided');
    }

    let response: Response;
    let usedFallback = false;

    try {
      // Call Supabase Edge Function
      response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });
    } catch (fetchError) {
      // Network error, record and throw
      recordRequest('moondream', false, fetchError);
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      const apiError = new Error(`Moondream Edge Function error: ${response.status} - ${errorData.error || errorText}`);
      recordRequest('moondream', false, apiError);
      throw apiError;
    }

    const data = await response.json();
    recordRequest('moondream', true);

    // Parse response from Edge Function
    const result: MoondreamResponse = {
      description: data.description || '',
      confidence: data.confidence ?? 0.5,
      objects: data.objects || [],
      text: data.text || '',
      safety_cues: data.safety_cues || [],
    };

    debug('Moondream reasoning completed', {
      hasDescription: !!result.description,
      confidence: result.confidence,
      usedFallback: data.usedFallback || false,
    });

    return result;
  } catch (err) {
    recordRequest('moondream', false, err);
    throw err;
  }
}

/**
 * Analyzes an image with optional on-device encoding and reasoning.
 *
 * @param request - Reasoning request parameters
 * @returns Analysis response with confidence
 */
export async function analyzeWithReasoning(
  request: ReasoningRequest
): Promise<MoondreamResponse> {
  try {
    // Try on-device encoding first if image is provided and encoder is available
    if (request.imageBase64 && isEncoderAvailable()) {
      try {
        const embedding = await encodeImage(request.imageBase64);
        if (embedding && embedding.length > 0) {
          debug('Using on-device encoding for reasoning', { embeddingLength: embedding.length });
          return await withRetry(() =>
            performReasoning({
              ...request,
              embedding,
              imageBase64: undefined, // Don't send base64 if we have embedding
            })
          );
        }
      } catch (encodeError) {
        // Encoding failed, fallback to API with base64
        debug('On-device encoding failed, using API fallback', { error: encodeError });
      }
    }

    // Use API directly with base64 image
    if (!request.imageBase64 && !request.embedding) {
      throw new Error('Either imageBase64 or embedding must be provided');
    }

    return await withRetry(() => performReasoning(request));
  } catch (err) {
    const categorized = categorizeError(err);
    logError('Moondream reasoning error', err instanceof Error ? err : new Error(String(err)), {
      hasEmbedding: !!request.embedding,
      hasImageBase64: !!request.imageBase64,
      errorCategory: categorized.category,
    });
    throw categorized;
  }
}

/**
 * Checks if confidence is below threshold.
 *
 * @param confidence - Confidence score from 0 to 1
 * @param threshold - Confidence threshold (default 0.55)
 * @returns True if confidence is low
 */
export function isLowConfidence(confidence: number, threshold: number = 0.55): boolean {
  return confidence < threshold;
}

