import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase client configuration.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Creates and returns a Supabase client instance.
 *
 * @returns Configured Supabase client.
 */
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

/**
 * Default Supabase client instance.
 */
export const supabase = createSupabaseClient();

/**
 * Setup WebRTC connection for video calls.
 * Note: This is a placeholder - actual WebRTC implementation should be in WebRTCClient.ts
 *
 * @param sessionId - The session ID for the call.
 * @param isInitiator - Whether this client is the initiator.
 * @returns Promise resolving to connection object or null.
 */
export async function setupWebRTCConnection(
  sessionId: string,
  isInitiator: boolean
): Promise<any | null> {
  try {
    const { setupWebRTCConnection: setupConnection } = await import('./WebRTCClient');
    return await setupConnection(sessionId, isInitiator);
  } catch (error) {
    console.error('Error setting up WebRTC connection:', error);
    return null;
  }
}

export interface VolunteerScore {
  volunteerId: string;
  score: number;
  responseTime: number;
  currentLoad: number;
  rating: number;
}

export interface HelpRequestParams {
  userId: string;
  confidence: number;
  tags?: string[];
}

export interface RankedVolunteer {
  volunteerId: string;
  score: number;
  rating: number;
  currentLoad: number;
  responseTime: number;
}

/**
 * Edge function to select the best available volunteer.
 * Returns ranked list of top volunteers for retry logic.
 *
 * @param params - Help request parameters.
 * @returns Promise resolving to ranked list of volunteers (top 5).
 */
export async function selectBestVolunteer(
  params: HelpRequestParams
): Promise<RankedVolunteer[]> {
  try {
    const { data, error } = await supabase.functions.invoke('select-best-volunteer', {
      body: params,
    });

    if (error) {
      console.error('Error selecting volunteer:', error);
      return [];
    }

    if (data?.volunteers && Array.isArray(data.volunteers)) {
      return data.volunteers.slice(0, 5);
    }

    if (data?.volunteerId) {
      return [{
        volunteerId: data.volunteerId,
        score: data.score || 0,
        rating: data.rating || 0,
        currentLoad: data.currentLoad || 0,
        responseTime: data.responseTime || 0,
      }];
    }

    return [];
  } catch (error) {
    console.error('Error calling select-best-volunteer function:', error);
    return [];
  }
}

/**
 * Gets the top volunteer ID from ranked list (for backward compatibility).
 *
 * @param params - Help request parameters.
 * @returns Promise resolving to the selected volunteer ID or null.
 */
export async function getBestVolunteerId(
  params: HelpRequestParams
): Promise<string | null> {
  const ranked = await selectBestVolunteer(params);
  return ranked.length > 0 ? ranked[0].volunteerId : null;
}

/**
 * Selects an available volunteer using client-side scoring as fallback.
 *
 * @param userId - The ID of the user requesting help.
 * @param confidence - The AI confidence score.
 * @param tags - Optional tags for matching.
 * @returns Promise resolving to the selected volunteer ID or null.
 */
export async function selectAvailableVolunteer(
  userId: string,
  confidence?: number,
  tags?: string[]
): Promise<string | null> {
  try {
    const volunteerId = await selectBestVolunteer({
      userId,
      confidence: confidence ?? 0,
      tags,
    });

    if (volunteerId) {
      return volunteerId;
    }

    const { data: volunteers, error } = await supabase
      .from('volunteers')
      .select('id, rating, current_load, last_response_time')
      .eq('is_online', true)
      .order('rating', { ascending: false })
      .limit(10);

    if (error || !volunteers || volunteers.length === 0) {
      console.error('Error fetching volunteers:', error);
      return null;
    }

    const now = Date.now();
    const scoredVolunteers: VolunteerScore[] = volunteers.map((vol) => {
      const responseTime = vol.last_response_time
        ? now - new Date(vol.last_response_time).getTime()
        : Infinity;
      
      const loadScore = 1 / (1 + (vol.current_load || 0));
      const ratingScore = vol.rating || 0;
      const responseScore = responseTime < 60000 ? 1 : Math.max(0, 1 - responseTime / 600000);

      const score = ratingScore * 0.4 + loadScore * 0.3 + responseScore * 0.3;

      return {
        volunteerId: vol.id,
        score,
        responseTime,
        currentLoad: vol.current_load || 0,
        rating: vol.rating || 0,
      };
    });

    scoredVolunteers.sort((a, b) => b.score - a.score);

    return scoredVolunteers[0]?.volunteerId || null;
  } catch (error) {
    console.error('Error selecting volunteer:', error);
    return null;
  }
}

