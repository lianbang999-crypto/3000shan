import { create } from 'zustand';
import { getToday } from '../utils/date';

interface AppState {
  currentDate: string;
  isOnboarded: boolean;
  theme: 'light' | 'dark';
  goal: number;
  setCurrentDate: (date: string) => void;
  setOnboarded: (v: boolean) => void;
  setTheme: (t: 'light' | 'dark') => void;
  setGoal: (g: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentDate: getToday(),
  isOnboarded: false,
  theme: 'light',
  goal: 3000,
  setCurrentDate: (date) => set({ currentDate: date }),
  setOnboarded: (v) => set({ isOnboarded: v }),
  setTheme: (t) => set({ theme: t }),
  setGoal: (g) => set({ goal: g }),
}));
