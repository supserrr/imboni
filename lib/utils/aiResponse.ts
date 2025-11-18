import { MoondreamResponse } from '../services/vision/moondreamReasoning';

/**
 * Formats Moondream response into conversational, friendly text.
 *
 * @param analysis - Moondream analysis response
 * @param verbosity - Response verbosity level
 * @param isLowConfidence - Whether the confidence is low
 * @returns Formatted conversational response
 */
export function formatAIResponse(
  analysis: MoondreamResponse,
  verbosity: 'detailed' | 'concise' = 'detailed',
  isLowConfidence: boolean = false
): string {
  const parts: string[] = [];

  // Handle low confidence first - gentle, safe messaging
  if (isLowConfidence) {
    if (analysis.description) {
      parts.push(`I'm not completely sure, but ${analysis.description}`);
    } else {
      parts.push("I'm having trouble making out what's here. Let me try to get a better view.");
    }
    
    parts.push("If you'd like, I can connect you with a volunteer to confirm.");
    return parts.join(' ');
  }

  // Normal confidence responses - friendly and conversational
  // Vary the opening based on what information we have
  const hasDescription = !!analysis.description;
  const hasText = !!(analysis.text && analysis.text.trim());
  const hasObjects = !!(analysis.objects && analysis.objects.length > 0);
  const hasSafety = !!(analysis.safety_cues && analysis.safety_cues.length > 0);

  // Start with description if available - use varied phrasings
  if (hasDescription) {
    const openingPhrases = [
      '',
      'Noticing',
      'I see',
      'There\'s',
      'Spotting',
    ];
    const opening = openingPhrases[Math.floor(Math.random() * openingPhrases.length)];
    
    const descriptionVariations = [
      analysis.description,
      `looks like ${analysis.description}`,
      `appears to be ${analysis.description}`,
      analysis.description,
    ];
    const descriptionPhrase = descriptionVariations[Math.floor(Math.random() * descriptionVariations.length)];
    
    if (verbosity === 'detailed') {
      if (opening) {
        parts.push(`${opening} ${descriptionPhrase}`);
      } else {
        parts.push(descriptionPhrase);
      }
    } else {
      parts.push(descriptionPhrase);
    }
  }

  // Add text recognition - vary phrasing to avoid repetition
  if (hasText) {
    const textPhrases = [
      `There's text here that reads: "${analysis.text}"`,
      `The text says: "${analysis.text}"`,
      `I notice text: "${analysis.text}"`,
    ];
    const textPhrase = analysis.text.length > 50
      ? (hasDescription ? "There's also some text. Want me to read it?" : "There's text here. Should I read it?")
      : textPhrases[Math.floor(Math.random() * textPhrases.length)];
    
    parts.push(textPhrase);
  }

  // Add object identification - use varied structures
  if (hasObjects) {
    const objectsList = analysis.objects.length === 1 
      ? analysis.objects[0] 
      : analysis.objects.slice(0, -1).join(', ') + ', and ' + analysis.objects[analysis.objects.length - 1];
    
    const objectPhrases = [
      `Noticing ${objectsList} here`,
      `There are ${objectsList} in view`,
      `${objectsList} are visible`,
    ];
    const objectPhrase = objectPhrases[Math.floor(Math.random() * objectPhrases.length)];
    parts.push(objectPhrase);
  }

  // Add safety cues - clear and calm
  if (hasSafety) {
    const safetyMessage = analysis.safety_cues.join(', ');
    parts.push(`Just a heads up: ${safetyMessage}`);
  }

  // If no information, provide helpful response
  if (parts.length === 0) {
    return "I'm looking at the scene, but the details aren't clear. Could you tell me what you're trying to see, or would you like me to try again?";
  }

  // Combine parts naturally with varied connectors
  let response = parts.join('. ');

  // Add follow-up question for better interaction - but vary when it appears
  const followUp = generateFollowUpQuestion(analysis);
  if (followUp && verbosity === 'detailed') {
    // Sometimes add follow-up, sometimes don't (70% chance to avoid repetition)
    if (Math.random() > 0.3) {
      response += `. ${followUp}`;
    }
  }

  // Remove repeated words and phrases
  response = removeRepetition(response);

  // Make it conversational and supportive
  response = makeConversational(response);

  // Log the final response for debugging/testing
  console.log('[AI Response]', response);
  console.log('[AI Response Details]', {
    hasDescription,
    hasText,
    hasObjects,
    hasSafety,
    isLowConfidence,
    verbosity,
    originalDescription: analysis.description?.substring(0, 100),
  });

  return response;
}

/**
 * Removes repeated words and phrases within a response.
 *
 * @param text - Input text
 * @returns Text with repetition removed
 */
