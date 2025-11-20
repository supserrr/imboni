import { supabase } from '@/lib/supabase';

export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
};

export const updateUserStatus = async (userId: string, availability: boolean) => {
  const { data, error } = await supabase.from('users').update({ availability }).eq('id', userId).select();
  if (error) throw error;
  return data;
};

export interface VoicePreferences {
  preferred_language: string;
  preferred_speaker: string;
  preferred_speed: number;
}

export const updateVoicePreferences = async (
  userId: string,
  preferences: VoicePreferences
) => {
  const { data, error } = await supabase
    .from('users')
    .update(preferences)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

