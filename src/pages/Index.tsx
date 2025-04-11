
import React, { useEffect } from 'react';
import Mainview from '@/components/Mainview';
import { useDateStore, useViewStore, useEventStore } from "@/lib/store";
import MallyAI from '@/components/ai/MallyAI';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { toast } from 'sonner';

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
      
      if (!event || !event.title || !event.startsAt || !event.endsAt) {
        console.error("Invalid event data received:", event);
        toast.error("Invalid event data received");
        return { success: false, error: "Invalid event data" };
      }
      
      // Use the addEvent function from the hook
      const result = await addEvent(event);
      
      if (result.success) {
        console.log("Event successfully added:", event.title);
        toast.success(`Event "${event.title}" scheduled successfully`);
      } else {
        console.error("Failed to add event:", result.error);
        toast.error(`Failed to schedule event: ${result.error || "Unknown error"}`);
      }
      
      return result;
    } catch (error) {
      console.error("Error scheduling event via MallyAI:", error);
      toast.error(`Error scheduling event: ${error instanceof Error ? error.message : "Unknown error"}`);
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
