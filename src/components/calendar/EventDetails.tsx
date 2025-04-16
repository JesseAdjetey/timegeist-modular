import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEventStore } from '@/lib/store';
import EnhancedEventForm from "./EnhancedEventForm";
import { Button } from '../ui/button';
import { CalendarEventType } from '@/lib/stores/types';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import MallyAI from '../ai/MallyAI';

interface EventDetailsProps {
  open: boolean;
  onClose: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ open, onClose }) => {
  const { selectedEvent, closeEventSummary } = useEventStore();
  const { updateEvent, removeEvent } = useCalendarEvents();
  const [isEditing, setIsEditing] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  if (!selectedEvent) return null;

  const handleSave = async (updatedEvent: CalendarEventType) => {
    // Keep the same ID and color
    const event = {
      ...updatedEvent,
      id: selectedEvent.id,
      color: selectedEvent.color
    };
    
    try {
      await updateEvent(event);
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error("Failed to update event. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      await removeEvent(selectedEvent.id);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error("Failed to delete event. Please try again.");
    }
  };

  const handleReschedule = () => {
    setIsRescheduling(true);
  };

  // Fixed to properly return a Promise
  const handleAIEvent = async (eventData: any): Promise<any> => {
    console.log("EventDetails handling AI event:", eventData);
    
    // Implement AI rescheduling logic
    if (eventData && Object.keys(eventData).length > 0) {
      try {
        // Make sure we have all required fields from the original event
        const rescheduleEvent: CalendarEventType = {
          ...selectedEvent,
          ...eventData,
          // Ensure we keep the original ID
          id: selectedEvent.id
        };
        
        console.log("Rescheduling event with data:", rescheduleEvent);
        
        const result = await updateEvent(rescheduleEvent);
        
        if (result.success) {
          toast.success("Event rescheduled successfully");
          setIsRescheduling(false);
          onClose();
          return { success: true };
        } else {
          toast.error("Failed to reschedule event: " + (result.error || "Unknown error"));
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error("Error rescheduling event:", error);
        toast.error("Failed to reschedule event");
        return { success: false, error };
      }
    }
    // Return a resolved promise with error message for the case where no event data is provided
    return Promise.resolve({ success: false, message: "No event data provided" });
  };

  // Extract time and description from event description
  const parseDescription = (description: string) => {
    const parts = description.split('|');
    if (parts.length < 2) return { time: description, desc: "" };
    return { time: parts[0].trim(), desc: parts[1].trim() };
  };

  const { time, desc } = parseDescription(selectedEvent.description);

  // Generate reschedule prompt based on selected event
  const generateReschedulePrompt = () => {
    return `Reschedule: "${selectedEvent.title}" currently scheduled on ${selectedEvent.date} at ${time}. Please suggest an alternative time.`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[500px] bg-background/95 border-white/10 animate-scale-in">
          <DialogTitle className="sr-only">Event Details</DialogTitle>
          
          {isEditing ? (
            <EnhancedEventForm
              event={selectedEvent}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              onUseAI={handleReschedule}
            />
          ) : (
            <div className="py-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold gradient-text mb-1 animate-fade-in">{selectedEvent.title}</h2>
                <div className="flex items-center text-muted-foreground mb-4 animate-fade-in" style={{animationDelay: "100ms"}}>
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{selectedEvent.date}</span>
                  
                  <Clock className="h-4 w-4 ml-4 mr-2" />
                  <span>{time}</span>
                </div>
                
                {desc && (
                  <p className="text-sm text-foreground/80 mt-2 animate-fade-in" style={{animationDelay: "200ms"}}>{desc}</p>
                )}
              </div>
              
              <div className="flex flex-col gap-3 mt-6">
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-primary hover:bg-primary/80 transition-all hover:scale-105 animate-fade-in"
                  style={{animationDelay: "300ms"}}
                >
                  Edit Event
                </Button>
                
                <Button 
                  onClick={handleReschedule}
                  variant="outline" 
                  className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary transition-all hover:scale-105 animate-fade-in"
                  style={{animationDelay: "400ms"}}
                >
                  <Sparkles size={16} className="mr-2 animate-pulse" />
                  Reschedule with Mally AI
                </Button>
                
                <Button 
                  onClick={handleDelete}
                  variant="destructive"
                  className="transition-all hover:scale-105 animate-fade-in"
                  style={{animationDelay: "500ms"}}
                >
                  Delete Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Rescheduling Dialog */}
      {isRescheduling && (
        <Dialog open={isRescheduling} onOpenChange={(isOpen) => !isOpen && setIsRescheduling(false)}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden bg-background/95 border-white/10 animate-scale-in">
            <DialogTitle className="text-xl font-bold gradient-text">Reschedule with Mally AI</DialogTitle>
            <div className="h-[70vh]">
              <MallyAI 
                onScheduleEvent={handleAIEvent} 
                initialPrompt={generateReschedulePrompt()}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default EventDetails;
