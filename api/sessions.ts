import { supabase } from '@/lib/supabase';

export const createSession = async (requestId: string, userId: string, volunteerId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ help_request_id: requestId, user_id: userId, volunteer_id: volunteerId })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const endSession = async (sessionId: string, duration: number) => {
  const { error } = await supabase
    .from('sessions')
    .update({ ended_at: new Date().toISOString(), duration })
    .eq('id', sessionId);
  if (error) throw error;
};

