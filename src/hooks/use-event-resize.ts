
import { useState, useRef, useCallback, useEffect } from 'react';
import { CalendarEventType } from '@/lib/stores/types';
import { formatMinutesAsTime, getTimeInfo, getTimeInMinutes } from '@/components/calendar/event-utils/touch-handlers';
import { toast } from 'sonner';

export function useEventResize(
  hourHeight: number = 80,
  onResize?: (event: CalendarEventType, newEndTime: string) => void
) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartPos = useRef<number | null>(null);
  const originalEvent = useRef<CalendarEventType | null>(null);
  const originalEndTime = useRef<string | null>(null);
  const originalHeight = useRef<number | null>(null);
  const targetElement = useRef<HTMLElement | null>(null);

  const handleResizeStart = useCallback((e: MouseEvent, event: CalendarEventType) => {
    if (e.target instanceof HTMLElement && e.target.closest('[data-resize-handle="true"]')) {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStartPos.current = e.clientY;
      originalEvent.current = event;
      originalEndTime.current = getTimeInfo(event.description).end;
      
      // Find the event container element
      const eventElement = (e.target as HTMLElement).closest('.calendar-event');
      if (eventElement && eventElement.parentElement) {
        targetElement.current = eventElement.parentElement;
        originalHeight.current = eventElement.parentElement.clientHeight;
      }
      
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      // Prevent other click events while resizing
      document.body.style.userSelect = 'none';
    }
  }, []);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || resizeStartPos.current === null || !targetElement.current || originalHeight.current === null) return;
    
    e.preventDefault();
    
    // Calculate the distance moved in pixels
    const deltaY = e.clientY - resizeStartPos.current;
    
    // Update visual height of the event during resize
    const newHeight = originalHeight.current + deltaY;
    if (newHeight >= 20) { // Minimum height of 20px
      targetElement.current.style.height = `${newHeight}px`;
    }
  }, [isResizing]);

  const handleResizeEnd = useCallback((e: MouseEvent) => {
    if (isResizing && originalEvent.current && originalEndTime.current && originalHeight.current !== null) {
      const deltaY = e.clientY - (resizeStartPos.current || 0);
      
      // Convert pixel change to minutes (each hourHeight is 60 minutes)
      const deltaMinutes = Math.round((deltaY / hourHeight) * 60);
      
      // Get original times
      const timeInfo = getTimeInfo(originalEvent.current.description);
      const originalStartMinutes = getTimeInMinutes(timeInfo.start);
      const originalEndMinutes = getTimeInMinutes(originalEndTime.current);
      
      // Calculate new end time in minutes
      let newEndMinutes = originalEndMinutes + deltaMinutes;
      
      // Ensure minimum duration (15 minutes)
      if (newEndMinutes - originalStartMinutes < 15) {
        newEndMinutes = originalStartMinutes + 15;
      }
      
      // Format back to time string
      const newEndTime = formatMinutesAsTime(newEndMinutes);
      
      // Call the onResize callback with updated times
      if (onResize) {
        onResize(originalEvent.current, newEndTime);
        toast.success(`Event resized: ${timeInfo.start} - ${newEndTime}`);
      }
      
      // Reset the element's inline style 
      if (targetElement.current) {
        targetElement.current.style.height = '';
      }
    }
    
    // Clean up
    setIsResizing(false);
    resizeStartPos.current = null;
    originalEvent.current = null;
    originalEndTime.current = null;
    originalHeight.current = null;
    targetElement.current = null;
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.userSelect = '';
  }, [isResizing, hourHeight, onResize]);

  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.userSelect = '';
    };
  }, [handleResizeMove, handleResizeEnd]);

  return {
    isResizing,
    handleResizeStart
  };
}
