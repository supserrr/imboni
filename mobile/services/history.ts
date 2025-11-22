import { supabase } from './supabase';

export interface PastVolunteer {
  volunteer_id: string;
  volunteer_name: string;
  volunteer_rating: number;
  last_call_date: string;
  total_calls: number;
}

export const HistoryService = {
  /**
   * Get list of past volunteers for a user
   */
  async getPastVolunteers(userId: string): Promise<PastVolunteer[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('volunteer_id, started_at')
        .eq('user_id', userId)
        .not('volunteer_id', 'is', null)
        .order('started_at', { ascending: false });

      if (error) throw error;

      if (!sessions || sessions.length === 0) {
        return [];
      }

      // Get unique volunteer IDs
      const volunteerIds = [...new Set(sessions.map((s: any) => s.volunteer_id))];

      // Fetch volunteer details
      const { data: volunteers, error: volunteerError } = await supabase
        .from('users')
        .select('id, full_name, rating')
        .in('id', volunteerIds);

      if (volunteerError) throw volunteerError;

      // Create a map of volunteer details
      const volunteerMap = new Map<string, any>();
      volunteers?.forEach((v: any) => {
        volunteerMap.set(v.id, v);
      });

      // Group sessions by volunteer
      const resultMap = new Map<string, PastVolunteer>();

      sessions.forEach((session: any) => {
        const volunteerId = session.volunteer_id;
        const volunteer = volunteerMap.get(volunteerId);

        if (!volunteer) return;

        if (!resultMap.has(volunteerId)) {
          resultMap.set(volunteerId, {
            volunteer_id: volunteerId,
            volunteer_name: volunteer.full_name || 'Volunteer',
            volunteer_rating: volunteer.rating || 5.0,
            last_call_date: session.started_at,
            total_calls: 1,
          });
        } else {
          const existing = resultMap.get(volunteerId)!;
          existing.total_calls += 1;
          // Keep the most recent date
          if (new Date(session.started_at) > new Date(existing.last_call_date)) {
            existing.last_call_date = session.started_at;
          }
        }
      });

      return Array.from(resultMap.values()).sort(
        (a, b) => new Date(b.last_call_date).getTime() - new Date(a.last_call_date).getTime()
      );
    } catch (error) {
      console.error('Error fetching past volunteers:', error);
      throw error;
    }
  },

  /**
   * Get detailed history for a specific volunteer
   */
  async getVolunteerHistory(userId: string, volunteerId: string) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('volunteer_id', volunteerId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching volunteer history:', error);
      throw error;
    }
  },
};

