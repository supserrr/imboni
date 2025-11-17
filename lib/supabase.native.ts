import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase client configuration for native platforms (iOS/Android).
 * Uses AsyncStorage for session persistence.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Creates and returns a Supabase client instance with AsyncStorage for session persistence.
 *
 * @returns Supabase client instance
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

