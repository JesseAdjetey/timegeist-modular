
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'dark' | 'light';

interface SettingsState {
  themeMode: ThemeMode;
  backgroundColor: string;
  setThemeMode: (mode: ThemeMode) => void;
  setBackgroundColor: (color: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'dark',
      backgroundColor: '#1a1625',
      setThemeMode: (mode) => set({ themeMode: mode }),
      setBackgroundColor: (color) => set({ backgroundColor: color }),
    }),
    {
      name: 'timegeist-settings',
    }
  )
);
