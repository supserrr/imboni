import { Platform } from 'react-native';
import { supabase as nativeSupabase } from './supabase.native';
import { supabase as webSupabase } from './supabase.web';

/**
 * Platform-specific Supabase client export.
 * Uses native implementation for iOS/Android, web implementation for web.
 */
export const supabase = Platform.OS === 'web' ? webSupabase : nativeSupabase;

