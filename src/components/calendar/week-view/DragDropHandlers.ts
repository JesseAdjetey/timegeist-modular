import { toast } from "sonner";
import { CalendarEventType } from "@/lib/stores/types";
import dayjs from "dayjs";
import { formatMinutesAsTime, getTimeInMinutes } from "../event-utils/touch-handlers";
import { nanoid } from "nanoid";

export const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

export const handleDrop = (
  e: React.DragEvent, 
  day: dayjs.Dayjs, 
  hour: dayjs.Dayjs,
  updateEvent: (event: CalendarEventType) => void,
  addEvent?: (event: CalendarEventType) => void,
  openEventForm?: (todoData: any, date: Date, timeStart: string) => void
) => {
  e.preventDefault();
  
  try {
    // Get the drag data
    const dataString = e.dataTransfer.getData('application/json');
    if (!dataString) {
      console.error("No data found in drag event");
      return;
    }
    
    const data = JSON.parse(dataString);
    console.log("Week view received drop data:", data);
    
    // Handle todo item drag
    if (data.source === 'todo-module') {
      // If we have the openEventForm function, use it instead of immediately creating an event
      if (openEventForm) {
        // Calculate precise drop time based on cursor position
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const hourHeight = rect.height;
        const minutesWithinHour = Math.floor((relativeY / hourHeight) * 60);
        
        // Snap to nearest 30-minute interval (0 or 30)
        const snappedMinutes = minutesWithinHour < 30 ? 0 : 30;
        
        // Get the base hour and add the snapped minutes
        const baseHour = hour.hour();
        const startTime = `${baseHour.toString().padStart(2, '0')}:${snappedMinutes.toString().padStart(2, '0')}`;
        
        console.log("Opening event form with todo data:", data, "time:", startTime);
        
        // Open the event form with the todo data
        openEventForm(data, day.toDate(), startTime);
        return;
      }
      
      handleTodoDrop(data, day, hour, addEvent);
      return;
    }
    
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

// Handle dropping a todo item onto the calendar
const handleTodoDrop = (
  todoData: any,
  day: dayjs.Dayjs,
  hour: dayjs.Dayjs,
  addEvent?: (event: CalendarEventType) => void
) => {
  if (!addEvent || !todoData || !todoData.id || !todoData.text) {
    console.error("Invalid todo data or missing addEvent function:", todoData);
    return;
  }
  
  // Format time strings
  const startTime = hour.format("HH:00");
  const endTime = hour.add(1, 'hour').format("HH:00");
  
  // Create a new calendar event from the todo item
  const newEvent: CalendarEventType = {
    id: nanoid(),
    title: todoData.text,
    date: day.format('YYYY-MM-DD'),
    description: `${startTime} - ${endTime} | ${todoData.text}`,
    color: 'bg-purple-500/70', // Special color for todo events
    isTodo: true, // Mark as a todo event
    todoId: todoData.id // Reference back to original todo
  };
  
  console.log("Week view adding new event from todo:", newEvent);
  
  // Add the event to the store
  addEvent(newEvent);
  
  // Show success message
  toast.success(`Todo "${todoData.text}" added to calendar at ${startTime}`);
};
