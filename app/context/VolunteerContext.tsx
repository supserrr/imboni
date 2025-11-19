import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../utils/SupabaseClient';
import { useAuth } from './AuthContext';
import { logVolunteerActivity, updateVolunteerLoad } from '../utils/SupabaseClient';

export interface HelpRequest {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface CurrentCall {
  sessionId: string;
  userId: string;
  startTime: number;
}

interface VolunteerContextType {
  isOnline: boolean;
  helpRequests: HelpRequest[];
  currentCall: CurrentCall | null;
  toggleOnline: () => Promise<void>;
  goOnline: () => Promise<void>;
  goOffline: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  endCall: () => Promise<void>;
  trackAction: (action: string, metadata?: Record<string, any>) => Promise<void>;
}

const VolunteerContext = createContext<VolunteerContextType | undefined>(undefined);

export function VolunteerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [currentCall, setCurrentCall] = useState<CurrentCall | null>(null);
  const channelRef = useRef<any>(null);
  const acceptStartTimeRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (user?.role === 'volunteer' && isOnline) {
      const channel = subscribeToHelpRequests();
      channelRef.current = channel;

      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, [user, isOnline]);

  /**
   * Subscribes to real-time help requests.
   */
  function subscribeToHelpRequests() {
    if (!user) return null;

    const channel = supabase
      .channel(`help-requests-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'help_requests',
          filter: `volunteer_id=eq.${user.id}`,
        },
        async (payload) => {
          const newRequest: HelpRequest = {
            id: payload.new.id,
            userId: payload.new.user_id,
            sessionId: payload.new.session_id,
            timestamp: new Date(payload.new.created_at).getTime(),
            status: 'pending',
          };

          acceptStartTimeRef.current[newRequest.id] = Date.now();

          setHelpRequests((prev) => [...prev, newRequest]);

          if (user) {
            await logVolunteerActivity(user.id, 'request_received', {
              requestId: newRequest.id,
              sessionId: newRequest.sessionId,
              userId: newRequest.userId,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'help_requests',
          filter: `volunteer_id=eq.${user.id}`,
        },
        (payload) => {
          setHelpRequests((prev) =>
            prev.map((req) =>
              req.id === payload.new.id
                ? { ...req, status: payload.new.status }
                : req
            )
          );
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Toggles volunteer online/offline status.
   */
  async function toggleOnline(): Promise<void> {
    if (!user) return;

    try {
      const newStatus = !isOnline;
      const { error } = await supabase
        .from('volunteers')
        .upsert({
          id: user.id,
          is_online: newStatus,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) {
        console.error('Error updating volunteer status:', error);
        return;
      }

      setIsOnline(newStatus);

      await logVolunteerActivity(user.id, newStatus ? 'went_online' : 'went_offline', {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error toggling online status:', error);
    }
  }

  /**
   * Sets volunteer status to online.
   */
  async function goOnline(): Promise<void> {
    if (!user || isOnline) return;

    try {
      const { error } = await supabase
        .from('volunteers')
        .upsert({
          id: user.id,
          is_online: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) {
        console.error('Error going online:', error);
        return;
      }

      setIsOnline(true);

      await logVolunteerActivity(user.id, 'went_online', {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error going online:', error);
    }
  }

  /**
   * Sets volunteer status to offline.
   */
  async function goOffline(): Promise<void> {
    if (!user || !isOnline) return;

    try {
      const { error } = await supabase
        .from('volunteers')
        .upsert({
          id: user.id,
          is_online: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) {
        console.error('Error going offline:', error);
        return;
      }

      setIsOnline(false);

      await logVolunteerActivity(user.id, 'went_offline', {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error going offline:', error);
    }
  }

  /**
   * Tracks a volunteer action.
   *
   * @param action - The action performed.
   * @param metadata - Optional metadata about the action.
   */
  async function trackAction(
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!user) return;

    await logVolunteerActivity(user.id, action, metadata);
  }

  /**
   * Accepts a help request.
   *
   * @param requestId - The ID of the help request.
   */
  async function acceptRequest(requestId: string): Promise<void> {
    if (!user) return;

    try {
      const request = helpRequests.find((r) => r.id === requestId);
      if (!request) return;

      const responseTime = acceptStartTimeRef.current[requestId]
        ? Date.now() - acceptStartTimeRef.current[requestId]
        : 0;

      const { error } = await supabase
        .from('help_requests')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error accepting request:', error);
        return;
      }

      await supabase
        .from('sessions')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', request.sessionId);

      await logVolunteerActivity(user.id, 'request_accepted', {
        requestId,
        sessionId: request.sessionId,
        responseTime,
      });

      await updateVolunteerLoad(user.id, 1);

      setHelpRequests((prev) => prev.filter((r) => r.id !== requestId));
      delete acceptStartTimeRef.current[requestId];

      setCurrentCall({
        sessionId: request.sessionId,
        userId: request.userId,
        startTime: Date.now(),
      });
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  }

  /**
   * Declines a help request.
   *
   * @param requestId - The ID of the help request.
   */
  async function declineRequest(requestId: string): Promise<void> {
    if (!user) return;

    try {
      const responseTime = acceptStartTimeRef.current[requestId]
        ? Date.now() - acceptStartTimeRef.current[requestId]
        : 0;

      const { error } = await supabase
        .from('help_requests')
        .update({ 
          status: 'declined',
          declined_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error declining request:', error);
        return;
      }

      await logVolunteerActivity(user.id, 'request_declined', {
        requestId,
        responseTime,
      });

      setHelpRequests((prev) => prev.filter((r) => r.id !== requestId));
      delete acceptStartTimeRef.current[requestId];
    } catch (error) {
      console.error('Error declining request:', error);
    }
  }

  /**
   * Ends the current call.
   */
  async function endCall(): Promise<void> {
    if (!currentCall || !user) return;

    try {
      const duration = Date.now() - currentCall.startTime;

      await supabase
        .from('sessions')
        .update({ 
          status: 'ended', 
          ended_at: new Date().toISOString(),
        })
        .eq('id', currentCall.sessionId);

      await logVolunteerActivity(user.id, 'call_ended', {
        sessionId: currentCall.sessionId,
        duration,
      });

      await updateVolunteerLoad(user.id, -1);

      setCurrentCall(null);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  return (
    <VolunteerContext.Provider
      value={{
        isOnline,
        helpRequests,
        currentCall,
        toggleOnline,
        goOnline,
        goOffline,
        acceptRequest,
        declineRequest,
        endCall,
        trackAction,
      }}
    >
      {children}
    </VolunteerContext.Provider>
  );
}

/**
 * Hook to access the volunteer context.
 *
 * @returns The volunteer context value.
 */
export function useVolunteer() {
  const context = useContext(VolunteerContext);
  if (context === undefined) {
    throw new Error('useVolunteer must be used within a VolunteerProvider');
  }
  return context;
}
