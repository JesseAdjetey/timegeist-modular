
import React, { useRef, useState } from 'react';
import { Lock, Unlock, Bell, CalendarClock, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarEventType } from '@/lib/store';

interface CalendarEventProps {
  event: CalendarEventType;
  color?: string;
  isLocked?: boolean;
  hasAlarm?: boolean;
  hasReminder?: boolean;
  hasTodo?: boolean;
  participants?: string[];
  onClick?: () => void;
  onLockToggle?: (locked: boolean) => void;
}

const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  color = 'bg-primary/70',
  isLocked = false,
  hasAlarm = false,
  hasReminder = false,
  hasTodo = false,
  participants = [],
  onClick,
  onLockToggle
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const touchTimeout = useRef<number | null>(null);
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);

  const handleLockToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLockToggle) onLockToggle(!isLocked);
  };

  // Extract time info for drag data
  const getTimeInfo = () => {
    if (!event.description) return { start: '09:00', end: '10:00' };
    
    const parts = event.description.split('|');
    if (parts.length >= 1) {
      const timesPart = parts[0].trim();
      const times = timesPart.split('-').map(t => t.trim());
      return {
        start: times[0] || '09:00',
        end: times[1] || '10:00'
      };
    }
    
    return { start: '09:00', end: '10:00' };
  };

  const getDragData = () => {
    // Set drag data with event information
    const timeInfo = getTimeInfo();
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      timeStart: timeInfo.start,
      timeEnd: timeInfo.end,
      isLocked,
      isTodo: hasTodo,
      hasAlarm,
      hasReminder,
      color,
      participants: event.participants
    };
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Don't allow dragging if event is locked
    if (isLocked) {
      e.preventDefault();
      return;
    }
    
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify(getDragData()));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLocked) return;
    
    // Save the initial touch position
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Use a timeout to differentiate between tap and drag
    touchTimeout.current = window.setTimeout(() => {
      setIsDragging(true);
    }, 200);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isLocked || !touchStartPos.current) return;
    
    // Clear the timeout to prevent it from triggering if we're dragging
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
      touchTimeout.current = null;
    }
    
    // If we're not in drag mode yet, check if we've moved enough to start dragging
    if (!isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      
      // If we've moved more than 10 pixels, start dragging
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        setIsDragging(true);
        
        // Create a custom event to notify parent components
        const eventElement = e.currentTarget;
        const dragData = getDragData();
        
        // Store the data in the element for later use
        (eventElement as any).dragData = dragData;
        
        // Dispatch a custom event to notify that touch dragging has started
        const customEvent = new CustomEvent('touchdragstart', {
          bubbles: true,
          detail: { dragData, element: eventElement, touch: e.touches[0] }
        });
        eventElement.dispatchEvent(customEvent);
      }
    }
    
    // If we're dragging, prevent the default behavior (scrolling)
    if (isDragging) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear any pending timeout
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
      touchTimeout.current = null;
    }
    
    if (isDragging) {
      const eventElement = e.currentTarget;
      const dragData = (eventElement as any).dragData;
      
      // Dispatch a custom event for touch drag end
      if (dragData) {
        const customEvent = new CustomEvent('touchdragend', {
          bubbles: true,
          detail: { dragData, clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }
        });
        eventElement.dispatchEvent(customEvent);
      }
      
      setIsDragging(false);
    }
    
    touchStartPos.current = null;
  };

  // Prevent click when dragging
  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.stopPropagation();
      return;
    }
    
    if (onClick) onClick();
  };

  return (
    <div 
      className={cn(
        "calendar-event group", 
        color,
        !isLocked && "cursor-move",
        isDragging && "opacity-70"
      )}
      onClick={handleClick}
      draggable={!isLocked}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative">
        {/* Lock/Unlock Button */}
        <button 
          className="event-lock"
          onClick={handleLockToggle}
        >
          {isLocked ? 
            <Lock size={14} className="text-white/70" /> : 
            <Unlock size={14} className="text-white/70" />
          }
        </button>

        {/* Drag Handle (only shown if not locked) */}
        {!isLocked && (
          <div className="absolute top-0 right-1 opacity-70 hover:opacity-100">
            <GripVertical size={14} className="text-white/70" />
          </div>
        )}

        {/* Event Title */}
        <div className="font-medium">{event.title}</div>
        
        {/* Event Time or Description */}
        <div className="text-xs opacity-80">{event.description}</div>
        
        {/* Indicators */}
        <div className="flex gap-1 mt-1">
          {hasAlarm && <Bell size={12} className="text-white/70" />}
          {hasReminder && <CalendarClock size={12} className="text-white/70" />}
          {hasTodo && <span className="text-xs">✓</span>}
          
          {/* Participants */}
          {participants && participants.length > 0 && (
            <div className="flex -space-x-1">
              {participants.slice(0, 3).map((participant, i) => (
                <div 
                  key={i}
                  className="h-4 w-4 rounded-full bg-white/30 text-[8px] flex items-center justify-center ring-1 ring-white/10"
                >
                  {participant.charAt(0)}
                </div>
              ))}
              {participants.length > 3 && (
                <div className="h-4 w-4 rounded-full bg-white/30 text-[8px] flex items-center justify-center ring-1 ring-white/10">
                  +{participants.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarEvent;
