
import React from 'react';
import { cn } from '@/lib/utils';
import { useEventDrag } from '@/hooks/use-event-drag';
import EventIndicators from './event-components/EventIndicators';
import EventLockToggle from './event-components/EventLockToggle';
import DragHandle from './event-components/DragHandle';
import ResizeHandle from './event-components/ResizeHandle';
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
  onResize?: (event: CalendarEventType, newEndTime: string) => void;
  onMouseDown?: (e: React.MouseEvent) => void; // Add the missing prop
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
  onLockToggle,
  onResize,
  onMouseDown
}) => {
  const {
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick
  } = useEventDrag(event, isLocked, color);

  const handleLockToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLockToggle) onLockToggle(!isLocked);
  };

  return (
    <div 
      className={cn(
        "calendar-event group", 
        color,
        !isLocked && "cursor-move",
        isDragging && "opacity-70"
      )}
      onClick={(e) => handleClick(e, onClick)}
      onMouseDown={onMouseDown} // Add the onMouseDown handler
      draggable={!isLocked}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative">
        {/* Lock/Unlock Button */}
        <EventLockToggle 
          isLocked={isLocked} 
          onToggle={handleLockToggle} 
        />

        {/* Drag Handle (only shown if not locked) */}
        {!isLocked && <DragHandle />}

        {/* Event Title */}
        <div className="font-medium">{event.title}</div>
        
        {/* Event Time or Description */}
        <div className="text-xs opacity-80">{event.description}</div>
        
        {/* Indicators */}
        <EventIndicators
          hasAlarm={hasAlarm}
          hasReminder={hasReminder}
          hasTodo={hasTodo}
          participants={participants}
        />
      </div>
      
      {/* Resize Handle (only shown if not locked) */}
      {!isLocked && onResize && <ResizeHandle />}
    </div>
  );
};

export default CalendarEvent;
