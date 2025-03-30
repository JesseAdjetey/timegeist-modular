import React, { useState, useEffect } from 'react';
import ModuleContainer from './ModuleContainer';
import { Clock, Bell, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Alarm {
  id: string;
  title: string;
  description?: string;
  alarm_time: string;
  is_recurring: boolean;
  recurring_type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_interval?: number;
  recurring_days?: number[];
  recurring_months?: number[];
  recurring_day_of_month?: number;
  recurring_end_date?: string;
  event_id?: string;
  is_active: boolean;
}

interface AlarmsModuleProps {
  title?: string;
  onRemove?: () => void;
  onTitleChange?: (title: string) => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  isDragging?: boolean;
}

const AlarmsModule: React.FC<AlarmsModuleProps> = ({ 
  title = "Alarms",
  onRemove, 
  onTitleChange,
  onMinimize,
  isMinimized = false,
  isDragging = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAlarmTitle, setNewAlarmTitle] = useState('');
  const [newAlarmTime, setNewAlarmTime] = useState('08:00');
  const [newAlarmDate, setNewAlarmDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringMonths, setRecurringMonths] = useState<number[]>([]);
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState<number | undefined>(undefined);
  const [recurringEndDate, setRecurringEndDate] = useState<string | undefined>(undefined);
  const [isAddAlarmOpen, setIsAddAlarmOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchAlarms = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('alarms')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        const transformedData = data?.map(alarm => ({
          id: alarm.id,
          title: alarm.title || 'Unnamed Alarm',
          description: alarm.description,
          alarm_time: new Date(alarm.alarm_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          is_recurring: alarm.is_recurring || false,
          recurring_type: alarm.recurring_type,
          recurring_interval: alarm.recurring_interval,
          recurring_days: alarm.recurring_days,
          recurring_months: alarm.recurring_months,
          recurring_day_of_month: alarm.recurring_day_of_month,
          recurring_end_date: alarm.recurring_end_date,
          event_id: alarm.event_id,
          is_active: !alarm.is_snoozed
        })) || [];
        
        setAlarms(transformedData);
      } catch (error) {
        console.error("Error fetching alarms:", error);
        toast({
          title: "Error",
          description: "Failed to load alarms",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlarms();
  }, [user, toast]);

  const addAlarm = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add alarms",
        variant: "destructive",
      });
      return;
    }
    
    if (!newAlarmTitle.trim()) {
      toast({
        title: "Validation error",
        description: "Please enter an alarm title",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const alarmTime = new Date(`${newAlarmDate}T${newAlarmTime}`);
      
      let recurringData = {};
      if (isRecurring) {
        recurringData = {
          is_recurring: true,
          recurring_type: recurringType,
          recurring_interval: recurringInterval
        };
        
        if (recurringType === 'weekly') {
          recurringData = {
            ...recurringData,
            recurring_days: recurringDays
          };
        } else if (recurringType === 'monthly') {
          recurringData = {
            ...recurringData,
            recurring_day_of_month: recurringDayOfMonth
          };
        } else if (recurringType === 'yearly') {
          recurringData = {
            ...recurringData,
            recurring_months: recurringMonths
          };
        }
        
        if (recurringEndDate) {
          recurringData = {
            ...recurringData,
            recurring_end_date: recurringEndDate
          };
        }
      }
      
      const { data, error } = await supabase
        .from('alarms')
        .insert({
          title: newAlarmTitle,
          alarm_time: alarmTime.toISOString(),
          user_id: user.id,
          ...recurringData
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const newAlarm: Alarm = {
          id: data.id,
          title: data.title,
          alarm_time: new Date(data.alarm_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          is_recurring: data.is_recurring || false,
          recurring_type: data.recurring_type,
          recurring_interval: data.recurring_interval,
          recurring_days: data.recurring_days,
          recurring_months: data.recurring_months,
          recurring_day_of_month: data.recurring_day_of_month,
          recurring_end_date: data.recurring_end_date,
          event_id: data.event_id,
          is_active: true
        };
        
        setAlarms([...alarms, newAlarm]);
        setNewAlarmTitle('');
        setIsRecurring(false);
        setIsAddAlarmOpen(false);
        
        toast({
          title: "Alarm created",
          description: `${newAlarmTitle} has been set${isRecurring ? ' with recurrence' : ''}`,
        });
      }
    } catch (error) {
      console.error("Error adding alarm:", error);
      toast({
        title: "Error",
        description: "Failed to create alarm",
        variant: "destructive",
      });
    }
  };

  const toggleAlarm = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('alarms')
        .update({ is_snoozed: !isActive })
        .eq('id', id);
      
      if (error) throw error;
      
      setAlarms(alarms.map(alarm => 
        alarm.id === id ? { ...alarm, is_active: !isActive } : alarm
      ));
    } catch (error) {
      console.error("Error toggling alarm:", error);
      toast({
        title: "Error",
        description: "Failed to update alarm status",
        variant: "destructive",
      });
    }
  };

  const deleteAlarm = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alarms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setAlarms(alarms.filter(alarm => alarm.id !== id));
      
      toast({
        title: "Alarm deleted",
        description: "Alarm has been removed",
      });
    } catch (error) {
      console.error("Error deleting alarm:", error);
      toast({
        title: "Error",
        description: "Failed to delete alarm",
        variant: "destructive",
      });
    }
  };

  const getWeekdayName = (dayNum: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayNum];
  };

  const getMonthName = (monthNum: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
  };

  const toggleRecurringDay = (dayNum: number) => {
    setRecurringDays(
      recurringDays.includes(dayNum)
        ? recurringDays.filter(d => d !== dayNum)
        : [...recurringDays, dayNum]
    );
  };

  const toggleRecurringMonth = (monthNum: number) => {
    setRecurringMonths(
      recurringMonths.includes(monthNum)
        ? recurringMonths.filter(m => m !== monthNum)
        : [...recurringMonths, monthNum]
    );
  };

  const formatRecurringPattern = (alarm: Alarm) => {
    if (!alarm.is_recurring) return null;
    
    let pattern = "";
    const interval = alarm.recurring_interval || 1;
    
    switch (alarm.recurring_type) {
      case 'daily':
        pattern = interval === 1 ? "Daily" : `Every ${interval} days`;
        break;
      case 'weekly':
        if (alarm.recurring_days && alarm.recurring_days.length > 0) {
          const daysText = alarm.recurring_days.map(d => getWeekdayName(d)).join(', ');
          pattern = interval === 1 
            ? `Weekly on ${daysText}` 
            : `Every ${interval} weeks on ${daysText}`;
        } else {
          pattern = interval === 1 ? "Weekly" : `Every ${interval} weeks`;
        }
        break;
      case 'monthly':
        const dayOfMonth = alarm.recurring_day_of_month 
          ? `on day ${alarm.recurring_day_of_month}` 
          : '';
        pattern = interval === 1 
          ? `Monthly ${dayOfMonth}` 
          : `Every ${interval} months ${dayOfMonth}`;
        break;
      case 'yearly':
        if (alarm.recurring_months && alarm.recurring_months.length > 0) {
          const monthsText = alarm.recurring_months.map(m => getMonthName(m)).join(', ');
          pattern = interval === 1 
            ? `Yearly in ${monthsText}` 
            : `Every ${interval} years in ${monthsText}`;
        } else {
          pattern = interval === 1 ? "Yearly" : `Every ${interval} years`;
        }
        break;
      default:
        pattern = "Recurring";
    }
    
    if (alarm.recurring_end_date) {
      pattern += ` until ${new Date(alarm.recurring_end_date).toLocaleDateString()}`;
    }
    
    return pattern;
  };

  const renderRecurringOptions = () => {
    if (!isRecurring) return null;
    
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

  if (isMinimized) {
    return (
      <ModuleContainer 
        title={title} 
        onRemove={onRemove}
        onTitleChange={onTitleChange}
        onMinimize={onMinimize}
        isMinimized={isMinimized}
        isDragging={isDragging}
      >
        <div className="flex justify-center items-center py-2">
          <span className="text-sm opacity-70">{alarms.length} alarm{alarms.length !== 1 ? 's' : ''}</span>
        </div>
      </ModuleContainer>
    );
  }

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
        {loading ? (
          <div className="py-4 text-center text-sm opacity-70">Loading alarms...</div>
        ) : alarms.length > 0 ? (
          alarms.map(alarm => (
            <div 
              key={alarm.id}
              className="flex items-center gap-2 bg-white/5 p-2 rounded-lg mb-2"
            >
              <div 
                className={`w-4 h-4 rounded-full flex-shrink-0 cursor-pointer ${
                  alarm.is_active ? 'bg-primary' : 'bg-secondary'
                }`}
                onClick={() => toggleAlarm(alarm.id, alarm.is_active)}
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
                onClick={() => deleteAlarm(alarm.id)}
                className="text-destructive/70 hover:text-destructive"
              >
                <X size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="py-4 text-center text-sm opacity-70">No alarms set</div>
        )}
      </div>

      <Popover open={isAddAlarmOpen} onOpenChange={setIsAddAlarmOpen}>
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
            
            {renderRecurringOptions()}
            
            <Button
              onClick={addAlarm}
              className="w-full"
            >
              Save Alarm
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </ModuleContainer>
  );
};

export default AlarmsModule;
