
import React from 'react';
import { Clock, RefreshCw, X } from 'lucide-react';
import { AlarmDisplay } from '@/types/database';

interface AlarmItemProps {
  alarm: AlarmDisplay;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  formatRecurringPattern: (alarm: AlarmDisplay) => string | null;
}

const AlarmItem: React.FC<AlarmItemProps> = ({ 
  alarm, 
  onToggle, 
  onDelete,
  formatRecurringPattern
}) => {
  return (
    <div 
      className="flex items-center gap-2 bg-white/5 p-2 rounded-lg mb-2"
    >
      <div 
        className={`w-4 h-4 rounded-full flex-shrink-0 cursor-pointer ${
          alarm.is_active ? 'bg-primary' : 'bg-secondary'
        }`}
        onClick={() => onToggle(alarm.id, alarm.is_active)}
      />
      <div className="flex flex-col flex-1">
        <span className="text-sm">{alarm.title}</span>
        <span className="text-xs opacity-70 flex items-center gap-1">
          <Clock size={12} />
          {alarm.alarm_time}
          {alarm.is_recurring && (
            <span className="ml-1 flex items-center">
              <RefreshCw size={10} className="mr-1" />
              {formatRecurringPattern(alarm)}
            </span>
          )}
        </span>
      </div>
      <button 
        onClick={() => onDelete(alarm.id)}
        className="text-destructive/70 hover:text-destructive"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default AlarmItem;
