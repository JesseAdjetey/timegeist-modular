
import { useState, useRef, useCallback } from 'react';
import { CalendarEventType } from '@/lib/store';
import { formatMinutesAsTime, getTimeInfo, getTimeInMinutes } from '@/components/calendar/event-utils/touch-handlers';

export function useEventResize(
  hourHeight: number = 80,
  onResize?: (event: CalendarEventType, newEndTime: string) => void
) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartPos = useRef<number | null>(null);
  const originalEvent = useRef<CalendarEventType | null>(null);
  const originalEndTime = useRef<string | null>(null);

  const handleResizeStart = useCallback((e: MouseEvent, event: CalendarEventType) => {
    if (e.target instanceof HTMLElement && e.target.dataset.resizeHandle) {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStartPos.current = e.clientY;
      originalEvent.current = event;
      originalEndTime.current = getTimeInfo(event.description).end;
      
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }
  }, []);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeStartPos.current || !originalEndTime.current || !originalEvent.current) return;
    
    e.preventDefault();
    
    // Calculate the distance moved in pixels
    const deltaY = e.clientY - resizeStartPos.current;
    
    // Convert to minutes (each hourHeight is 60 minutes)
    const deltaMinutes = Math.floor((deltaY / hourHeight) * 60);
    
    // Add to the original end time
    const originalEndMinutes = getTimeInMinutes(originalEndTime.current);
    const newEndMinutes = originalEndMinutes + deltaMinutes;
    
    // Format back to time string
    const newEndTime = formatMinutesAsTime(newEndMinutes);
    
    // Update the event (visual only during resize)
    const eventElement = e.target as HTMLElement;
    if (eventElement && eventElement.parentElement) {
      const height = eventElement.parentElement.clientHeight + deltaY;
      eventElement.parentElement.style.height = `${height}px`;
    }
  }, [isResizing, hourHeight]);

  const handleResizeEnd = useCallback((e: MouseEvent) => {
    if (isResizing && originalEvent.current && originalEndTime.current) {
      const deltaY = e.clientY - (resizeStartPos.current || 0);
      const deltaMinutes = Math.floor((deltaY / hourHeight) * 60);
      
      // Ensure minimum duration (15 minutes)
      const originalStartMinutes = getTimeInMinutes(getTimeInfo(originalEvent.current.description).start);
      const originalEndMinutes = getTimeInMinutes(originalEndTime.current);
      
      let newEndMinutes = originalEndMinutes + deltaMinutes;
      
      // Ensure minimum 15 minutes duration
      if (newEndMinutes - originalStartMinutes < 15) {
        newEndMinutes = originalStartMinutes + 15;
      }
      
      // Format back to time string
      const newEndTime = formatMinutesAsTime(newEndMinutes);
      
      // Call the onResize callback
      if (onResize) {
        onResize(originalEvent.current, newEndTime);
      }
    }
    
    // Clean up
    setIsResizing(false);
    resizeStartPos.current = null;
    originalEvent.current = null;
    originalEndTime.current = null;
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [isResizing, hourHeight, onResize]);

  return {
    isResizing,
    handleResizeStart
  };
}
