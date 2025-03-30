
import React from "react";
import dayjs from "dayjs";
import CalendarEvent from "../calendar/CalendarEvent";
import { useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTimeInfo } from "../calendar/event-utils/touch-handlers";
import { nanoid } from "nanoid";
import { CalendarEventType } from "@/lib/stores/types";
import { useCalendarEvents } from "@/hooks/use-calendar-events";

interface TimeSlotProps {
  hour: dayjs.Dayjs;
  events: any[];
  onTimeSlotClick: (hour: dayjs.Dayjs) => void;
  addEvent?: (event: CalendarEventType) => Promise<any>;
  openEventForm?: (todoData: any, hour: dayjs.Dayjs) => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ 
  hour, 
  events, 
  onTimeSlotClick,
  addEvent,
  openEventForm
}) => {
  const { openEventSummary, toggleEventLock } = useEventStore();
  const { updateEvent } = useCalendarEvents();

  // Handle dropping an event onto a time slot
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    console.log("Drop event received in TimeSlot:", hour.format("HH:mm"));
    
    try {
      // Get the drag data
      const dataString = e.dataTransfer.getData('application/json');
      if (!dataString) {
        console.error("No data found in drag event");
        return;
      }
      
      const data = JSON.parse(dataString);
      console.log("Received drop data in TimeSlot:", data);
      
      // Handle todo item drag
      if (data.source === 'todo-module') {
        console.log("Todo item detected, opening form:", openEventForm !== undefined);
        if (openEventForm) {
          // Open event form with todo data
          openEventForm(data, hour);
          return;
        }
        
        if (addEvent) {
          handleTodoDrop(data, hour);
        }
        return;
      }
      
      // Don't process if the event is locked
      if (data.isLocked) {
        console.log("Event is locked, ignoring drop");
        return;
      }
      
      // Calculate precise drop position to snap to 30-minute intervals
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const hourHeight = rect.height;
      const minutesWithinHour = Math.floor((relativeY / hourHeight) * 60);
      
      // Snap to nearest 30-minute interval (0 or 30)
      const snappedMinutes = minutesWithinHour < 30 ? 0 : 30;
      
      // Set new start time to the hour with snapped minutes
      const baseHour = hour.hour();
      const newStartTime = `${baseHour.toString().padStart(2, '0')}:${snappedMinutes.toString().padStart(2, '0')}`;
      
      // Calculate new end time by preserving duration
      const oldStartParts = data.timeStart.split(':').map(Number);
      const oldEndParts = data.timeEnd.split(':').map(Number);
      const oldStartMinutes = oldStartParts[0] * 60 + oldStartParts[1];
      const oldEndMinutes = oldEndParts[0] * 60 + oldEndParts[1];
      const durationMinutes = oldEndMinutes - oldStartMinutes;
      
      // Calculate new end time
      const newStartMinutes = baseHour * 60 + snappedMinutes;
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
      
      console.log("Updating event with new time:", updatedEvent);
      
      // Update the event in the database
      updateEvent(updatedEvent);
      
      // Show success message
      toast.success("Event moved to " + newStartTime);
      
    } catch (error) {
      console.error("Error handling drop:", error);
      toast.error("Failed to move event");
    }
  };

  // Handle dropping a todo item onto the calendar
  const handleTodoDrop = async (todoData: any, hour: dayjs.Dayjs) => {
    console.log("Handling todo drop in TimeSlot", todoData);
    if (!addEvent || !todoData || !todoData.id || !todoData.text) {
      console.error("Invalid todo data or missing addEvent function:", todoData, addEvent);
      return;
    }
    
    // Format time strings
    const startTime = hour.format("HH:00");
    const endTime = hour.add(1, 'hour').format("HH:00");
    
    // Create a new calendar event from the todo item
    const newEvent: CalendarEventType = {
      id: nanoid(), // This will be replaced by the database
      title: todoData.text,
      date: dayjs().format('YYYY-MM-DD'), // Current date
      description: `${startTime} - ${endTime} | ${todoData.text}`,
      color: 'bg-purple-500/70', // Special color for todo events
      isTodo: true, // Mark as a todo event
      todoId: todoData.id // Reference back to original todo
    };
    
    console.log("Adding new event from todo:", newEvent);
    
    try {
      // Add to database
      const response = await addEvent(newEvent);
      
      if (response.success) {
        toast.success(`Todo "${todoData.text}" added to calendar at ${startTime}`);
      } else {
        toast.error(`Failed to add todo: ${response.message}`);
      }
    } catch (error) {
      console.error("Error adding event from todo:", error);
      toast.error("Failed to add todo to calendar");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    console.log("Drag over event in TimeSlot", hour.format("HH:mm"));
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
      data-hour={hour.format('HH:mm')}
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
