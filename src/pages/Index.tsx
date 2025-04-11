
import React, { useEffect } from 'react';
import Mainview from '@/components/Mainview';
import { useDateStore, useViewStore, useEventStore } from "@/lib/store";
import MallyAI from '@/components/ai/MallyAI';
import { useCalendarEvents } from '@/hooks/use-calendar-events';

const Index = () => {
  const { addEvent } = useCalendarEvents();
  
  // Initialize stores on client side
  useEffect(() => {
    // Hydrate zustand stores if needed
    const view = useViewStore.getState();
    const date = useDateStore.getState();
    
    // Any other initialization needed
  }, []);

  // Handler for event scheduling via MallyAI
  const handleScheduleEvent = async (event: any) => {
    try {
      console.log("Index component handling MallyAI event:", event);
      const result = await addEvent(event);
      return result;
    } catch (error) {
      console.error("Error scheduling event via MallyAI:", error);
      return { success: false, error };
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-white relative">
      <Mainview />
      <MallyAI onScheduleEvent={handleScheduleEvent} />
    </div>
  );
};

export default Index;
