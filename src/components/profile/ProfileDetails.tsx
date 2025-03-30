
import React from 'react';
import { Separator } from "@/components/ui/separator";
import { User } from '@supabase/supabase-js';

interface ProfileDetailsProps {
  user: User | null;
  loading: boolean;
}

const ProfileDetails = ({ user, loading }: ProfileDetailsProps) => {
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
      <div className="space-y-4 mt-4 bg-background/50 p-4 rounded-md animate-pulse">
        <div className="h-5 w-full bg-muted rounded mb-2"></div>
        <div className="h-5 w-full bg-muted rounded mb-2"></div>
        <div className="h-5 w-full bg-muted rounded"></div>
      </div>
    );
  }

  return (
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
  );
};

export default ProfileDetails;