/**
 * Creates a new help request.
 *
 * @param userId - The ID of the user requesting help.
 * @param volunteerId - The ID of the assigned volunteer.
 * @param confidence - The AI confidence score.
 * @returns Promise resolving to the help request ID or null.
 */
export async function createHelpRequest(
  userId: string,
  volunteerId: string,
  confidence: number
): Promise<string | null> {
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        volunteer_id: volunteerId,
        status: 'pending',
        ai_confidence: confidence,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError || !sessionData) {
      console.error('Error creating session:', sessionError);
      return null;
    }

    const { data: requestData, error: requestError } = await supabase
      .from('help_requests')
      .insert({
        user_id: userId,
        volunteer_id: volunteerId,
        session_id: sessionData.id,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating help request:', requestError);
      return null;
    }

    return requestData.id;
  } catch (error) {
    console.error('Error creating help request:', error);
    return null;
  }
}

/**
 * Creates a new help session (legacy compatibility).
 *
 * @param userId - The ID of the user requesting help.
 * @param volunteerId - The ID of the assigned volunteer.
 * @returns Promise resolving to the session ID or null.
 */
export async function createHelpSession(
  userId: string,
  volunteerId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        volunteer_id: volunteerId,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

/**
 * Ends a help session.
 *
 * @param sessionId - The ID of the session to end.
 * @returns Promise resolving to success status.
 */
export async function endHelpSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('Error ending session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error ending session:', error);
    return false;
  }
}

/**
 * Logs an AI interaction.
 *
 * @param userId - The ID of the user.
 * @param query - The user's query.
 * @param response - The AI's response.
 * @param confidence - The confidence score.
 * @returns Promise resolving to success status.
 */
export async function logAIInteraction(
  userId: string,
  query: string,
  response: string,
  confidence: number
): Promise<boolean> {
  try {
    const { error } = await supabase.from('ai_logs').insert({
      user_id: userId,
      query,
      response,
      confidence,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error logging AI interaction:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging AI interaction:', error);
    return false;
  }
}

/**
 * Logs volunteer activity.
 *
 * @param volunteerId - The ID of the volunteer.
 * @param action - The action performed.
 * @param metadata - Optional metadata about the action.
 * @returns Promise resolving to success status.
 */
export async function logVolunteerActivity(
  volunteerId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabase.from('volunteer_activity').insert({
      volunteer_id: volunteerId,
      action,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('Error logging volunteer activity:', error);
      return false;
    }

    await supabase
      .from('volunteers')
      .update({ last_response_time: new Date().toISOString() })
      .eq('id', volunteerId);

    return true;
  } catch (error) {
    console.error('Error logging volunteer activity:', error);
    return false;
  }
}

/**
 * Updates volunteer load.
 *
 * @param volunteerId - The ID of the volunteer.
 * @param delta - The change in load (+1 for new session, -1 for ended session).
 * @returns Promise resolving to success status.
 */
export async function updateVolunteerLoad(
  volunteerId: string,
  delta: number
): Promise<boolean> {
  try {
    const { data: volunteer, error: fetchError } = await supabase
      .from('volunteers')
      .select('current_load')
      .eq('id', volunteerId)
      .single();

    if (fetchError || !volunteer) {
      console.error('Error fetching volunteer:', fetchError);
      return false;
    }

    const newLoad = Math.max(0, (volunteer.current_load || 0) + delta);

    const { error } = await supabase
      .from('volunteers')
      .update({ current_load: newLoad })
      .eq('id', volunteerId);

    if (error) {
      console.error('Error updating volunteer load:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating volunteer load:', error);
    return false;
  }
}