function removeRepetition(text: string): string {
  // Remove duplicate consecutive words (e.g., "text text" -> "text")
  let result = text.replace(/\b(\w+)\s+\1\b/gi, '$1');
  
  // Remove common repetitive phrases
  const repetitivePhrases = [
    /\b(I can see|I see)\s+\1/gi,
    /\b(text that says|text says)\s+\1/gi,
    /\b(you can see|you see)\s+\1/gi,
  ];
  
  for (const pattern of repetitivePhrases) {
    result = result.replace(pattern, (match) => {
      const parts = match.split(/\s+/);
      // Keep unique words only
      const unique = parts.filter((word, index, arr) => arr.indexOf(word) === index);
      return unique.join(' ');
    });
  }
  
  // Remove duplicate consecutive sentences (very simplified check)
  const sentences = result.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 1) {
    const uniqueSentences: string[] = [];
    const seenNormalized: Set<string> = new Set();
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      // Normalize for comparison (lowercase, remove extra spaces)
      const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
      
      // Only add if not too similar to previous sentences
      if (!seenNormalized.has(normalized)) {
        // Check similarity to previous sentence (don't add if >70% similar)
        let isTooSimilar = false;
        if (uniqueSentences.length > 0) {
          const lastNormalized = uniqueSentences[uniqueSentences.length - 1]
            .toLowerCase().replace(/\s+/g, ' ');
          const lastWords = lastNormalized.split(/\s+/).filter(w => w.length > 3);
          const currentWords = normalized.split(/\s+/).filter(w => w.length > 3);
          
          if (lastWords.length > 0 && currentWords.length > 0) {
            const commonWords = currentWords.filter(w => lastWords.includes(w)).length;
            const similarity = commonWords / Math.max(lastWords.length, currentWords.length);
            
            if (similarity > 0.7) {
              isTooSimilar = true;
            }
          }
        }
        
        if (!isTooSimilar) {
          uniqueSentences.push(trimmed);
          seenNormalized.add(normalized);
        }
      }
    }
    
    result = uniqueSentences.join('. ').trim();
  }
  
  // Clean up
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/\.{2,}/g, '.');
  result = result.replace(/\s+\./g, '.');
  
  return result.trim();
}

/**
 * Makes text more conversational and friendly.
 *
 * @param text - Raw text
 * @returns Conversational text
 */
function makeConversational(text: string): string {
  let conversational = text;

  // Replace formal or repetitive phrases with varied, friendly ones
  conversational = conversational.replace(/I can see/gi, (match, offset) => {
    // Vary replacement based on position
    if (offset === 0) return 'I see';
    const alternatives = ['There\'s', 'Noticing', 'Spotting'];
    return alternatives[Math.floor(Math.random() * alternatives.length)];
  });
  
  conversational = conversational.replace(/I can also see/gi, 'Also');
  conversational = conversational.replace(/I can identify/gi, 'Noticing');
  conversational = conversational.replace(/\bthere is\b/gi, "there's");
  conversational = conversational.replace(/\bthere are\b/gi, "there're");
  
  // Avoid repeating "see" too many times
  const seeCount = (conversational.match(/\bsee\b/gi) || []).length;
  if (seeCount > 2) {
    conversational = conversational.replace(/\bsee\b/gi, (match, offset) => {
      if (offset === conversational.toLowerCase().indexOf('see')) return 'see'; // Keep first one
      const alternatives = ['spot', 'notice', 'observe', 'view'];
      return alternatives[Math.floor(Math.random() * alternatives.length)];
    });
  }

  // Clean up multiple spaces and periods
  conversational = conversational.replace(/\s+/g, ' ');
  conversational = conversational.replace(/\.{2,}/g, '.');
  conversational = conversational.replace(/\s+\./g, '.');

  // Ensure it ends with appropriate punctuation
  conversational = conversational.trim();
  if (!conversational.endsWith('.') && !conversational.endsWith('?') && !conversational.endsWith('!')) {
    conversational += '.';
  }

  return conversational;
}

/**
 * Generates a helpful follow-up question based on analysis.
 *
 * @param analysis - Moondream analysis response
 * @returns Follow-up question or null
 */
export function generateFollowUpQuestion(analysis: MoondreamResponse): string | null {
  // Prioritize text questions as they're more actionable
  if (analysis.text && analysis.text.length > 50) {
    const questions = [
      'Want me to read the full text?',
      'Should I read all of it?',
      'Would you like the full text read?',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  if (analysis.text && analysis.text.length <= 50) {
    // Short text was already read, no follow-up needed
    return null;
  }

  // Object-based questions - vary phrasing
  if (analysis.objects && analysis.objects.length > 0) {
    const firstObject = analysis.objects[0];
    const objLower = firstObject.toLowerCase();
    
    if (objLower.includes('box') || objLower.includes('package') || objLower.includes('container')) {
      const questions = [
        `Want me to read the label on that ${firstObject}?`,
        `Should I check the label?`,
        `Would you like me to read what's on it?`,
      ];
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    if (objLower.includes('sign') || objLower.includes('board') || objLower.includes('poster')) {
      const questions = [
        `Want me to read what's on that ${firstObject}?`,
        `Should I read the ${firstObject}?`,
        `Want the text from it?`,
      ];
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    const questions = [
      `Want to know more about the ${firstObject}?`,
      `Anything specific about that ${firstObject}?`,
      `Should I focus on the ${firstObject}?`,
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  // Default helpful question if we have a description - vary phrasing
  if (analysis.description) {
    const questions = [
      'Anything specific you want me to check?',
      'What else should I look at?',
      'Want me to focus on something specific?',
      'Anything particular you\'re curious about?',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  return null;
}

