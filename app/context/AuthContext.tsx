import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/SupabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'user' | 'volunteer' | null;

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Checks if a user is currently logged in.
   */
  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Loads the user profile from the database.
   * Creates a profile if it doesn't exist.
   *
   * @param userId - The ID of the user.
   */
  async function loadUserProfile(userId: string) {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      // If profile doesn't exist, create it
      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: authUser.user.email || '',
            role: 'user', // Default role
          })
          .select('id, email, role')
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          return;
        }

        setUser(newProfile as User);
      } else {
        setUser(data as User);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  /**
   * Logs in a user with email and password.
   *
   * @param email - The user's email.
   * @param password - The user's password.
   * @returns Promise resolving to success status.
   */
  async function login(email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error logging in:', error);
        return false;
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  }

  /**
   * Signs up a new user.
   *
   * @param email - The user's email.
   * @param password - The user's password.
   * @param role - The user's role.
   * @returns Promise resolving to success status.
   */
  async function signUp(email: string, password: string, role: UserRole): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Error signing up:', error);
        return false;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          role,
        });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return false;
        }

        await loadUserProfile(data.user.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error signing up:', error);
      return false;
    }
  }

  /**
   * Logs out the current user.
   */
  async function logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      setUser(null);
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  /**
   * Updates the user's role.
   *
   * @param role - The new role.
   */
  async function updateUserRole(role: UserRole): Promise<void> {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user role:', error);
        return;
      }

      setUser({ ...user, role });
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, logout, updateUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the auth context.
 *
 * @returns The auth context value.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

