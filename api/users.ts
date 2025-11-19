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

