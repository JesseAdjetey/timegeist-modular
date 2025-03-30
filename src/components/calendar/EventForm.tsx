
import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { nanoid } from 'nanoid';
import { useEventStore } from '@/lib/store';
import EnhancedEventForm from "./EnhancedEventForm";
import { toast } from '@/components/ui/use-toast';

interface EventFormProps {
  open: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  initialTime?: {
    date: Date;
    startTime: string;
  };
  onSave?: (event: any) => void;
  onUseAI?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ 
  open, 
  onClose, 
  onCancel,
  initialTime,
  onSave: propOnSave,
  onUseAI
}) => {
  const { addEvent } = useEventStore();
  
  // Use onCancel or onClose, whichever is provided
  const handleClose = onCancel || onClose;
  
  const handleSave = (event: any) => {
    // Generate a unique ID for the new event
    const newEvent = {
      ...event,
      id: nanoid()
    };
    
    if (propOnSave) {
      propOnSave(newEvent);
    } else {
      addEvent(newEvent);
    }
    if (handleClose) handleClose();
  };

  const handleUseAI = () => {
    toast({
      title: "Mally AI",
      description: "AI assistance is coming soon!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose && handleClose()}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 border-white/10">
        <DialogTitle className="sr-only">Add Event</DialogTitle>
        <EnhancedEventForm
          initialEvent={initialTime ? {
            date: initialTime.date.toISOString().split('T')[0],
            description: `${initialTime.startTime} - ${getEndTime(initialTime.startTime)} | `
          } : undefined}
          onSave={handleSave}
          onCancel={handleClose}
          onUseAI={onUseAI || handleUseAI}
        />
      </DialogContent>
    </Dialog>
  );
};

// Helper function to calculate an end time 1 hour after the start time
const getEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHour = (hours + 1) % 24;
  return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export default EventForm;
