import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

type UserType = 'blind' | 'volunteer' | null;

interface AppState {
  user: User | null;
  userType: UserType;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setUserType: (type: UserType) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  userType: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setUserType: (type) => set({ userType: type }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

