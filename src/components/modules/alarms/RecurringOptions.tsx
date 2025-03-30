
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RecurringOptionsProps {
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
  getWeekdayName: (day: number) => string;
  getMonthName: (month: number) => string;
}

const RecurringOptions: React.FC<RecurringOptionsProps> = ({
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
  getWeekdayName,
  getMonthName
}) => {
  return (
    <div className="space-y-3 mt-3 p-3 bg-black/20 rounded-md">
      <div className="space-y-2">
        <Label>Repeat</Label>
        <RadioGroup 
          value={recurringType}
          onValueChange={(value) => setRecurringType(value as any)}
          className="flex gap-3"
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="daily" id="daily" />
            <Label htmlFor="daily" className="text-xs">Daily</Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="weekly" id="weekly" />
            <Label htmlFor="weekly" className="text-xs">Weekly</Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="monthly" id="monthly" />
            <Label htmlFor="monthly" className="text-xs">Monthly</Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="yearly" id="yearly" />
            <Label htmlFor="yearly" className="text-xs">Yearly</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label>Every</Label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="99"
            value={recurringInterval}
            onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 1)}
            className="glass-input w-16"
          />
          <span>
            {recurringType === 'daily' && 'days'}
            {recurringType === 'weekly' && 'weeks'}
            {recurringType === 'monthly' && 'months'}
            {recurringType === 'yearly' && 'years'}
          </span>
        </div>
      </div>
      
      {recurringType === 'weekly' && (
        <div className="space-y-2">
          <Label>On days</Label>
          <div className="flex flex-wrap gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleRecurringDay(day)}
                className={`w-8 h-8 rounded-full text-xs ${
                  recurringDays.includes(day) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card hover:bg-card/80'
                }`}
              >
                {getWeekdayName(day)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {recurringType === 'monthly' && (
        <div className="space-y-2">
          <Label>On day of month</Label>
          <input
            type="number"
            min="1"
            max="31"
            value={recurringDayOfMonth || ''}
            onChange={(e) => setRecurringDayOfMonth(parseInt(e.target.value) || undefined)}
            className="glass-input w-full"
          />
        </div>
      )}
      
      {recurringType === 'yearly' && (
        <div className="space-y-2">
          <Label>In months</Label>
          <div className="flex flex-wrap gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
              <button
                key={month}
                type="button"
                onClick={() => toggleRecurringMonth(month)}
                className={`w-8 h-8 rounded-full text-xs ${
                  recurringMonths.includes(month) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card hover:bg-card/80'
                }`}
              >
                {getMonthName(month)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label>End date (optional)</Label>
        <input
          type="date"
          value={recurringEndDate || ''}
          onChange={(e) => setRecurringEndDate(e.target.value || undefined)}
          className="glass-input w-full"
        />
      </div>
    </div>
  );
};

export default RecurringOptions;
