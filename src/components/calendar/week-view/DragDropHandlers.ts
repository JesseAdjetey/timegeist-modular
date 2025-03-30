
import { toast } from "sonner";
import { CalendarEventType } from "@/lib/stores/types";
import dayjs from "dayjs";
import { formatMinutesAsTime, getTimeInMinutes } from "../event-utils/touch-handlers";

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
    
    // Calculate precise drop time based on cursor position
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const hourHeight = rect.height;
    const minutesWithinHour = Math.floor((relativeY / hourHeight) * 60);
    
    // Snap to nearest 30-minute interval (0 or 30)
    const snappedMinutes = minutesWithinHour < 30 ? 0 : 30;
    
    // Get the base hour and add the snapped minutes
    const baseHour = hour.hour();
    const totalMinutes = baseHour * 60 + snappedMinutes;
    
    // Format as HH:MM
    const newStartTime = formatMinutesAsTime(totalMinutes);
    
    // Calculate new end time by preserving duration
    const oldStartMinutes = getTimeInMinutes(data.timeStart);
    const oldEndMinutes = getTimeInMinutes(data.timeEnd);
    const durationMinutes = oldEndMinutes - oldStartMinutes;
    
    const newEndMinutes = totalMinutes + durationMinutes;
    const newEndTime = formatMinutesAsTime(newEndMinutes);
    
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
