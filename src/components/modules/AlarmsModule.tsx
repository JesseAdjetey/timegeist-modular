
import React, { useState } from 'react';
import ModuleContainer from './ModuleContainer';
import { Clock, Bell } from 'lucide-react';

interface Alarm {
  id: string;
  title: string;
  time: string;
  isActive: boolean;
}

interface AlarmsModuleProps {
  title?: string;
  onRemove?: () => void;
  onTitleChange?: (title: string) => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  isDragging?: boolean;
  initialAlarms?: Alarm[];
}

const AlarmsModule: React.FC<AlarmsModuleProps> = ({ 
  title = "Alarms",
  onRemove, 
  onTitleChange,
  onMinimize,
  isMinimized = false,
  isDragging = false,
  initialAlarms = [] 
}) => {
  const [alarms, setAlarms] = useState<Alarm[]>(initialAlarms);
  const [newAlarmTitle, setNewAlarmTitle] = useState('');
  const [newAlarmTime, setNewAlarmTime] = useState('08:00');

  const addAlarm = () => {
    if (newAlarmTitle.trim()) {
      const newAlarm: Alarm = {
        id: Date.now().toString(),
        title: newAlarmTitle,
        time: newAlarmTime,
        isActive: true
      };
      setAlarms([...alarms, newAlarm]);
      setNewAlarmTitle('');
    }
  };

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id ? { ...alarm, isActive: !alarm.isActive } : alarm
    ));
  };

  const deleteAlarm = (id: string) => {
    setAlarms(alarms.filter(alarm => alarm.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addAlarm();
    }
  };

  return (
    <ModuleContainer 
      title={title} 
      onRemove={onRemove}
      onTitleChange={onTitleChange}
      onMinimize={onMinimize}
      isMinimized={isMinimized}
      isDragging={isDragging}
    >
      <div className="max-h-60 overflow-y-auto mb-3">
        {alarms.map(alarm => (
          <div 
            key={alarm.id}
            className="flex items-center gap-2 bg-white/5 p-2 rounded-lg mb-2"
          >
            <div 
              className={`w-4 h-4 rounded-full flex-shrink-0 ${alarm.isActive ? 'bg-primary' : 'bg-secondary'}`}
              onClick={() => toggleAlarm(alarm.id)}
            />
            <div className="flex flex-col flex-1">
              <span className="text-sm">{alarm.title}</span>
              <span className="text-xs opacity-70 flex items-center gap-1">
                <Clock size={12} />
                {alarm.time}
              </span>
            </div>
            <button 
              onClick={() => deleteAlarm(alarm.id)}
              className="text-destructive/70 hover:text-destructive"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newAlarmTitle}
            onChange={(e) => setNewAlarmTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="glass-input w-full"
            placeholder="Alarm title..."
          />
          <input 
            type="time"
            value={newAlarmTime}
            onChange={(e) => setNewAlarmTime(e.target.value)}
            className="glass-input"
          />
        </div>
        <button
          onClick={addAlarm}
          className="bg-primary px-3 py-1 w-full rounded-md hover:bg-primary/80 transition-colors"
        >
          <span className="flex items-center justify-center gap-1">
            <Bell size={14} />
            Add Alarm
          </span>
        </button>
      </div>
    </ModuleContainer>
  );
};

export default AlarmsModule;
