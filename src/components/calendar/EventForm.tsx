
import React, { useState } from 'react';
import { CalendarEventType } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarClock, Bell, Lock, Unlock, Users } from 'lucide-react';

interface EventFormProps {
  initialEvent?: Partial<CalendarEventType>;
  onSave: (event: CalendarEventType) => void;
  onCancel: () => void;
  onUseAI?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ 
  initialEvent, 
  onSave, 
  onCancel,
  onUseAI
}) => {
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [date, setDate] = useState(initialEvent?.date || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isLocked, setIsLocked] = useState(false);
  const [isTodo, setIsTodo] = useState(false);
  const [hasAlarm, setHasAlarm] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEvent: CalendarEventType = {
      id: initialEvent?.id || Date.now().toString(),
      title,
      description: `${startTime} - ${endTime} | ${description}`,
      date,
      isLocked,
      isTodo,
      hasAlarm,
      hasReminder
    };
    
    onSave(newEvent);
  };

  return (
    <div className="p-4 glass-card max-w-md w-full">
      <h2 className="text-xl font-bold mb-4 text-primary">
        {initialEvent?.id ? 'Edit Event' : 'Add Event'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-input w-full"
            placeholder="Event title"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <div className="flex items-center">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="glass-input w-full"
                required
              />
              <span className="mx-2">-</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="glass-input w-full"
                required
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="glass-input w-full min-h-[80px]"
            placeholder="Event description"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div 
            className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 cursor-pointer transition-all ${isLocked ? 'bg-primary/80' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={() => setIsLocked(!isLocked)}
          >
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            {isLocked ? 'Locked' : 'Unlocked'}
          </div>
          
          <div 
            className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 cursor-pointer transition-all ${isTodo ? 'bg-primary/80' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={() => setIsTodo(!isTodo)}
          >
            <Calendar size={14} />
            To-do
          </div>
          
          <div 
            className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 cursor-pointer transition-all ${hasAlarm ? 'bg-primary/80' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={() => setHasAlarm(!hasAlarm)}
          >
            <Bell size={14} />
            Alarm
          </div>
          
          <div 
            className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 cursor-pointer transition-all ${hasReminder ? 'bg-primary/80' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={() => setHasReminder(!hasReminder)}
          >
            <CalendarClock size={14} />
            Reminder
          </div>
        </div>
        
        <div className="flex justify-between gap-3 pt-2">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          
          {onUseAI && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onUseAI}
              className="flex-1 border-primary/50 text-primary hover:text-primary-foreground"
            >
              Use Mally AI
            </Button>
          )}
          
          <Button 
            type="submit" 
            className="flex-1 bg-primary hover:bg-primary/80"
          >
            Save
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
