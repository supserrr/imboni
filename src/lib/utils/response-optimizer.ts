/**
 * Optimizes Moondream responses for TTS to reduce ElevenLabs credit usage
 * by condensing verbose responses while preserving key information
 */

export interface ResponseOptimizerOptions {
  maxLength?: number // Maximum characters for TTS (default: 250)
  preserveImportant?: boolean // Whether to preserve important details (default: true)
}

/**
 * Condenses a Moondream response for TTS while preserving key information
 * @param response - The original Moondream response
 * @param options - Optimization options
 * @returns Condensed response optimized for TTS
 */
export function optimizeResponseForTTS(
  response: string,
  options: ResponseOptimizerOptions = {}
): string {
  const {
    maxLength = 250, // Default to 250 chars - good balance between info and cost
    preserveImportant = true,
  } = options

  if (!response || response.trim().length === 0) {
    return response
  }

  // If response is already short enough, return as-is
  if (response.length <= maxLength) {
    return response
  }

  let optimized = response.trim()

  // Remove common verbose phrases that don't add value
  const verbosePatterns = [
    /I can see that /gi,
    /In the image,? /gi,
    /Looking at the image,? /gi,
    /From what I can see,? /gi,
    /It appears that /gi,
    /It seems that /gi,
    /I notice that /gi,
    /I observe that /gi,
    /The image shows that /gi,
    /Based on the image,? /gi,
    /In this image,? /gi,
    /This image contains /gi,
    /This image shows /gi,
    /The image contains /gi,
    /The image displays /gi,
    /There is a /gi,
    /There are /gi,
    /There appears to be /gi,
    /There seems to be /gi,
    /I can observe /gi,
    /I can notice /gi,
  ]

  // Apply verbose pattern removals
  for (const pattern of verbosePatterns) {
    optimized = optimized.replace(pattern, '')
  }

  // Remove redundant filler words at the start
  optimized = optimized.replace(/^(Well,? |So,? |Now,? |Also,? |Additionally,? |Furthermore,? )/gi, '')

  // Remove excessive whitespace
  optimized = optimized.replace(/\s+/g, ' ').trim()

  // If still too long, intelligently truncate
  if (optimized.length > maxLength) {
    // Try to find a good sentence boundary to cut at
    const sentences = optimized.match(/[^.!?]+[.!?]+/g) || []
    
    if (sentences.length > 0) {
      let truncated = ''
      for (const sentence of sentences) {
        if ((truncated + sentence).length <= maxLength) {
          truncated += sentence
        } else {
          break
        }
      }
      
      // If we have at least one complete sentence, use it
      if (truncated.length > 0) {
        optimized = truncated.trim()
      } else {
        // Fallback: truncate at word boundary
        optimized = optimized.substring(0, maxLength - 3)
        const lastSpace = optimized.lastIndexOf(' ')
        if (lastSpace > maxLength * 0.7) { // Only use word boundary if it's not too early
          optimized = optimized.substring(0, lastSpace)
        }
        optimized += '...'
      }
    } else {
      // No sentence boundaries, truncate at word boundary
      optimized = optimized.substring(0, maxLength - 3)
      const lastSpace = optimized.lastIndexOf(' ')
      if (lastSpace > maxLength * 0.7) {
        optimized = optimized.substring(0, lastSpace)
      }
      optimized += '...'
    }
  }

  // Final cleanup
  optimized = optimized.replace(/\s+/g, ' ').trim()
  
  // Ensure we didn't create an empty string
  if (optimized.length === 0) {
    // Fallback: return first maxLength chars
    return response.substring(0, maxLength - 3) + '...'
  }

  return optimized
}

/**
 * Estimates the cost savings from optimization
 * @param original - Original response
 * @param optimized - Optimized response
 * @returns Percentage reduction in characters
 */
export function calculateOptimizationSavings(original: string, optimized: string): number {
  if (!original || original.length === 0) return 0
  const reduction = original.length - optimized.length
  return Math.round((reduction / original.length) * 100)
}

/**
 * Enhances a user question/prompt to encourage concise responses from Moondream
 * This helps reduce response length at the source
 * @param question - The original user question
 * @param requestConcise - Whether to request concise responses (default: true)
 * @returns Enhanced question with concise request if needed
 */
export function enhancePromptForConciseResponse(
  question: string,
  requestConcise: boolean = true
): string {
  if (!question || !requestConcise) {
    return question
  }

  // Check if question already asks for brief/concise responses
  const hasConciseRequest = /brief|briefly|concise|short|quick|summar/i.test(question)
  
  if (hasConciseRequest) {
    // Already requests concise response, return as-is
    return question
  }

  // Append a request for concise response
  // Use a natural-sounding addition that doesn't feel forced
  return `${question.trim()}. Please respond concisely.`
}

