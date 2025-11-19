import { create } from 'zustand';

interface CallState {
  callId: string | null;
  isActive: boolean;
  duration: number;
  setCallId: (id: string | null) => void;
  setIsActive: (active: boolean) => void;
  incrementDuration: () => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  callId: null,
  isActive: false,
  duration: 0,
  setCallId: (id) => set({ callId: id }),
  setIsActive: (isActive) => set({ isActive }),
  incrementDuration: () => set((state) => ({ duration: state.duration + 1 })),
  reset: () => set({ callId: null, isActive: false, duration: 0 }),
}));

