
import React from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import UserProfile from '@/components/UserProfile';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Circle, Check } from 'lucide-react';

// Color presets for the color picker
const colorPresets = [
  { name: 'Dark Purple', value: '#1a1625' },
  { name: 'Deep Blue', value: '#1E2746' },
  { name: 'Royal Purple', value: '#6E59A5' },
  { name: 'Indigo', value: '#5B4FC1' },
  { name: 'Ocean Blue', value: '#0EA5E9' },
  { name: 'Teal', value: '#0D9488' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Soft Purple', value: '#8664A0' },
  { name: 'Magenta', value: '#D946EF' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Charcoal', value: '#222222' },
  { name: 'Slate', value: '#334155' },
];

const Settings = () => {
  const { backgroundColor, setBackgroundColor } = useSettingsStore();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold mb-4">Appearance</h2>
          <div className="p-6 bg-card rounded-lg shadow">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Background Color</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`relative rounded-full h-10 w-10 flex items-center justify-center p-0 cursor-pointer transition-transform hover:scale-110 ${backgroundColor === color.value ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setBackgroundColor(color.value)}
                    title={color.name}
                  >
                    {backgroundColor === color.value && (
                      <Check className="h-5 w-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Custom Color</h3>
              <input
                type="color"
                id="backgroundColor"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded"
              />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">User Profile</h2>
          <UserProfile />
        </div>
      </div>
    </div>
  );
};

export default Settings;
