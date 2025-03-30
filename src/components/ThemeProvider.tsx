
import React, { useEffect } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useLocation, useNavigate } from 'react-router-dom';

interface ThemeProviderProps {
  children: React.ReactNode;
  isAuthPage?: boolean;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, isAuthPage = false }) => {
  const { backgroundColor } = useSettingsStore();
  
  // We'll use a prop instead of useLocation() so this component can be used outside Router context
  
  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add('dark-mode');
    document.documentElement.classList.remove('light-mode');
    
    // Use the user's selected background color or a nice default for auth page
    const baseColor = isAuthPage ? '#1E2746' : backgroundColor;
    
    // Create a smoother, more appealing gradient
    const endColor = adjustColorBrightness(baseColor, -40);
    
    // Apply background to body
    document.body.style.background = `linear-gradient(135deg, ${baseColor}, ${endColor})`;
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundSize = 'cover';
    document.body.style.height = '100vh';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.color = 'white';
    
  }, [backgroundColor, isAuthPage]);

  // Helper function to adjust color brightness
  const adjustColorBrightness = (hex: string, percent: number) => {
    hex = hex.replace(/^#/, '');
    
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    r = Math.min(255, Math.max(0, r + percent));
    g = Math.min(255, Math.max(0, g + percent));
    b = Math.min(255, Math.max(0, b + percent));
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  return <>{children}</>;
};

export default ThemeProvider;
