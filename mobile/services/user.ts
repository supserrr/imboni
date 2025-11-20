import { supabase } from './supabase';
import { UserProfile } from '../types/user';

export const UserService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as UserProfile;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as UserProfile;
  },

  async setAvailability(userId: string, isAvailable: boolean) {
    return this.updateProfile(userId, { availability: isAvailable });
  },
};

