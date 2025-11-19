import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/app-store';

export type HelpRequest = {
  id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled';
  assigned_volunteer: string | null;
  created_at: string;
};

export const useHelpRequest = () => {
  const { user } = useAppStore();
  const [activeRequest, setActiveRequest] = useState<HelpRequest | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<HelpRequest | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to help_requests changes
    const subscription = supabase
      .channel('help_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'help_requests',
        },
        (payload) => {
          const newRequest = payload.new as HelpRequest;
          
          // If user is blind, update their active request status
          if (newRequest.user_id === user.id) {
            setActiveRequest(newRequest);
          }
          
          // If user is volunteer, check if they are assigned or if it's a broadcast
          // For simplified routing, we might listen to all pending if we are online
          // Here assuming the routing logic assigns it or we see pending ones
          if (user.user_metadata?.type === 'volunteer') {
             if (newRequest.assigned_volunteer === user.id) {
                 setIncomingRequest(newRequest);
             } else if (newRequest.status === 'pending' && !newRequest.assigned_volunteer) {
                 // Potential match logic handled server-side or via routing hook
                 // But if we want to show "pending" to all:
                 // setIncomingRequest(newRequest);
             }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const createRequest = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('help_requests')
      .insert({ user_id: user.id, status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    setActiveRequest(data);
    return data;
  };

  const cancelRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('help_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    if (error) throw error;
    setActiveRequest(null);
  };

  const acceptRequest = async (requestId: string) => {
      if (!user) return;
      const { error } = await supabase
          .from('help_requests')
          .update({ status: 'accepted', assigned_volunteer: user.id })
          .eq('id', requestId);
      
      if (error) throw error;
  };

  const declineRequest = async (requestId: string) => {
      // Logic to re-route or mark as declined by this volunteer
      // For now just update status if assigned, or ignore locally
  };

  return {
    activeRequest,
    incomingRequest,
    createRequest,
    cancelRequest,
    acceptRequest,
    declineRequest
  };
};

