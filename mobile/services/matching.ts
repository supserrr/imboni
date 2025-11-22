import { supabase } from './supabase';

export const MatchingService = {
  async createHelpRequest(userId: string) {
    const { data, error } = await supabase
      .from('help_requests')
      .insert({ user_id: userId, status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async findBestVolunteer(excludeIds: string[] = []) {
    // Logic:
    // 1. Get available volunteers
    // 2. Sort by a score calculated from reliability and response time
    // 3. Exclude declined volunteers
    
    let query = supabase
      .from('users')
      .select(`
        id, 
        rating, 
        reliability_score,
        volunteer_behavior (
          response_time_avg
        )
      `)
      .eq('type', 'volunteer')
      .eq('availability', true);

    // Only add exclusion filter if there are IDs to exclude
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: volunteers, error } = await query.limit(10);

    if (error) throw error;
    
    if (!volunteers || volunteers.length === 0) return null;

    // Simple scoring algorithm
    // Score = Reliability (0-100) - ResponseTime (seconds) * 0.5 + Rating * 10
    const scoredVolunteers = volunteers.map(v => {
      const behavior = Array.isArray(v.volunteer_behavior) ? v.volunteer_behavior[0] : v.volunteer_behavior;
      const responseTime = behavior?.response_time_avg || 30; // Default 30s
      const score = (v.reliability_score || 100) - (responseTime * 0.5) + ((v.rating || 5) * 10);
      return { ...v, score };
    });

    scoredVolunteers.sort((a, b) => b.score - a.score);

    return scoredVolunteers[0];
  },

  async assignVolunteer(requestId: string, volunteerId: string) {
    const { error } = await supabase
      .from('help_requests')
      .update({ assigned_volunteer: volunteerId })
      .eq('id', requestId);

    if (error) throw error;
  },

  async declineRequest(requestId: string, volunteerId: string) {
    // 1. Update request to pending again (remove assignment) or keep it assigned but marked declined?
    // Usually, we want to find a NEW volunteer.
    // So we unassign the current one.
    
    // Also need to call the increment_decline_count function
    await supabase.rpc('increment_decline_count', { volunteer_id: volunteerId });

    const { error } = await supabase
      .from('help_requests')
      .update({ assigned_volunteer: null }) // Set back to null to trigger new search or handled by client
      .eq('id', requestId);

    if (error) throw error;
  },
};

