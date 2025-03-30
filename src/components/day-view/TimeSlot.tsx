
import React from "react";
import dayjs from "dayjs";
import CalendarEvent from "../calendar/CalendarEvent";
import { useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTimeInfo } from "../calendar/event-utils/touch-handlers";

interface TimeSlotProps {
  hour: dayjs.Dayjs;
  events: any[];
  onTimeSlotClick: (hour: dayjs.Dayjs) => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ hour, events, onTimeSlotClick }) => {
  const { openEventSummary, toggleEventLock, updateEvent } = useEventStore();

  // Handle dropping an event onto a time slot
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      // Get the drag data
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Don't process if the event is locked
      if (data.isLocked) return;
      
      // Calculate new time - keep the same duration but update the start time
      const oldStart = data.timeStart;
      const oldEnd = data.timeEnd;
      
      // Calculate duration in minutes
      const oldStartParts = oldStart.split(':').map(Number);
      const oldEndParts = oldEnd.split(':').map(Number);
      const oldStartMinutes = oldStartParts[0] * 60 + oldStartParts[1];
      const oldEndMinutes = oldEndParts[0] * 60 + oldEndParts[1];
      const durationMinutes = oldEndMinutes - oldStartMinutes;
      
      // Set new start time to the hour of the drop target
      const newStartTime = hour.format("HH:00");
      
      // Calculate new end time
      const newStartParts = newStartTime.split(':').map(Number);
      const newStartMinutes = newStartParts[0] * 60 + newStartParts[1];
      const newEndMinutes = newStartMinutes + durationMinutes;
      
      const newEndHours = Math.floor(newEndMinutes / 60) % 24;
      const newEndMinutes2 = newEndMinutes % 60;
      
      const newEndTime = `${newEndHours.toString().padStart(2, '0')}:${newEndMinutes2.toString().padStart(2, '0')}`;
      
      // Get description without time part
      const descriptionParts = data.description.split('|');
      const descriptionText = descriptionParts.length > 1 ? descriptionParts[1].trim() : '';
      
      // Create the updated event
      const updatedEvent = {
        ...data,
        description: `${newStartTime} - ${newEndTime} | ${descriptionText}`
      };
      
      // Update the event in the store
      updateEvent(updatedEvent);
      
      // Show success message
      toast.success("Event moved to " + newStartTime);
      
    } catch (error) {
      console.error("Error handling drop:", error);
      toast.error("Failed to move event");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Get events for this specific hour slot
  const hourEvents = events.filter(event => {
    const timeInfo = getTimeInfo(event.description);
    const eventHour = parseInt(timeInfo.start.split(':')[0], 10);
    return eventHour === hour.hour();
  });

  return (
    <div
      className="relative flex h-20 border-t border-white/10 hover:bg-white/5 gradient-border cursor-glow"
      onClick={() => onTimeSlotClick(hour)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Events for this hour */}
      {hourEvents.map(event => (
        <div 
          key={event.id} 
          className="absolute inset-x-2 z-10"
          style={{ top: '2px' }}
          onClick={(e) => {
            e.stopPropagation();
            openEventSummary(event);
          }}
        >
          <CalendarEvent
            event={event}
            color={event.color}
            isLocked={event.isLocked}
            hasAlarm={event.hasAlarm}
            hasReminder={event.hasReminder}
            hasTodo={event.isTodo}
            participants={event.participants}
            onClick={() => openEventSummary(event)}
            onLockToggle={(isLocked) => toggleEventLock(event.id, isLocked)}
          />
        </div>
      ))}
    </div>
  );
};

export default TimeSlot;
