
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Profile } from '@/types/database';
import { User } from '@supabase/supabase-js';

interface ProfileHeaderProps {
  profile: Profile | null;
  user: User | null;
  loading: boolean;
}

const ProfileHeader = ({ profile, user, loading }: ProfileHeaderProps) => {
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

  if (loading) {
    return (
      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 rounded-full bg-muted animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-5 w-32 bg-muted animate-pulse rounded"></div>
          <div className="h-4 w-40 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
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
  );
};

export default ProfileHeader;
