
import React from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import UserProfile from '@/components/UserProfile';

const Settings = () => {
  const { backgroundColor, setBackgroundColor } = useSettingsStore();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
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
          <UserProfile />
        </div>
      </div>
    </div>
  );
};

export default Settings;
