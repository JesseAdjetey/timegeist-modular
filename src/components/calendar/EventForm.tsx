
// src/components/calendar/EventForm.tsx

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { nanoid } from "nanoid";
import { useEventStore } from "@/lib/store";
import EnhancedEventForm from "./EnhancedEventForm";
import { toast } from "@/components/ui/use-toast";
import { CalendarEventType } from "@/lib/stores/types";

interface EventFormProps {
  open: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  initialTime?: {
    date: Date;
    startTime: string;
  };
  todoData?: any;
  onSave?: (event: any) => void;
  onUseAI?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({
  open,
  onClose,
  onCancel,
  initialTime,
  todoData,
  onSave: propOnSave,
  onUseAI,
}) => {
  const { addEvent } = useEventStore();
  const [initialEvent, setInitialEvent] = useState<CalendarEventType | undefined>(undefined);

  // Use onCancel or onClose, whichever is provided
  const handleClose = onCancel || onClose;

  // Log initialTime for debugging
  useEffect(() => {
    if (initialTime) {
      console.log("EventForm received initialTime:", initialTime);
    }
  }, [initialTime]);

  // Prepare initial event data when props change
  useEffect(() => {
    if (initialTime) {
      // Start with time data - make sure we have the current initialTime
      console.log("Setting initialEvent with time:", initialTime.startTime);
      
      const startDate = initialTime.date.toISOString().split("T")[0];
      const startsAt = new Date(
        `${startDate}T${initialTime.startTime}:00`
      ).toISOString();
      
      const startHour = parseInt(initialTime.startTime.split(":")[0]);
      const startMinutes = parseInt(initialTime.startTime.split(":")[1] || "0");
      const endTime = `${(startHour + 1) % 24}:${startMinutes.toString().padStart(2, "0")}`;
      const endsAt = new Date(
        `${startDate}T${endTime}:00`
      ).toISOString();

      let event: CalendarEventType = {
        id: nanoid(),
        title: "",
        description: `${initialTime.startTime} - ${getEndTime(initialTime.startTime)} | `,
        date: startDate,
        startsAt: startsAt,
        endsAt: endsAt
      };

      // If we have todo data, add it
      if (todoData) {
        event = {
          ...event,
          title: todoData.text,
          description: `${initialTime.startTime} - ${getEndTime(initialTime.startTime)} | ${todoData.text}`,
          isTodo: true,
          todoId: todoData.id,
          color: "bg-purple-500/70", // Special color for todo events
        };
      }

      setInitialEvent(event);
    } else {
      setInitialEvent(undefined);
    }
  }, [initialTime, todoData]);

  const handleSave = (event: CalendarEventType) => {
    // Generate a unique ID for the new event if it doesn't have one
    console.log("Event being saved:", event);

    if (propOnSave) {
      propOnSave(event);
    } else {
      addEvent(event);

      // Show a success message
      if (todoData) {
        toast({
          title: "Success",
          description: `Todo "${todoData.text}" added to calendar`,
        });
      } else {
        toast({
          title: "Success",
          description: "Event added to calendar",
        });
      }
    }
    if (handleClose) handleClose();
  };

  const handleUseAI = () => {
    if (onUseAI) {
      onUseAI();
    } else {
      toast({
        title: "Mally AI",
        description: "AI assistance is coming soon!",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleClose && handleClose()}
    >
      <DialogContent className="sm:max-w-[500px] bg-background/95 border-white/10">
        <DialogTitle className="sr-only">Add Event</DialogTitle>
        <EnhancedEventForm
          initialEvent={initialEvent}
          onSave={handleSave}
          onCancel={handleClose}
          onUseAI={handleUseAI}
        />
      </DialogContent>
    </Dialog>
  );
};

// Helper function to calculate an end time 1 hour after the start time
const getEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const endHour = (hours + 1) % 24;
  return `${endHour.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

export default EventForm;
