import { createSupabaseBrowserClient } from '@imboni/api-client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazily instantiates the Supabase browser client using environment variables.
 */
let client: SupabaseClient | undefined;

/**
 * Returns a memoised Supabase client instance for the web app.
 * @returns Supabase client configured with project credentials.
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (client) {
    return client;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured.');
  }

  client = createSupabaseBrowserClient({
    supabaseUrl,
    supabaseAnonKey,
  });

  return client;
};
