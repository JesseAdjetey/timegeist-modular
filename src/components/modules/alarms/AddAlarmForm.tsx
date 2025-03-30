
import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import RecurringOptions from './RecurringOptions';

interface AddAlarmFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  newAlarmTitle: string;
  setNewAlarmTitle: (title: string) => void;
  newAlarmTime: string;
  setNewAlarmTime: (time: string) => void;
  newAlarmDate: string;
  setNewAlarmDate: (date: string) => void;
  isRecurring: boolean;
  setIsRecurring: (isRecurring: boolean) => void;
  recurringType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  setRecurringType: (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
  recurringInterval: number;
  setRecurringInterval: (interval: number) => void;
  recurringDays: number[];
  toggleRecurringDay: (day: number) => void;
  recurringMonths: number[];
  toggleRecurringMonth: (month: number) => void;
  recurringDayOfMonth?: number;
  setRecurringDayOfMonth: (day?: number) => void;
  recurringEndDate?: string;
  setRecurringEndDate: (date?: string) => void;
  addAlarm: () => void;
  getWeekdayName: (day: number) => string;
  getMonthName: (month: number) => string;
}

const AddAlarmForm: React.FC<AddAlarmFormProps> = ({
  isOpen,
  setIsOpen,
  newAlarmTitle,
  setNewAlarmTitle,
  newAlarmTime,
  setNewAlarmTime,
  newAlarmDate,
  setNewAlarmDate,
  isRecurring,
  setIsRecurring,
  recurringType,
  setRecurringType,
  recurringInterval,
  setRecurringInterval,
  recurringDays,
  toggleRecurringDay,
  recurringMonths,
  toggleRecurringMonth,
  recurringDayOfMonth,
  setRecurringDayOfMonth,
  recurringEndDate,
  setRecurringEndDate,
  addAlarm,
  getWeekdayName,
  getMonthName
}) => {
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          className="bg-primary px-3 py-1 w-full rounded-md hover:bg-primary/80 transition-colors"
        >
          <span className="flex items-center justify-center gap-1">
            <Bell size={14} />
            Add Alarm
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 backdrop-blur-lg border border-white/10 bg-black/50">
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Create New Alarm</h3>
          
          <div>
            <input
              type="text"
              value={newAlarmTitle}
              onChange={(e) => setNewAlarmTitle(e.target.value)}
              className="glass-input w-full"
              placeholder="Alarm title..."
            />
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <input 
                type="date"
                value={newAlarmDate}
                onChange={(e) => setNewAlarmDate(e.target.value)}
                className="glass-input w-full"
              />
            </div>
            <div>
              <input 
                type="time"
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
                className="glass-input w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
              id="recurring"
            />
            <Label htmlFor="recurring" className="text-sm">Recurring alarm</Label>
          </div>
          
          {isRecurring && (
            <RecurringOptions
              recurringType={recurringType}
              setRecurringType={setRecurringType}
              recurringInterval={recurringInterval}
              setRecurringInterval={setRecurringInterval}
              recurringDays={recurringDays}
              toggleRecurringDay={toggleRecurringDay}
              recurringMonths={recurringMonths}
              toggleRecurringMonth={toggleRecurringMonth}
              recurringDayOfMonth={recurringDayOfMonth}
              setRecurringDayOfMonth={setRecurringDayOfMonth}
              recurringEndDate={recurringEndDate}
              setRecurringEndDate={setRecurringEndDate}
              getWeekdayName={getWeekdayName}
              getMonthName={getMonthName}
            />
          )}
          
          <Button
            onClick={addAlarm}
            className="w-full"
          >
            Save Alarm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddAlarmForm;
