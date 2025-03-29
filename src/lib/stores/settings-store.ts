
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  chatSize: 'small' | 'medium' | 'large';
  setChatSize: (size: 'small' | 'medium' | 'large') => void;
  logoPosition: { x: number, y: number };
  setLogoPosition: (position: { x: number, y: number }) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Chat accent color (not background)
      backgroundColor: '#8664A0',
      setBackgroundColor: (color) => set({ backgroundColor: color }),
      
      // Chat size
      chatSize: 'medium',
      setChatSize: (size) => set({ chatSize: size }),
      
      // Logo position
      logoPosition: { x: 20, y: 20 },
      setLogoPosition: (position) => set({ logoPosition: position }),
    }),
    {
      name: 'timegeist-settings',
    }
  )
);
