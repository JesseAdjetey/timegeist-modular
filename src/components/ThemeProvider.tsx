
import React, { useEffect } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  isAuthPage?: boolean;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'system', 
  storageKey = 'ui-theme',
  isAuthPage = false 
}) => {
  const { backgroundColor } = useSettingsStore();
  
  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add('dark-mode');
    document.documentElement.classList.remove('light-mode');
    
    // Use the user's selected background color or a nice default for auth page
    const baseColor = isAuthPage ? '#1E2746' : backgroundColor || '#1A1F2C';
    
    // Create a smoother, more appealing gradient
    const endColor = adjustColorBrightness(baseColor, -30);
    
    // Apply background to body
    document.body.style.background = `linear-gradient(135deg, ${baseColor}, ${endColor})`;
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundSize = 'cover';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.color = 'white';
    
    // Add some CSS to make the app look more modern
    const style = document.createElement('style');
    style.textContent = `
      .glass {
        background: rgba(30, 39, 70, 0.2);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
      }
      
      .glass-sidebar {
        background: rgba(10, 15, 30, 0.4);
        backdrop-filter: blur(10px);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      body {
        overflow: hidden;
        height: 100vh;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
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
