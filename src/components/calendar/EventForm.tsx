
// src/components/calendar/EventForm.tsx

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { nanoid } from "nanoid";
import { useEventStore } from "@/lib/store";
import EnhancedEventForm from "./EnhancedEventForm";
import { toast } from "sonner";
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
      
      try {
        const startDate = initialTime.date.toISOString().split("T")[0];
        const startHour = parseInt(initialTime.startTime.split(":")[0]);
        const startMinutes = parseInt(initialTime.startTime.split(":")[1] || "0");
        
        const startTimeFormatted = `${startHour.toString().padStart(2, "0")}:${startMinutes.toString().padStart(2, "0")}`;
        const startsAt = new Date(`${startDate}T${startTimeFormatted}:00`);
        
        const endHour = (startHour + 1) % 24;
        const endTime = `${endHour.toString().padStart(2, "0")}:${startMinutes.toString().padStart(2, "0")}`;
        const endsAt = new Date(`${startDate}T${endTime}:00`);

        let event: CalendarEventType = {
          id: nanoid(),
          title: "",
          description: `${startTimeFormatted} - ${endTime} | `,
          date: startDate,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString()
        };

        // If we have todo data, add it
        if (todoData) {
          event = {
            ...event,
            title: todoData.text,
            description: `${startTimeFormatted} - ${endTime} | ${todoData.text}`,
            isTodo: true,
            todoId: todoData.id,
            color: "bg-purple-500/70", // Special color for todo events
          };
        }

        setInitialEvent(event);
      } catch (error) {
        console.error("Error creating initial event:", error);
        toast.error("Failed to create event with the selected time");
      }
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
        toast.success(`Todo "${todoData.text}" added to calendar`);
      } else {
        toast.success("Event added to calendar");
      }
    }
    if (handleClose) handleClose();
  };

  const handleUseAI = () => {
    if (onUseAI) {
      onUseAI();
    } else {
      toast.success("AI assistance is coming soon!");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleClose && handleClose()}
    >
      <DialogContent className="sm:max-w-[550px] bg-background/95 border-white/10">
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

export default EventForm;
