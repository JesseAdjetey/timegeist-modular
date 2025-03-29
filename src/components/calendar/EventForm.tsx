
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { nanoid } from 'nanoid';
import { useEventStore } from '@/lib/store';
import EnhancedEventForm from "./EnhancedEventForm";

interface EventFormProps {
  open: boolean;
  onClose: () => void;
  initialTime?: {
    date: Date;
    startTime: string;
  };
}

const EventForm: React.FC<EventFormProps> = ({ 
  open, 
  onClose, 
  initialTime 
}) => {
  const { addEvent } = useEventStore();
  
  const handleSave = (event: any) => {
    // Generate a unique ID for the new event
    const newEvent = {
      ...event,
      id: nanoid()
    };
    
    addEvent(newEvent);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 border-white/10">
        <EnhancedEventForm
          initialEvent={initialTime ? {
            date: initialTime.date.toISOString().split('T')[0],
            description: `${initialTime.startTime} - ${getEndTime(initialTime.startTime)} | `
          } : undefined}
          onSave={handleSave}
          onCancel={onClose}
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
