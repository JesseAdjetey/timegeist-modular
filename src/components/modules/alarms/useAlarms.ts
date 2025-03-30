
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlarmDisplay, Alarm } from '@/types/database';

export const useAlarms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alarms, setAlarms] = useState<AlarmDisplay[]>([]);
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
    fetchAlarms();
  }, [user]);

  const fetchAlarms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('alarms')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      const transformedData = (data || []).map((alarm: Alarm) => ({
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
      }));
      
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
      
      const newAlarmData = {
        title: newAlarmTitle,
        alarm_time: alarmTime.toISOString(),
        user_id: user.id,
        ...recurringData
      };
      
      const { data, error } = await supabase
        .from('alarms')
        .insert(newAlarmData as any)
        .select('*')
        .single();
      
      if (error) throw error;
      
      if (data) {
        const newAlarm: AlarmDisplay = {
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
      const updateData = { is_snoozed: !isActive };
      
      const { error } = await supabase
        .from('alarms')
        .update(updateData as any)
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

  return {
    alarms,
    loading,
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
    recurringMonths,
    recurringDayOfMonth,
    setRecurringDayOfMonth,
    recurringEndDate,
    setRecurringEndDate,
    isAddAlarmOpen,
    setIsAddAlarmOpen,
    addAlarm,
    toggleAlarm,
    deleteAlarm,
    toggleRecurringDay,
    toggleRecurringMonth
  };
};
