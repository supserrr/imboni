import { supabase } from './supabase';

export const SessionService = {
  async startSession(requestId: string, userId: string, volunteerId: string) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        help_request_id: requestId,
        user_id: userId,
        volunteer_id: volunteerId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async endSession(sessionId: string, durationSeconds: number, rating?: number) {
    const { error } = await supabase
      .from('sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration: durationSeconds,
        rating: rating,
      })
      .eq('id', sessionId);

    if (error) throw error;
    
    // Ideally trigger backend to update volunteer stats, but we can do it here if allowed by RLS
    // But 'volunteer_behavior' is updateable by system (or via RLS which I checked is 'ALL using true' but comment says 'In production this should be more restrictive')
    // I'll skip direct update of behavior stats here to keep it clean, assuming backend triggers or separate call if needed.
  },
};

