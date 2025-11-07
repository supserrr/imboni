// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

interface ImageAnalysisRequest {
  /** Identifier for the user initiating the request. */
  userId: string;
  /** Base64 encoded image or public URL. */
  imageSource: string;
  /** Optional follow-up question. */
  prompt?: string;
  /** ISO timestamp for when the image was captured. */
  capturedAt?: string;
}

interface ImageAnalysisDescription {
  caption: string;
  observations: string[];
  textBlocks?: string[];
}

interface ConfidenceScore {
  value: number;
  rationale?: string;
}

interface ImageAnalysisResult {
  id: string;
  description: ImageAnalysisDescription;
  confidence: ConfidenceScore;
  handoffRequestId?: string;
  completedAt: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const moondreamApiKey = Deno.env.get("MOONDREAM_API_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase environment variables are not configured.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Derives a confidence score based on the payload returned by Moondream.
 * @param response Raw response payload returned by the AI provider.
 */
const deriveConfidence = (response: any): ConfidenceScore => {
  const value = typeof response?.confidence === "number" ? response.confidence : 0.6;
  const clamped = Math.min(Math.max(value, 0), 1);
  const rationale = response?.confidence_explanation ?? "Derived from Moondream response.";
  return {
    value: clamped,
    rationale,
  };
};

/**
 * Persists the analysis result to the Supabase database.
 * @param payload Request metadata received from the client.
 * @param description Structured description returned by the AI.
 * @param confidence Calculated confidence metrics.
 * @param rawResponse Raw JSON response for auditing.
 */
const persistAnalysis = async (
  payload: ImageAnalysisRequest,
  description: ImageAnalysisDescription,
  confidence: ConfidenceScore,
  rawResponse: Record<string, unknown>,
): Promise<string> => {
  const { data, error } = await supabase
    .from("image_analyses")
    .insert({
      user_id: payload.userId,
      caption: description.caption,
      observations: description.observations,
      text_blocks: description.textBlocks ?? [],
      confidence: confidence.value,
      rationale: confidence.rationale,
      raw_response: rawResponse,
      language: rawResponse?.language ?? "en",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
};

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload = (await request.json()) as ImageAnalysisRequest;

    if (!payload?.userId || !payload?.imageSource) {
      return new Response(
        JSON.stringify({ message: "userId and imageSource are required." }),
        { status: 400 },
      );
    }

    let aiResponse: Record<string, any> = {};
    if (moondreamApiKey) {
      const response = await fetch("https://api.moondream.ai/v1/describe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${moondreamApiKey}`,
        },
        body: JSON.stringify({
          image: payload.imageSource,
          prompt: payload.prompt,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Moondream API error", text);
        return new Response(
          JSON.stringify({
            message: "Moondream API call failed.",
            code: "MOONDREAM_API_ERROR",
          }),
          { status: 502 },
        );
      }

      aiResponse = await response.json();
    } else {
      aiResponse = {
        caption: "Sample description because MOONDREAM_API_KEY is not configured.",
        observations: ["Placeholder observation"],
        textBlocks: [],
        confidence: 0.55,
        confidence_explanation: "Default confidence without live API call.",
      };
    }

    const description: ImageAnalysisDescription = {
      caption: String(aiResponse.caption ?? "No caption available."),
      observations: Array.isArray(aiResponse.observations)
        ? aiResponse.observations.map((entry: unknown) => String(entry))
        : [],
      textBlocks: Array.isArray(aiResponse.textBlocks)
        ? aiResponse.textBlocks.map((entry: unknown) => String(entry))
        : undefined,
    };

    const confidence = deriveConfidence(aiResponse);
    const analysisId = await persistAnalysis(payload, description, confidence, aiResponse);
    const completedAt = new Date().toISOString();

    const result: ImageAnalysisResult = {
      id: analysisId,
      description,
      confidence,
      completedAt,
    };

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function failure", error);
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Unknown error",
        code: "EDGE_FUNCTION_ERROR",
      }),
      { status: 500 },
    );
  }
});
