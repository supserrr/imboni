import { supabase } from '@/lib/supabase';

interface VolunteerScore {
  id: string;
  score: number;
}

export const useVolunteerRouting = () => {
  // Weights
  const WEIGHTS = {
    AVAILABILITY: 100,
    RATING: 20,
    RESPONSE: 10,
    SUCCESS: 5,
    DECLINE_PENALTY: 15,
  };

  const findBestVolunteer = async (excludeVolunteerId?: string) => {
    // Fetch available volunteers
    let query = supabase
      .from('users')
      .select(`
        id,
        rating,
        availability,
        volunteer_behavior (
          response_time_avg,
          success_sessions,
          decline_count,
          accept_count
        )
      `)
      .eq('type', 'volunteer')
      .eq('availability', true);
    
    // Exclude specific volunteer if provided (for re-routing)
    if (excludeVolunteerId) {
      query = query.neq('id', excludeVolunteerId);
    }
    
    const { data: volunteers, error } = await query;

    if (error || !volunteers) {
      console.error('Error fetching volunteers:', error);
      return null;
    }

    // Calculate scores
    const scoredVolunteers: VolunteerScore[] = volunteers.map((v) => {
      const behavior = v.volunteer_behavior as any; // Type assertion for simplicity
      const isAvailable = v.availability ? 1 : 0;
      const rating = v.rating || 5.0;
      const responseSpeed = behavior?.response_time_avg ? (1 / behavior.response_time_avg) * 100 : 0; // Higher is better
      const successSessions = behavior?.success_sessions || 0;
      const totalRequests = (behavior?.accept_count || 0) + (behavior?.decline_count || 0);
      const declineRate = totalRequests > 0 ? (behavior?.decline_count || 0) / totalRequests : 0;

      const score =
        WEIGHTS.AVAILABILITY * isAvailable +
        WEIGHTS.RATING * rating +
        WEIGHTS.RESPONSE * responseSpeed +
        WEIGHTS.SUCCESS * successSessions -
        WEIGHTS.DECLINE_PENALTY * declineRate;

      return { id: v.id, score };
    });

    // Sort by score descending
    scoredVolunteers.sort((a, b) => b.score - a.score);

    return scoredVolunteers.length > 0 ? scoredVolunteers[0].id : null;
  };

  return {
    findBestVolunteer,
  };
};

