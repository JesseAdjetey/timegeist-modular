
import React, { useEffect } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Sun, Moon, Palette, ArrowLeft } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const themeColors = [
  { name: 'Purple', value: '#1a1625' },
  { name: 'Dark Blue', value: '#131836' },
  { name: 'Dark Teal', value: '#133636' },
  { name: 'Dark Green', value: '#1a3622' },
  { name: 'Dark Red', value: '#3a1a1a' },
];

const Settings = () => {
  const { themeMode, backgroundColor, setThemeMode, setBackgroundColor } = useSettingsStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Apply the background color from settings
  useEffect(() => {
    document.documentElement.style.setProperty('--background-start', backgroundColor);
    
    // Update the body gradient based on the background color
    document.body.style.background = `linear-gradient(to bottom right, ${backgroundColor}, ${adjustColorBrightness(backgroundColor, -20)})`;
    document.body.style.backgroundAttachment = 'fixed';
  }, [backgroundColor]);
  
  const handleThemeChange = (value: 'dark' | 'light') => {
    setThemeMode(value);
    toast({
      title: 'Theme Updated',
      description: `Theme changed to ${value} mode`,
    });
  };
  
  const handleBackgroundChange = (color: string) => {
    setBackgroundColor(color);
    toast({
      title: 'Background Updated',
      description: 'Background color has been changed',
    });
  };
  
  // Helper function to darken or lighten a color
  const adjustColorBrightness = (hex: string, percent: number) => {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Adjust the brightness
    r = Math.min(255, Math.max(0, r + percent));
    g = Math.min(255, Math.max(0, g + percent));
    b = Math.min(255, Math.max(0, b + percent));
    
    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2" size={18} />
          Back
        </Button>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
      </div>
      
      <div className="space-y-8">
        {/* Theme Mode Selection */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Sun className="mr-2" size={20} />
            <Moon className="mr-2" size={20} />
            Theme Mode
          </h2>
          
          <RadioGroup 
            defaultValue={themeMode}
            onValueChange={(value) => handleThemeChange(value as 'dark' | 'light')}
            className="flex gap-6 mt-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="cursor-pointer">Dark Mode</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="cursor-pointer">Light Mode</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Background Color Selection */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Palette className="mr-2" size={20} />
            Background Color
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            {themeColors.map((color) => (
              <div 
                key={color.value}
                onClick={() => handleBackgroundChange(color.value)}
                className={`
                  h-20 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center
                  ${backgroundColor === color.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:scale-105'}
                `}
                style={{ background: `linear-gradient(to bottom right, ${color.value}, ${adjustColorBrightness(color.value, -20)})` }}
              >
                <span className="font-medium text-white drop-shadow-md">{color.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Custom Background Color */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Custom Background</h2>
          
          <div className="flex items-center gap-4">
            <input 
              type="color" 
              value={backgroundColor}
              onChange={(e) => handleBackgroundChange(e.target.value)}
              className="w-12 h-12 rounded cursor-pointer"
            />
            <span className="font-mono">{backgroundColor}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
