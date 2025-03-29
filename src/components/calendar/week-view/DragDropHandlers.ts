import { toast } from "sonner";
import { CalendarEventType } from "@/lib/stores/types";
import dayjs from "dayjs";

export const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

export const handleDrop = (
  e: React.DragEvent, 
  day: dayjs.Dayjs, 
  hour: dayjs.Dayjs,
  updateEvent: (event: CalendarEventType) => void
) => {
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
      date: day.format('YYYY-MM-DD'), // Set to the drop target day
      description: `${newStartTime} - ${newEndTime} | ${descriptionText}`
    };
    
    // Update the event in the store
    updateEvent(updatedEvent);
    
    // Show success message
    toast.success(`Event moved to ${day.format("MMM D")} at ${newStartTime}`);
    
  } catch (error) {
    console.error("Error handling drop:", error);
    toast.error("Failed to move event");
  }
};
