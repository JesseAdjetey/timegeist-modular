
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from "@/components/ui/separator";
import { Profile } from '@/types/database';

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const UserProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
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
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an issue signing out.",
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return '?';
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-card rounded-lg shadow">
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card rounded-lg shadow">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-lg">{profile?.full_name || user?.email}</h3>
          <p className="text-sm text-muted-foreground">
            Member since {formatDate(profile?.created_at || user?.created_at)}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-md">
          <div className="font-medium text-2xl">{eventCount}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar size={12} /> Events
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-md">
          <div className="font-medium text-2xl">{alarmCount}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={12} /> Alarms
          </div>
        </div>
      </div>
      
      <Separator className="my-4 bg-white/10" />
      
      <div className="space-y-4 mt-4 bg-background/50 p-4 rounded-md">
        <div className="grid grid-cols-3 text-sm">
          <span className="font-medium">Email:</span>
          <span className="col-span-2">{user?.email}</span>
        </div>
        
        <div className="grid grid-cols-3 text-sm">
          <span className="font-medium">Last Sign In:</span>
          <span className="col-span-2">
            {user?.last_sign_in_at ? (
              <>
                {formatDate(user.last_sign_in_at)}
                <span className="text-xs text-muted-foreground ml-2">
                  {formatTime(user.last_sign_in_at)}
                </span>
              </>
            ) : 'N/A'}
          </span>
        </div>
        
        <div className="grid grid-cols-3 text-sm">
          <span className="font-medium">Account ID:</span>
          <span className="col-span-2 text-xs font-mono">{user?.id?.substring(0, 12)}...</span>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => navigate('/settings')} className="gap-2">
          <span className="mr-1">Settings</span>
        </Button>
        
        <Button variant="destructive" onClick={handleSignOut} className="gap-2">
          <LogOut size={16} className="mr-1" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
