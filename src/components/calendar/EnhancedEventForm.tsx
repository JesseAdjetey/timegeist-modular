
import React, { useState } from 'react';
import { CalendarEventType } from '@/lib/stores/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Bell, 
  Lock, 
  Unlock, 
  CheckSquare,
  CalendarClock,
  Sparkles
} from 'lucide-react';
import { useDateStore } from '@/lib/store';
import dayjs from 'dayjs';

interface EventFormProps {
  initialEvent?: Partial<CalendarEventType>;
  onSave: (event: CalendarEventType) => void;
  onCancel: () => void;
  onUseAI?: () => void;
}

const EnhancedEventForm: React.FC<EventFormProps> = ({ 
  initialEvent, 
  onSave, 
  onCancel,
  onUseAI
}) => {
  const { userSelectedDate } = useDateStore();
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [description, setDescription] = useState(initialEvent?.description?.split('|')[1]?.trim() || '');
  const [date, setDate] = useState(initialEvent?.date || userSelectedDate.format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isLocked, setIsLocked] = useState(initialEvent?.isLocked || false);
  const [isTodo, setIsTodo] = useState(initialEvent?.isTodo || false);
  const [hasAlarm, setHasAlarm] = useState(initialEvent?.hasAlarm || false);
  const [hasReminder, setHasReminder] = useState(initialEvent?.hasReminder || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEvent: CalendarEventType = {
      id: initialEvent?.id || 'temp-id', // Will be replaced with nanoid in the parent component
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

  const formattedDate = dayjs(date).format('dddd, MMMM D');

  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold gradient-text mb-1">Add Event</h2>
        <p className="text-muted-foreground text-sm">Create a new event on your calendar</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title input */}
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-background/30 border-white/10 focus:border-primary h-12 text-base"
            placeholder="Event title"
            required
          />
        </div>
        
        {/* Date and time row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-white/10 bg-background/30">
            <CalendarIcon size={18} className="text-primary/80" />
            <span>{formattedDate}</span>
          </div>
          
          <div className="flex items-center h-[42px] rounded-md border border-white/10 bg-background/30 overflow-hidden">
            <Clock size={18} className="text-primary/80 ml-4" />
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border-0 bg-transparent h-full"
              required
            />
            <div className="mx-1 text-white/50">-</div>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border-0 bg-transparent h-full"
              required
            />
          </div>
        </div>
        
        {/* Description */}
        <div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px] bg-background/30 border-white/10 focus:border-primary resize-none"
            placeholder="Event description"
          />
        </div>
        
        {/* Event options */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => setIsTodo(!isTodo)}
            variant={isTodo ? "default" : "outline"}
            className={`rounded-full text-sm h-9 ${isTodo ? 'bg-primary/90' : 'bg-background/30 border-white/10'}`}
          >
            <CheckSquare size={16} className="mr-1" />
            To-do
          </Button>
          
          <Button
            type="button"
            onClick={() => setHasAlarm(!hasAlarm)}
            variant={hasAlarm ? "default" : "outline"}
            className={`rounded-full text-sm h-9 ${hasAlarm ? 'bg-primary/90' : 'bg-background/30 border-white/10'}`}
          >
            <Bell size={16} className="mr-1" />
            Alarm
          </Button>
          
          <Button
            type="button"
            onClick={() => setHasReminder(!hasReminder)}
            variant={hasReminder ? "default" : "outline"}
            className={`rounded-full text-sm h-9 ${hasReminder ? 'bg-primary/90' : 'bg-background/30 border-white/10'}`}
          >
            <CalendarClock size={16} className="mr-1" />
            Reminder
          </Button>
          
          <Button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            variant={isLocked ? "default" : "outline"}
            className={`rounded-full text-sm h-9 ${isLocked ? 'bg-primary/90' : 'bg-background/30 border-white/10'}`}
          >
            {isLocked ? (
              <><Lock size={16} className="mr-1" /> Locked</>
            ) : (
              <><Unlock size={16} className="mr-1" /> Unlocked</>
            )}
          </Button>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="border-white/10 hover:bg-white/10"
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/80"
          >
            Add Event
          </Button>
        </div>
        
        {/* AI assistant button */}
        {onUseAI && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onUseAI}
            className="w-full mt-2 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Sparkles size={16} className="mr-2" />
            Use Mally AI Assistant
          </Button>
        )}
      </form>
    </div>
  );
};

export default EnhancedEventForm;
