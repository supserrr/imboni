import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase environment variables are not configured.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface HandoffPayload {
  analysisId: string;
}

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = (await request.json()) as HandoffPayload;

    if (!body?.analysisId) {
      return new Response(
        JSON.stringify({ message: "analysisId is required" }),
        { status: 400 },
      );
    }

    const { data: analysis, error: fetchError } = await supabase
      .from("image_analyses")
      .select("id, user_id, handoff_request_id, confidence")
      .eq("id", body.analysisId)
      .single();

    if (fetchError || !analysis) {
      return new Response(
        JSON.stringify({ message: "Analysis not found", code: "ANALYSIS_NOT_FOUND" }),
        { status: 404 },
      );
    }

    if (analysis.handoff_request_id) {
      const { data: existing } = await supabase
        .from("handoff_requests")
        .select("*")
        .eq("id", analysis.handoff_request_id)
        .single();

      if (existing) {
        return new Response(JSON.stringify(existing), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const { data: handoff, error: insertError } = await supabase
      .from("handoff_requests")
      .insert({
        user_id: analysis.user_id,
        status: "pending",
      })
      .select("*")
      .single();

    if (insertError) {
      throw insertError;
    }

    const { error: updateError } = await supabase
      .from("image_analyses")
      .update({ handoff_request_id: handoff.id })
      .eq("id", body.analysisId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify(handoff), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("request-handoff failure", error);
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Unknown error",
        code: "HANDOFF_ERROR",
      }),
      { status: 500 },
    );
  }
});
