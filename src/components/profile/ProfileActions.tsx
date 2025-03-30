
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ProfileActionsProps {
  onSignOut: () => Promise<void>;
  loading: boolean;
}

const ProfileActions = ({ onSignOut, loading }: ProfileActionsProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="mt-6 flex justify-between">
        <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
        <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex justify-between">
      <Button variant="outline" onClick={() => navigate('/settings')} className="gap-2">
        <span className="mr-1">Settings</span>
      </Button>
      
      <Button variant="destructive" onClick={onSignOut} className="gap-2">
        <LogOut size={16} className="mr-1" />
        Sign Out
      </Button>
    </div>
  );
};

export default ProfileActions;
