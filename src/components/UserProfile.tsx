
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, UserCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const UserProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Force navigation to auth page after signout
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "There was an issue signing out.",
        variant: "destructive",
      });
    }
  };

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.email) return '?';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-6 bg-card rounded-lg shadow">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-lg">{user?.user_metadata?.full_name || user?.email}</h3>
          <p className="text-sm text-muted-foreground">User ID: {user?.id?.substring(0, 8)}...</p>
        </div>
      </div>
      
      <div className="space-y-4 mt-4 bg-background/50 p-4 rounded-md">
        <div className="grid grid-cols-3 text-sm">
          <span className="font-medium">Email:</span>
          <span className="col-span-2">{user?.email}</span>
        </div>
        
        <div className="grid grid-cols-3 text-sm">
          <span className="font-medium">Last Sign In:</span>
          <span className="col-span-2">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</span>
        </div>
        
        <div className="grid grid-cols-3 text-sm">
          <span className="font-medium">Created:</span>
          <span className="col-span-2">{user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</span>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button variant="destructive" onClick={handleSignOut} className="gap-2">
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
