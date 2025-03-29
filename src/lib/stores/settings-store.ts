
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      backgroundColor: '#1a1625',
      setBackgroundColor: (color) => set({ backgroundColor: color }),
    }),
    {
      name: 'timegeist-settings',
    }
  )
);
