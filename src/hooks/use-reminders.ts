
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CalendarEventType } from '@/lib/stores/types';

export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_time: string;
  event_id: string | null;
  time_before_event_minutes: number | null;
  time_after_event_minutes: number | null;
  sound_id: string | null;
  is_active: boolean;
  created_at: string;
  event?: CalendarEventType;
}

export interface ReminderFormData {
  title: string;
  description?: string;
  reminderTime?: string;
  eventId?: string;
  timeBeforeMinutes?: number;
  timeAfterMinutes?: number;
  soundId?: string;
}

const REMINDER_SOUNDS = [
  { id: 'default', name: 'Default', url: '/sounds/default-notification.mp3' },
  { id: 'bell', name: 'Bell', url: '/sounds/bell-notification.mp3' },
  { id: 'chime', name: 'Chime', url: '/sounds/chime-notification.mp3' },
  { id: 'soft', name: 'Soft', url: '/sounds/soft-notification.mp3' },
];

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch all reminders
  const fetchReminders = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch reminders with optional linked events
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          event:event_id (
            id,
            title,
            description,
            starts_at,
            ends_at,
            color
          )
        `)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Process the data with proper type checking
      const processedReminders = data?.map(item => {
        // Check if the event data is valid
        const hasValidEvent = item.event !== null && 
                           typeof item.event === 'object' && 
                           !('error' in (item.event || {}));
        
        // Create a properly typed event object only if valid data exists
        let eventData = undefined;
        
        if (hasValidEvent && item.event) {
          const event = item.event as any;
          
          if (typeof event === 'object' && 
              'id' in event && 
              'title' in event) {
            
            eventData = {
              id: event.id,
              title: event.title,
              description: event.description || '',
              startsAt: event.starts_at,
              endsAt: event.ends_at,
              color: event.color || 'bg-blue-400/70',
              date: new Date(event.starts_at).toISOString().split('T')[0]
            } as CalendarEventType;
          }
        }
        
        return {
          ...item,
          event: eventData
        } as Reminder;
      }) || [];
      
      // Sort reminders by time
      const sortedReminders = processedReminders.sort((a, b) => 
        new Date(a.reminder_time).getTime() - new Date(b.reminder_time).getTime()
      );
      
      setReminders(sortedReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a new reminder
  const addReminder = async (data: ReminderFormData): Promise<{success: boolean, error?: any}> => {
    if (!user) {
      toast.error('You must be logged in to create reminders');
      return { success: false };
    }
    
    try {
      // Format the data for insertion
      const reminderData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        reminder_time: data.reminderTime || new Date().toISOString(),
        event_id: data.eventId || null,
        time_before_event_minutes: data.timeBeforeMinutes || null,
        time_after_event_minutes: data.timeAfterMinutes || null,
        sound_id: data.soundId || 'default',
        is_active: true
      };
      
      const { data: newReminder, error } = await supabase
        .from('reminders')
        .insert(reminderData)
        .select();
        
      if (error) throw error;
      
      toast.success('Reminder created');
      await fetchReminders();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      toast.error(`Failed to create reminder: ${error.message}`);
      return { success: false, error };
    }
  };

  // Update a reminder
  const updateReminder = async (id: string, data: Partial<ReminderFormData>): Promise<{success: boolean, error?: any}> => {
    if (!user) {
      toast.error('You must be logged in to update reminders');
      return { success: false };
    }
    
    try {
      // Format the update data
      const updateData: Record<string, any> = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.reminderTime !== undefined) updateData.reminder_time = data.reminderTime;
      if (data.eventId !== undefined) updateData.event_id = data.eventId;
      if (data.timeBeforeMinutes !== undefined) updateData.time_before_event_minutes = data.timeBeforeMinutes;
      if (data.timeAfterMinutes !== undefined) updateData.time_after_event_minutes = data.timeAfterMinutes;
      if (data.soundId !== undefined) updateData.sound_id = data.soundId;
      
      const { error } = await supabase
        .from('reminders')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast.success('Reminder updated');
      await fetchReminders();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating reminder:', error);
      toast.error(`Failed to update reminder: ${error.message}`);
      return { success: false, error };
    }
  };

  // Toggle reminder active status
  const toggleReminderActive = async (id: string, isActive: boolean): Promise<{success: boolean, error?: any}> => {
    return updateReminder(id, { title: undefined, is_active: isActive } as any);
  };

  // Delete a reminder
  const deleteReminder = async (id: string): Promise<{success: boolean, error?: any}> => {
    if (!user) {
      toast.error('You must be logged in to delete reminders');
      return { success: false };
    }
    
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast.success('Reminder deleted');
      await fetchReminders();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting reminder:', error);
      toast.error(`Failed to delete reminder: ${error.message}`);
      return { success: false, error };
    }
  };
  
  // Play a reminder sound for testing
  const playSound = (soundId: string = 'default') => {
    const sound = REMINDER_SOUNDS.find(s => s.id === soundId) || REMINDER_SOUNDS[0];
    const audio = new Audio(sound.url);
    audio.play().catch(err => console.error('Error playing sound:', err));
  };

  // Get list of available sounds
  const getSounds = () => REMINDER_SOUNDS;

  // Load reminders when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchReminders();
      
      // Set up real-time subscription for reminders
      const channel = supabase
        .channel('reminders-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'reminders',
            filter: `user_id=eq.${user.id}` 
          }, 
          (payload) => {
            console.log('Realtime update for reminders:', payload);
            fetchReminders();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setReminders([]);
      setLoading(false);
    }
  }, [user, fetchReminders]);

  return {
    reminders,
    loading,
    fetchReminders,
    addReminder,
    updateReminder,
    toggleReminderActive,
    deleteReminder,
    playSound,
    getSounds,
    REMINDER_SOUNDS
  };
}
