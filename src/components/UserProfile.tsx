
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const UserProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.email) return '?';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow">
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{user?.email}</h3>
          <p className="text-sm text-muted-foreground">User ID: {user?.id?.substring(0, 8)}...</p>
        </div>
      </div>
      
      <div className="space-y-3 mt-4">
        <div className="grid grid-cols-3 text-sm">
          <span className="font-medium">Email:</span>
          <span className="col-span-2">{user?.email}</span>
        </div>
        
        <div className="grid grid-cols-3 text-sm">
          <span className="font-medium">Last Sign In:</span>
          <span className="col-span-2">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</span>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button variant="destructive" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
