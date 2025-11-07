import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase environment variables are not configured.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface SignalPayload {
  handoffId: string;
  sender: string;
  data: unknown;
}

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload = (await request.json()) as SignalPayload;

    if (!payload?.handoffId || !payload?.sender) {
      return new Response(
        JSON.stringify({ message: "handoffId and sender are required" }),
        { status: 400 },
      );
    }

    const { error: insertError } = await supabase.from("handoff_signals").insert({
      handoff_id: payload.handoffId,
      sender: payload.sender,
      payload: payload.data,
    });

    if (insertError) {
      throw insertError;
    }

    await supabase
      .channel(`handoff:${payload.handoffId}`)
      .send({
        type: "broadcast",
        event: "signal",
        payload: {
          sender: payload.sender,
          data: payload.data,
        },
      });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("webrtc-signaling failure", error);
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Unknown error",
        code: "SIGNAL_ERROR",
      }),
      { status: 500 },
    );
  }
});
