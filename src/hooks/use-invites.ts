
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CalendarEventType } from '@/lib/stores/types';

export interface Invite {
  id: string;
  event_id: string | null;
  invitee_email: string | null;
  created_at: string;
  responded_at: string | null;
  invitee_id: string | null;
  invitation_message: string | null;
  inviter_id: string | null;
  status: 'pending' | 'accepted' | 'declined';
  event?: CalendarEventType;
}

export function useInvites() {
  const [sentInvites, setSentInvites] = useState<Invite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch all invites (both sent and received)
  const fetchInvites = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch invites sent by the current user
      const { data: sent, error: sentError } = await supabase
        .from('invites')
        .select(`
          *,
          event:event_id (
            id,
            title,
            description,
            startsAt,
            endsAt,
            color
          )
        `)
        .eq('inviter_id', user.id);
        
      if (sentError) throw sentError;
      
      // Fetch invites received by the current user
      const { data: received, error: receivedError } = await supabase
        .from('invites')
        .select(`
          *,
          event:event_id (
            id,
            title,
            description,
            startsAt,
            endsAt,
            color
          )
        `)
        .eq('invitee_id', user.id);
        
      if (receivedError) throw receivedError;

      // Process sent invites with proper type checking
      const processedSent = sent?.map(item => {
        // Fix: Add proper null checking for item.event
        const hasValidEvent = item.event !== null && 
                            typeof item.event === 'object' && 
                            !('error' in item.event);
        
        // Create a fallback event object if the event has an error or is null
        const eventData = hasValidEvent 
          ? (item.event as CalendarEventType)
          : undefined;
        
        return {
          ...item,
          status: (item.status as 'pending' | 'accepted' | 'declined') || 'pending',
          event: eventData
        };
      }) || [];

      // Process received invites with proper type checking
      const processedReceived = received?.map(item => {
        // Fix: Add proper null checking for item.event
        const hasValidEvent = item.event !== null && 
                            typeof item.event === 'object' && 
                            !('error' in item.event);
        
        // Create a fallback event object if the event has an error or is null
        const eventData = hasValidEvent 
          ? (item.event as CalendarEventType)
          : undefined;
        
        return {
          ...item,
          status: (item.status as 'pending' | 'accepted' | 'declined') || 'pending',
          event: eventData
        };
      }) || [];
      
      // Now safely assign the processed data to state
      setSentInvites(processedSent as Invite[]);
      setReceivedInvites(processedReceived as Invite[]);
    } catch (error) {
      console.error('Error fetching invites:', error);
      toast.error('Failed to fetch invites');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new invite
  const sendInvite = async (eventId: string, inviteeEmail: string, message?: string) => {
    if (!user) {
      toast.error('You must be logged in to send invites');
      return { success: false };
    }
    
    try {
      // Create the invite with just the email
      const { data, error } = await supabase
        .from('invites')
        .insert({
          event_id: eventId,
          inviter_id: user.id,
          invitee_email: inviteeEmail,
          invitation_message: message || null,
          status: 'pending'
        })
        .select();
        
      if (error) throw error;
      
      toast.success('Invite sent successfully');
      await fetchInvites();
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast.error(`Failed to send invite: ${error.message}`);
      return { success: false, error };
    }
  };

  // Accept an invite
  const respondToInvite = async (inviteId: string, accept: boolean) => {
    if (!user) {
      toast.error('You must be logged in to respond to invites');
      return { success: false };
    }
    
    try {
      const { error } = await supabase
        .from('invites')
        .update({ 
          status: accept ? 'accepted' : 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('id', inviteId)
        .eq('invitee_id', user.id);
        
      if (error) throw error;
      
      toast.success(`Invite ${accept ? 'accepted' : 'declined'} successfully`);
      await fetchInvites();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error responding to invite:', error);
      toast.error(`Failed to respond to invite: ${error.message}`);
      return { success: false, error };
    }
  };

  // Delete an invite (as sender)
  const deleteInvite = async (inviteId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete invites');
      return { success: false };
    }
    
    try {
      const { error } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId)
        .eq('inviter_id', user.id);
        
      if (error) throw error;
      
      toast.success('Invite deleted successfully');
      await fetchInvites();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting invite:', error);
      toast.error(`Failed to delete invite: ${error.message}`);
      return { success: false, error };
    }
  };

  // Load invites when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchInvites();
      
      // Set up real-time subscription for invites
      const channel = supabase
        .channel('invites-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'invites',
            filter: `inviter_id=eq.${user.id}` 
          }, 
          (payload) => {
            console.log('Realtime update for sent invites:', payload);
            fetchInvites();
          }
        )
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'invites',
            filter: `invitee_id=eq.${user.id}` 
          }, 
          (payload) => {
            console.log('Realtime update for received invites:', payload);
            fetchInvites();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setSentInvites([]);
      setReceivedInvites([]);
      setLoading(false);
    }
  }, [user, fetchInvites]);

  return {
    sentInvites,
    receivedInvites,
    loading,
    sendInvite,
    respondToInvite,
    deleteInvite,
    fetchInvites
  };
}
