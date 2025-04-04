
import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface EventLockToggleProps {
  isLocked: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

const EventLockToggle: React.FC<EventLockToggleProps> = ({ isLocked, onToggle }) => {
  return (
    <button 
      className="event-lock absolute right-1 top-1 z-20"
      onClick={(e) => {
        e.stopPropagation(); // Prevent triggering parent click events
        onToggle(e);
      }}
    >
      {isLocked ? 
        <Lock size={14} className="text-white/70" /> : 
        <Unlock size={14} className="text-white/70" />
      }
    </button>
  );
};

export default EventLockToggle;
