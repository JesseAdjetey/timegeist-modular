
import React from 'react';
import AlarmItem from './AlarmItem';
import { AlarmDisplay } from '@/types/database';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AlarmListProps {
  alarms: AlarmDisplay[];
  loading: boolean;
  onToggleAlarm: (id: string, isActive: boolean) => void;
  onDeleteAlarm: (id: string) => void;
  formatRecurringPattern: (alarm: AlarmDisplay) => string | null;
}

const AlarmList: React.FC<AlarmListProps> = ({ 
  alarms, 
  loading, 
  onToggleAlarm, 
  onDeleteAlarm,
  formatRecurringPattern
}) => {
  if (loading) {
    return <div className="py-4 text-center text-sm opacity-70">Loading alarms...</div>;
  }

  if (alarms.length === 0) {
    return <div className="py-4 text-center text-sm opacity-70">No alarms set</div>;
  }

  return (
    <ScrollArea className="max-h-60 overflow-y-auto mb-3">
      <div className="space-y-2 pr-2">
        {alarms.map(alarm => (
          <AlarmItem 
            key={alarm.id}
            alarm={alarm}
            onToggle={onToggleAlarm}
            onDelete={onDeleteAlarm}
            formatRecurringPattern={formatRecurringPattern}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default AlarmList;
