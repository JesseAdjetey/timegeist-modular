
import React from 'react';
import { Lock, Unlock, Bell, CalendarClock } from 'lucide-react';
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

  return (
    <div 
      className={cn(
        "calendar-event group", 
        color
      )}
      onClick={onClick}
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
