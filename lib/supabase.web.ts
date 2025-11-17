import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration for web platform.
 * Uses native localStorage (no polyfill needed).
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Safe storage adapter that checks for browser environment.
 * Falls back to in-memory storage during SSR.
 */
const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  // Fallback for SSR - use in-memory storage
  const memoryStorage: { [key: string]: string } = {};
  return {
    getItem: (key: string) => memoryStorage[key] || null,
    setItem: (key: string, value: string) => {
      memoryStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
  };
};

/**
 * Creates and returns a Supabase client instance with native localStorage for session persistence.
 *
 * @returns Supabase client instance
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

