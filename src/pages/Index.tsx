
import React from 'react';
import Mainview from '@/components/Mainview';
import { useEffect } from 'react';
import { useDateStore, useViewStore } from '@/lib/store';

const Index = () => {
  // Initialize stores on client side
  useEffect(() => {
    // Hydrate zustand stores if needed
    const view = useViewStore.getState();
    const date = useDateStore.getState();
    
    // Any other initialization needed
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-indigo-900 text-white">
      <Mainview />
    </div>
  );
};

export default Index;
