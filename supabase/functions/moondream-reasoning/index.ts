/**
 * Supabase Edge Function: Moondream Reasoning Proxy
 * Proxies requests to Moondream API with secure API key handling.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MOONDREAM_API_KEY = Deno.env.get('MOONDREAM_API_KEY') || '';
const MOONDREAM_API_URL = Deno.env.get('MOONDREAM_API_URL') || 'https://api.moondream.ai/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if Moondream API key is configured
    if (!MOONDREAM_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Moondream API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const { embedding, image_url, question, context, verbosity } = requestBody;

    // Validate request
    if (!embedding && !image_url) {
      return new Response(
        JSON.stringify({ error: 'Either embedding or image_url must be provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build Moondream API request
    const moondreamBody: Record<string, unknown> = {
      system_prompt: 'You are a helpful, supportive AI assistant helping a visually impaired user understand their surroundings through images. Respond in a friendly, supportive tone, as if helping a visually impaired user. Be reassuring and context-aware.',
    };

    if (context) {
      moondreamBody.context = context;
    }

    if (verbosity) {
      moondreamBody.verbosity = verbosity;
    }

    // Use embedding if available, otherwise use image_url
    if (embedding && Array.isArray(embedding) && embedding.length > 0) {
      moondreamBody.embedding = embedding;
      moondreamBody.question = question || 'Describe what you see in detail.';
    } else if (image_url) {
      moondreamBody.image_url = image_url;
      moondreamBody.question = question || 'Describe what you see in detail.';
    }

    // Determine endpoint - try reasoning first, fallback to query
    const endpoint = `${MOONDREAM_API_URL}/reasoning`;
    const fallbackEndpoint = `${MOONDREAM_API_URL}/query`;

    let response: Response;
    let usedFallback = false;

    try {
      // Try reasoning endpoint
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Moondream-Auth': MOONDREAM_API_KEY,
        },
        body: JSON.stringify(moondreamBody),
      });

      if (!response.ok && response.status === 404) {
        // Reasoning endpoint not available, try query endpoint
        usedFallback = true;

        // Adjust body for query endpoint (remove embedding if not supported)
        if (moondreamBody.embedding) {
          delete moondreamBody.embedding;
          if (image_url) {
            moondreamBody.image_url = image_url;
          }
        }

        response = await fetch(fallbackEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Moondream-Auth': MOONDREAM_API_KEY,
          },
          body: JSON.stringify(moondreamBody),
        });
      }
    } catch (fetchError) {
      return new Response(
        JSON.stringify({ error: `Moondream API error: ${fetchError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Moondream API error: ${response.status} - ${errorText}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();

    // Parse and format response
    const result = {
      description: data.answer || data.response || data.description || '',
      confidence: data.confidence ?? (data.answer ? 0.8 : 0.5),
      objects: data.objects || [],
      text: data.text || '',
      safety_cues: data.safety_cues || [],
      usedFallback,
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
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

