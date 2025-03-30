
import React from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import UserProfile from '@/components/UserProfile';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
      
      <div className="grid gap-6 md:grid-cols-1">
        <div>
          <h2 className="text-xl font-bold mb-4">Appearance</h2>
          <div className="p-4 bg-card rounded-lg shadow">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" htmlFor="backgroundColor">
                Background Color
              </label>
              <input
                type="color"
                id="backgroundColor"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-10 w-full cursor-pointer"
              />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          <UserProfile />
        </div>
      </div>
    </div>
  );
};

export default Settings;
