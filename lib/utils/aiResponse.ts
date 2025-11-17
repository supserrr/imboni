import { MoondreamResponse } from '../services/moondream';

/**
 * Formats Moondream response into conversational, friendly text.
 *
 * @param analysis - Moondream analysis response
 * @param verbosity - Response verbosity level
 * @returns Formatted conversational response
 */
export function formatAIResponse(
  analysis: MoondreamResponse,
  verbosity: 'detailed' | 'concise' = 'detailed'
): string {
  let response = '';

  // Start with a friendly acknowledgment
  if (analysis.description) {
    if (verbosity === 'detailed') {
      response = `Let me take a closer look... ${analysis.description}`;
    } else {
      response = analysis.description;
    }
  }

  // Add text recognition if available
  if (analysis.text && analysis.text.trim()) {
    if (response) {
      response += ` I can see some text: ${analysis.text}`;
    } else {
      response = `I can see text that says: ${analysis.text}`;
    }
  }

  // Add object identification if available
  if (analysis.objects && analysis.objects.length > 0) {
    const objectsList = analysis.objects.join(', ');
    if (response) {
      response += ` I can identify: ${objectsList}`;
    } else {
      response = `I can see: ${objectsList}`;
    }
  }

  // Add safety cues if detected
  if (analysis.safety_cues && analysis.safety_cues.length > 0) {
    response += ` Important: ${analysis.safety_cues.join('. ')}`;
  }

  // If no description, provide a helpful response
  if (!response) {
    response = "I'm looking at the scene, but I'm having trouble making out the details. Could you describe what you're trying to see?";
  }

  // Make it conversational and supportive
  response = makeConversational(response);

  return response;
}

/**
 * Makes text more conversational and friendly.
 *
 * @param text - Raw text
 * @returns Conversational text
 */
function makeConversational(text: string): string {
  // Add friendly transitions
  let conversational = text;

  // Replace formal phrases with friendly ones
  conversational = conversational.replace(/I can see/g, "I see");
  conversational = conversational.replace(/I can identify/g, "I notice");
  conversational = conversational.replace(/there is/g, "there's");
  conversational = conversational.replace(/there are/g, "there're");

  // Ensure it ends with a helpful tone
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
  if (analysis.objects && analysis.objects.length > 0) {
    return `Would you like me to tell you more about the ${analysis.objects[0]}?`;
  }

  if (analysis.text) {
    return 'Would you like me to read more of the text?';
  }

  return null;
}

