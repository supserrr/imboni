/**
 * Session context management for conversation history and user preferences.
 * Maintains context for both live and photo mode interactions.
 */

import { supabase } from '@/lib/supabase';
import { debug, info } from '@/lib/utils/logger';

/**
 * Conversation exchange.
 */
export interface ConversationExchange {
  userInput?: string;
  aiResponse?: string;
  confidence?: number;
  timestamp: number;
}

/**
 * User preferences from profile.
 */
export interface UserPreferences {
  language?: string;
  preferred_voice?: string;
  speech_rate?: number;
  verbosity_level?: 'detailed' | 'concise';
  confidence_threshold?: number;
}

/**
 * Session metadata.
 */
export interface SessionMetadata {
  sessionId: string;
  userId: string;
  startedAt: number;
  endedAt?: number;
  framesAnalyzed: number;
  averageConfidence: number;
  exchanges: ConversationExchange[];
}

/**
 * Session context manager.
 */
class SessionContextManager {
  private currentSession: SessionMetadata | null = null;
  private maxHistoryLength = 10;
  private preferences: UserPreferences | null = null;

  /**
   * Initializes a new session.
   *
   * @param userId - User ID
   * @param preferences - User preferences
   * @returns Session ID
   */
  startSession(userId: string, preferences: UserPreferences): string {
    const sessionId = `${userId}_${Date.now()}`;
    
    this.currentSession = {
      sessionId,
      userId,
      startedAt: Date.now(),
      framesAnalyzed: 0,
      averageConfidence: 0,
      exchanges: [],
    };

    this.preferences = preferences;

    info('AI session started', {
      sessionId,
      userId,
      preferences,
    });

    return sessionId;
  }

  /**
   * Stops the current session and saves to Supabase.
   *
   * @returns Promise that resolves when session is saved
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.endedAt = Date.now();

    try {
      // Save to Supabase ai_sessions table
      const { error } = await supabase.from('ai_sessions').insert({
        user_id: this.currentSession.userId,
        started_at: new Date(this.currentSession.startedAt).toISOString(),
        ended_at: this.currentSession.endedAt
          ? new Date(this.currentSession.endedAt).toISOString()
          : null,
        frames_analyzed: this.currentSession.framesAnalyzed,
        average_confidence: this.currentSession.averageConfidence,
      });

      if (error) {
        throw error;
      }

      info('AI session saved', {
        sessionId: this.currentSession.sessionId,
        framesAnalyzed: this.currentSession.framesAnalyzed,
        averageConfidence: this.currentSession.averageConfidence,
      });
    } catch (err) {
      debug('Failed to save AI session', {
        error: err,
        sessionId: this.currentSession.sessionId,
      });
    }

    this.currentSession = null;
  }

  /**
   * Adds a conversation exchange to history.
   *
   * @param userInput - Optional user input
   * @param aiResponse - Optional AI response
   * @param confidence - Optional confidence score
   */
  addExchange(userInput?: string, aiResponse?: string, confidence?: number): void {
    if (!this.currentSession) {
      return;
    }

    const exchange: ConversationExchange = {
      userInput,
      aiResponse,
      confidence,
      timestamp: Date.now(),
    };

    this.currentSession.exchanges.push(exchange);

    // Limit history length
    if (this.currentSession.exchanges.length > this.maxHistoryLength) {
      this.currentSession.exchanges.shift();
    }

    // Update average confidence
    if (confidence !== undefined) {
      const confidences = this.currentSession.exchanges
        .map((e) => e.confidence ?? 0)
        .filter((c) => c > 0);
      
      if (confidences.length > 0) {
        this.currentSession.averageConfidence =
          confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
      }
    }

    // Increment frames analyzed if this is a frame analysis
    if (aiResponse && !userInput) {
      this.currentSession.framesAnalyzed += 1;
    }
  }

  /**
   * Gets recent conversation context for reasoning.
   *
   * @returns Formatted context string
   */
  getContext(): string {
    if (!this.currentSession || this.currentSession.exchanges.length === 0) {
      return '';
    }

    // Get last 5 exchanges for context
    const recentExchanges = this.currentSession.exchanges.slice(-5);
    
    const formatted = recentExchanges
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

    return formatted;
  }

  /**
   * Gets conversation history.
   *
   * @returns Array of conversation exchanges
   */
  getHistory(): ConversationExchange[] {
    return this.currentSession?.exchanges || [];
  }

  /**
   * Gets current session metadata.
   *
   * @returns Session metadata or null if no active session
   */
  getSession(): SessionMetadata | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Gets user preferences.
   *
   * @returns User preferences or null
   */
  getPreferences(): UserPreferences | null {
    return this.preferences ? { ...this.preferences } : null;
  }

  /**
   * Updates user preferences.
   *
   * @param preferences - Updated preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    if (!this.preferences) {
      this.preferences = {};
    }
    this.preferences = { ...this.preferences, ...preferences };
  }

  /**
   * Clears the current session (without saving).
   */
  clear(): void {
    this.currentSession = null;
    this.preferences = null;
  }
}

/**
 * Global session context manager.
 */
const sessionContextManager = new SessionContextManager();

/**
 * Exported functions for session management.
 */
export function startSession(userId: string, preferences: UserPreferences): string {
  return sessionContextManager.startSession(userId, preferences);
}

export async function endSession(): Promise<void> {
  return sessionContextManager.endSession();
}

export function addExchange(userInput?: string, aiResponse?: string, confidence?: number): void {
  sessionContextManager.addExchange(userInput, aiResponse, confidence);
}

export function getContext(): string {
  return sessionContextManager.getContext();
}

export function getHistory(): ConversationExchange[] {
  return sessionContextManager.getHistory();
}

export function getSession(): SessionMetadata | null {
  return sessionContextManager.getSession();
}

export function getPreferences(): UserPreferences | null {
  return sessionContextManager.getPreferences();
}

export function updatePreferences(preferences: Partial<UserPreferences>): void {
  sessionContextManager.updatePreferences(preferences);
}

export function clearSession(): void {
  sessionContextManager.clear();
}

