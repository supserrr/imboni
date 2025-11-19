import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VolunteerScore {
  volunteerId: string;
  score: number;
  responseTime: number;
  currentLoad: number;
  rating: number;
}

interface HelpRequestParams {
  userId: string;
  confidence: number;
  tags?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { userId, confidence, tags = [] }: HelpRequestParams = await req.json();

    const { data: volunteers, error } = await supabaseClient
      .from('volunteers')
      .select('id, rating, current_load, last_response_time, tags')
      .eq('is_online', true);

    if (error || !volunteers || volunteers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No available volunteers' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const now = Date.now();
    const scoredVolunteers: VolunteerScore[] = volunteers.map((vol) => {
      const responseTime = vol.last_response_time
        ? now - new Date(vol.last_response_time).getTime()
        : Infinity;

      const loadScore = 1 / (1 + (vol.current_load || 0));
      const ratingScore = (vol.rating || 0) / 5.0;
      const responseScore =
        responseTime < 60000 ? 1 : Math.max(0, 1 - responseTime / 600000);

      let tagScore = 1.0;
      if (tags.length > 0 && vol.tags && Array.isArray(vol.tags)) {
        const matchingTags = tags.filter((tag) => vol.tags.includes(tag)).length;
        tagScore = matchingTags > 0 ? 1 + matchingTags * 0.1 : 0.5;
      }

      const score =
        ratingScore * 0.35 +
        loadScore * 0.25 +
        responseScore * 0.25 +
        tagScore * 0.15;

      return {
        volunteerId: vol.id,
        score,
        responseTime,
        currentLoad: vol.current_load || 0,
        rating: vol.rating || 0,
      };
    });

    scoredVolunteers.sort((a, b) => b.score - a.score);

    const topVolunteers = scoredVolunteers.slice(0, 5);

    if (topVolunteers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No suitable volunteer found', volunteers: [] }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        volunteers: topVolunteers,
        volunteerId: topVolunteers[0].volunteerId,
        score: topVolunteers[0].score,
        rating: topVolunteers[0].rating,
        currentLoad: topVolunteers[0].currentLoad,
        responseTime: topVolunteers[0].responseTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

