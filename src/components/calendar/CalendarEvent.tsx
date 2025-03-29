
import React from 'react';
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

  const handleDragStart = (e: React.DragEvent) => {
    // Don't allow dragging if event is locked
    if (isLocked) {
      e.preventDefault();
      return;
    }
    
    // Set drag data with event information
    const timeInfo = getTimeInfo();
    const dragData = {
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
      color
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a custom drag image or use default
    // We could create a custom element here, but using default for now
  };

  return (
    <div 
      className={cn(
        "calendar-event group", 
        color,
        !isLocked && "cursor-move"
      )}
      onClick={onClick}
      draggable={!isLocked}
      onDragStart={handleDragStart}
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
          {participants.length > 0 && (
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
