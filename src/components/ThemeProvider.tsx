
import React, { useEffect } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { backgroundColor } = useSettingsStore();

  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add('dark-mode');
    document.documentElement.classList.remove('light-mode');
    
    // Only apply color to specific UI elements, not the entire body background
    document.documentElement.style.setProperty('--primary', backgroundColor);
    
    // Remove the full screen background gradient that was causing the issue
    document.body.style.background = '';
    document.body.style.backgroundAttachment = '';
    document.documentElement.style.removeProperty('--background-start');
  }, [backgroundColor]);

  return <>{children}</>;
};

export default ThemeProvider;
