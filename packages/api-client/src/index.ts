import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import type {
  HandoffRequest,
  ImageAnalysisRequest,
  ImageAnalysisResult,
  ServiceError,
  WebRTCSignal,
} from '@imboni/shared';

/**
 * Configuration required to bootstrap a Supabase client instance.
 */
export interface SupabaseConfiguration {
  /** Public Supabase project URL. */
  readonly supabaseUrl: string;
  /** Public anonymous key utilised by the client. */
  readonly supabaseAnonKey: string;
}

/**
 * Factory function that returns a Supabase client configured for edge function usage.
 * @param configuration Supabase project configuration containing URL and anon key.
 * @returns An authenticated Supabase client instance.
 */
export const createSupabaseBrowserClient = (
  configuration: SupabaseConfiguration,
): SupabaseClient =>
  createClient(configuration.supabaseUrl, configuration.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

/**
 * Invokes the Supabase Edge Function that proxies the Moondream image analysis service.
 * @param client Supabase client returned from {@link createSupabaseBrowserClient}.
 * @param payload Metadata and binary reference for the image that should be analysed.
 * @returns Structured image analysis result emitted by the AI pipeline.
 * @throws Error when the edge function invocation fails.
 */
export const analyzeImage = async (
  client: SupabaseClient,
  payload: ImageAnalysisRequest,
): Promise<ImageAnalysisResult> => {
  const { data, error } = await client.functions.invoke<ImageAnalysisResult>('analyze-image', {
    body: payload,
  });

  if (error) {
    throw mapEdgeFunctionError(error);
  }

  return data;
};

/**
 * Requests a human volunteer handoff using the associated Supabase Edge Function.
 * @param client Supabase client configured for the current user.
 * @param analysisId Identifier of the AI analysis that triggered the escalation.
 * @returns Newly created handoff request metadata.
 */
export const requestHumanHandoff = async (
  client: SupabaseClient,
  analysisId: string,
): Promise<HandoffRequest> => {
  const { data, error } = await client.functions.invoke<HandoffRequest>('request-handoff', {
    body: { analysisId },
  });

  if (error) {
    throw mapEdgeFunctionError(error);
  }

  return data;
};

/**
 * Subscribes to real-time updates for a specific handoff request.
 * @param client Supabase client configured for the current user.
 * @param handoffId Identifier of the handoff request to observe.
 * @param callback Function invoked when the handoff record changes.
 * @returns Realtime channel subscription reference.
 */
export const subscribeToHandoff = (
  client: SupabaseClient,
  handoffId: string,
  callback: (payload: HandoffRequest) => void,
): RealtimeChannel =>
  client
    .channel(`handoff:${handoffId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'handoff_requests', filter: `id=eq.${handoffId}` }, (payload) => {
      callback(payload.new as HandoffRequest);
    })
    .subscribe();

/**
 * Normalises Supabase edge function errors into native `Error` instances.
 * @param error Supabase error payload.
 * @returns `Error` object with user-friendly messaging.
 */
/**
 * Sends a WebRTC signalling payload using the dedicated edge function.
 * @param client Supabase client configured for the current user.
 * @param handoffId Identifier of the handoff the signal is associated with.
 * @param signal Signal payload forwarded to the remote peer.
 */
export const sendWebRTCSignal = async (
  client: SupabaseClient,
  handoffId: string,
  signal: Omit<WebRTCSignal, 'handoffId'>,
): Promise<void> => {
  const { error } = await client.functions.invoke('webrtc-signaling', {
    body: {
      handoffId,
      sender: signal.sender,
      data: signal.data,
    },
  });

  if (error) {
    throw mapEdgeFunctionError(error);
  }
};

const mapEdgeFunctionError = (error: { message: string; name?: string } & Partial<ServiceError>): Error => {
  const detail = 'message' in error && error.message ? error.message : 'Unknown edge function error.';
  const code = 'code' in error && error.code ? ` (${error.code})` : '';
  return new Error(`${detail}${code}`);
};
