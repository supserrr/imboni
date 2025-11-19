import { supabase } from '@/lib/supabase';

export const getPendingRequests = async () => {
  const { data, error } = await supabase
    .from('help_requests')
    .select('*')
    .eq('status', 'pending');
  if (error) throw error;
  return data;
};

