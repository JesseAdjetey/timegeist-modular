
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from "@/components/ui/separator";
import { Profile } from '@/types/database';

// Import the refactored components
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileDetails from '@/components/profile/ProfileDetails';
import ProfileActions from '@/components/profile/ProfileActions';

const UserProfile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [alarmCount, setAlarmCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        setProfile(profileData as Profile);
        
        // Fetch alarm count
        const { count: alarmCount, error: alarmError } = await supabase
          .from('alarms')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (alarmError) throw alarmError;
        setAlarmCount(alarmCount || 0);
        
        // Fetch event count
        const { count: eventCount, error: eventError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);
          
        if (eventError) throw eventError;
        setEventCount(eventCount || 0);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, toast]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an issue signing out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 bg-card rounded-lg shadow">
      <ProfileHeader profile={profile} user={user} loading={loading} />
      
      <ProfileStats 
        eventCount={eventCount} 
        alarmCount={alarmCount} 
        loading={loading} 
      />
      
      <Separator className="my-4 bg-white/10" />
      
      <ProfileDetails user={user} loading={loading} />
      
      <ProfileActions onSignOut={handleSignOut} loading={loading} />
    </div>
  );
};

export default UserProfile;
