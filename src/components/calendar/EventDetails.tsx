import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEventStore } from '@/lib/store';
import EnhancedEventForm from "./EnhancedEventForm";
import { Button } from '../ui/button';
import { CalendarEventType } from '@/lib/stores/types';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useCalendarEvents } from '@/hooks/use-calendar-events';

interface EventDetailsProps {
  open: boolean;
  onClose: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ open, onClose }) => {
  const { selectedEvent, closeEventSummary } = useEventStore();
  const { updateEvent, removeEvent } = useCalendarEvents();
  const [isEditing, setIsEditing] = useState(false);

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
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    try {
      await removeEvent(selectedEvent.id);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReschedule = () => {
    toast({
      title: "Mally AI",
      description: "AI rescheduling is coming soon!",
    });
  };

  const handleUseAI = () => {
    toast({
      title: "Mally AI",
      description: "AI assistance is coming soon!",
    });
  };

  // Extract time and description from event description
  const parseDescription = (description: string) => {
    const parts = description.split('|');
    if (parts.length < 2) return { time: description, desc: "" };
    return { time: parts[0].trim(), desc: parts[1].trim() };
  };

  const { time, desc } = parseDescription(selectedEvent.description);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 border-white/10">
        <DialogTitle className="sr-only">Event Details</DialogTitle>
        
        {isEditing ? (
          <EnhancedEventForm
            initialEvent={selectedEvent}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            onUseAI={handleUseAI}
          />
        ) : (
          <div className="py-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold gradient-text mb-1">{selectedEvent.title}</h2>
              <div className="flex items-center text-muted-foreground mb-4">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{selectedEvent.date}</span>
                
                <Clock className="h-4 w-4 ml-4 mr-2" />
                <span>{time}</span>
              </div>
              
              {desc && (
                <p className="text-sm text-foreground/80 mt-2">{desc}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-3 mt-6">
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-primary hover:bg-primary/80"
              >
                Edit Event
              </Button>
              
              <Button 
                onClick={handleReschedule}
                variant="outline" 
                className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
              >
                <Sparkles size={16} className="mr-2" />
                Reschedule with Mally AI
              </Button>
              
              <Button 
                onClick={handleDelete}
                variant="destructive"
              >
                Delete Event
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventDetails;
