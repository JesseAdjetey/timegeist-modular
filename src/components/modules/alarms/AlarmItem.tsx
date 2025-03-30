
import React from 'react';
import { Clock, RefreshCw, X } from 'lucide-react';
import { AlarmDisplay } from '@/types/database';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  const handleToggle = () => {
    onToggle(alarm.id, alarm.is_active);
    console.log(`Toggling alarm ${alarm.id} to ${!alarm.is_active}`);
  };
  
  const handleDelete = () => {
    console.log(`Deleting alarm ${alarm.id}`);
    onDelete(alarm.id);
  };
  
  return (
    <div 
      className="flex items-center gap-2 bg-white/5 p-2 rounded-lg"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`w-4 h-4 rounded-full flex-shrink-0 cursor-pointer ${
              alarm.is_active ? 'bg-primary' : 'bg-secondary'
            }`}
            onClick={handleToggle}
            role="button"
            aria-pressed={alarm.is_active}
            aria-label={`Toggle alarm ${alarm.is_active ? 'off' : 'on'}`}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{alarm.is_active ? 'Active' : 'Inactive'}</p>
        </TooltipContent>
      </Tooltip>
      
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
        onClick={handleDelete}
        className="text-destructive/70 hover:text-destructive"
        aria-label="Delete alarm"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default AlarmItem;
