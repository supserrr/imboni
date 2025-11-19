import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/app-store';
import { useVolunteerRouting } from '@/hooks/use-volunteer-routing';

export type HelpRequest = {
  id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled';
  assigned_volunteer: string | null;
  created_at: string;
  updated_at?: string;
};

export const useHelpRequest = () => {
  const { user } = useAppStore();
  const { findBestVolunteer } = useVolunteerRouting();
  const [activeRequest, setActiveRequest] = useState<HelpRequest | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<HelpRequest | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to help_requests changes with better filtering
    const channel = supabase
      .channel(`help_requests:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'help_requests',
          filter: user.user_metadata?.type === 'blind' 
            ? `user_id=eq.${user.id}`
            : `assigned_volunteer=eq.${user.id}`,
        },
        (payload) => {
          const newRequest = payload.new as HelpRequest;
          
          // If user is blind, update their active request status
          if (newRequest.user_id === user.id) {
            setActiveRequest(newRequest);
          }
          
          // If user is volunteer, check if they are assigned and request is pending
          if (user.user_metadata?.type === 'volunteer') {
             if (newRequest.assigned_volunteer === user.id && newRequest.status === 'pending') {
                 setIncomingRequest(newRequest);
             } else if (newRequest.assigned_volunteer !== user.id || newRequest.status !== 'pending') {
                 // Clear incoming request if it's no longer assigned to us or not pending
                 setIncomingRequest(null);
             }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to help requests channel');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const createRequest = async () => {
    if (!user) return;
    
    // Find best available volunteer
    const bestVolunteerId = await findBestVolunteer();
    
    if (!bestVolunteerId) {
      throw new Error('No volunteers available at this time');
    }
    
    // Create request with assigned volunteer
    const { data, error } = await supabase
      .from('help_requests')
      .insert({ 
        user_id: user.id, 
        status: 'pending',
        assigned_volunteer: bestVolunteerId
      })
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
      
      // Update request status to accepted
      const { error } = await supabase
          .from('help_requests')
          .update({ status: 'accepted' })
          .eq('id', requestId)
          .eq('assigned_volunteer', user.id);
      
      if (error) throw error;
      
      // Update volunteer behavior - increment accept count and update last active
      const { data: behavior } = await supabase
        .from('volunteer_behavior')
        .select('accept_count')
        .eq('volunteer_id', user.id)
        .single();
      
      if (behavior) {
        await supabase
          .from('volunteer_behavior')
          .update({
            accept_count: (behavior.accept_count || 0) + 1,
            last_active: new Date().toISOString(),
          })
          .eq('volunteer_id', user.id);
      }
  };

  const declineRequest = async (requestId: string) => {
      if (!user) return;
      
      // Get the request to check if we're assigned
      const { data: request } = await supabase
        .from('help_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (!request || request.assigned_volunteer !== user.id) {
        return; // Not assigned to this volunteer
      }
      
      // Find next best volunteer (excluding current one)
      const nextVolunteerId = await findBestVolunteer(user.id);
      
      if (nextVolunteerId) {
        // Re-assign to next best volunteer
        const { error } = await supabase
          .from('help_requests')
          .update({ assigned_volunteer: nextVolunteerId })
          .eq('id', requestId);
        
        if (error) throw error;
        
        // Update volunteer behavior - increment decline count
        const { error: declineError } = await supabase.rpc('increment_decline_count', { 
          volunteer_id: user.id 
        });
        
        if (declineError) {
          console.error('Error incrementing decline count:', declineError);
          // Fallback: update directly
          const { data: behavior } = await supabase
            .from('volunteer_behavior')
            .select('decline_count')
            .eq('volunteer_id', user.id)
            .single();
          
          if (behavior) {
            await supabase
              .from('volunteer_behavior')
              .update({ decline_count: (behavior.decline_count || 0) + 1 })
              .eq('volunteer_id', user.id);
          }
        }
      } else {
        // No more volunteers available, mark as declined
        const { error } = await supabase
          .from('help_requests')
          .update({ status: 'declined' })
          .eq('id', requestId);
        
        if (error) throw error;
      }
      
      setIncomingRequest(null);
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

