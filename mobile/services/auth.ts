import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Localization from 'expo-localization';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { UserType } from '../types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This is required for expo-auth-session to work properly
WebBrowser.maybeCompleteAuthSession();

const TEMP_USER_TYPE_KEY = '@imboni_temp_user_type';

export const AuthService = {
  /**
   * Sign up with email and password
   */
  async signUpWithEmail(
    email: string,
    password: string,
    fullName: string,
    userType: UserType
  ) {
    // Get device and locale information
    const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
    const deviceInfo = {
      os: Platform.OS,
      model: Device.modelName || 'unknown',
      version: Platform.Version.toString(),
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          type: userType,
          preferred_language: deviceLanguage,
          device_info: deviceInfo,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in with Google OAuth
   * Uses Supabase OAuth with PKCE flow for native apps
   */
  async signInWithGoogle(userType: UserType) {
    console.log('[AuthService] Starting Google OAuth with user type:', userType);
    
    try {
      // Store user type temporarily for use after OAuth callback
      await AsyncStorage.setItem(TEMP_USER_TYPE_KEY, userType);
      console.log('[AuthService] Stored user type in AsyncStorage');

      // Get device info and language for metadata
      const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
      const deviceInfo = {
        platform: Device.osName,
        osVersion: Device.osVersion,
        modelName: Device.modelName,
      };

      console.log('[AuthService] Calling Supabase signInWithOAuth with user type:', userType);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'imboni://auth/callback',
          skipBrowserRedirect: false,
          scopes: 'email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          data: {
            type: userType,
            preferred_language: deviceLanguage,
            device_info: deviceInfo,
          },
        },
      });

      console.log('[AuthService] Supabase OAuth response:', { data, error });

      if (error) {
        console.error('[AuthService] Supabase OAuth error:', error);
        throw error;
      }

      // Open OAuth URL in browser
      if (data?.url) {
        console.log('[AuthService] Opening OAuth URL in browser:', data.url);
        
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'imboni://auth/callback'
        );

        console.log('[AuthService] Browser result:', result);

        if (result.type === 'success') {
          const { url } = result;
          console.log('[AuthService] OAuth success! Full callback URL:', url);
          
          // Check if URL contains error
          if (url.includes('error=')) {
            const errorParams = new URLSearchParams(url.split('?')[1] || url.split('#')[1]);
            const error = errorParams.get('error');
            const errorDescription = errorParams.get('error_description');
            console.error('[AuthService] OAuth error in callback:', { error, errorDescription });
            throw new Error(`OAuth failed: ${errorDescription || error || 'Unknown error'}`);
          }
          
          // Extract tokens from URL (try both # and ? formats)
          const hashParams = new URLSearchParams(url.split('#')[1] || '');
          const queryParams = new URLSearchParams(url.split('?')[1] || '');
          
          const access_token = hashParams.get('access_token') || queryParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token') || queryParams.get('refresh_token');

          console.log('[AuthService] Parsed URL parameters:', { 
            has_access_token: !!access_token, 
            has_refresh_token: !!refresh_token,
            url_parts: {
              has_hash: url.includes('#'),
              has_query: url.includes('?'),
              hash_part: url.split('#')[1]?.substring(0, 50),
              query_part: url.split('?')[1]?.substring(0, 50),
            }
          });

          if (access_token) {
            // Set session with the tokens
            console.log('[AuthService] Setting session with tokens...');
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token: refresh_token || '',
            });

            if (sessionError) {
              console.error('[AuthService] Session error:', sessionError);
              throw sessionError;
            }
            
            console.log('[AuthService] Session set successfully');
            
            // Update user metadata with stored user type
            if (sessionData.user) {
              console.log('[AuthService] Updating user metadata...');
              await this.updateUserMetadataAfterOAuth(sessionData.user.id);
            }

            return sessionData;
          } else {
            console.error('[AuthService] No access token found in callback URL');
            console.error('[AuthService] This usually means Google OAuth credentials are not configured in Supabase');
            console.error('[AuthService] Please configure Client ID and Client Secret in Supabase Dashboard > Authentication > Google Provider');
            throw new Error('No access token received. Please configure Google OAuth credentials in Supabase Dashboard.');
          }
        } else if (result.type === 'cancel') {
          console.log('[AuthService] User cancelled OAuth');
          // Clear stored user type on cancel
          await AsyncStorage.removeItem(TEMP_USER_TYPE_KEY);
          throw new Error('Authentication cancelled');
        } else {
          console.log('[AuthService] OAuth result type:', result.type);
          throw new Error(`Unexpected OAuth result: ${result.type}`);
        }
      }

      console.error('[AuthService] No OAuth URL received from Supabase');
      throw new Error('Failed to get OAuth URL from Supabase. Please check your Supabase configuration.');
    } catch (error) {
      console.error('[AuthService] Google OAuth Error:', error);
      // Clear stored user type on error
      await AsyncStorage.removeItem(TEMP_USER_TYPE_KEY);
      throw error;
    }
  },

  /**
   * Update user metadata and profile after OAuth completes
   */
  async updateUserMetadataAfterOAuth(userId: string) {
    try {
      // Get stored user type
      const userType = await AsyncStorage.getItem(TEMP_USER_TYPE_KEY);
      console.log('[AuthService] Retrieved stored user type:', userType);
      
      // Get device and locale information
      const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
      const deviceInfo = {
        os: Platform.OS,
        model: Device.modelName || 'unknown',
        version: Platform.Version.toString(),
      };

      // Update user metadata in auth.users
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          type: userType || 'blind',
          preferred_language: deviceLanguage,
          device_info: deviceInfo,
        },
      });

      if (updateError) {
        console.warn('[AuthService] Failed to update auth metadata:', updateError);
      } else {
        console.log('[AuthService] Auth metadata updated');
      }

      // Also update the public.users table to ensure type is correct
      console.log('[AuthService] Updating public.users table with type:', userType);
      const { error: profileError } = await supabase
        .from('users')
        .update({
          type: userType || 'blind',
          preferred_language: deviceLanguage,
          device_info: deviceInfo,
        })
        .eq('id', userId);

      if (profileError) {
        console.error('[AuthService] Failed to update user profile:', profileError);
      } else {
        console.log('[AuthService] User profile updated successfully');
      }

      // If volunteer, ensure volunteer_behavior record exists
      if (userType === 'volunteer') {
        console.log('[AuthService] Creating volunteer_behavior record');
        const { error: volunteerError } = await supabase
          .from('volunteer_behavior')
          .upsert({
            volunteer_id: userId,
            accept_count: 0,
            decline_count: 0,
            response_time_avg: 0.0,
          }, {
            onConflict: 'volunteer_id'
          });

        if (volunteerError) {
          console.error('[AuthService] Failed to create volunteer_behavior:', volunteerError);
        } else {
          console.log('[AuthService] Volunteer behavior record created');
        }
      }

      // Clear stored user type
      await AsyncStorage.removeItem(TEMP_USER_TYPE_KEY);
      console.log('[AuthService] OAuth user setup completed');
    } catch (error) {
      console.error('[AuthService] Error updating user after OAuth:', error);
    }
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Handle OAuth callback (for deep linking)
   */
  async handleOAuthCallback(url: string) {
    try {
      const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || '',
        });

        if (error) throw error;
        
        // Update user metadata after setting session
        if (data.user) {
          await this.updateUserMetadataAfterOAuth(data.user.id);
        }
        
        return data;
      }

      throw new Error('No access token found in callback URL');
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Get current user
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
};

