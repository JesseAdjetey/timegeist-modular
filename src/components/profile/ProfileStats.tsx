
import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface ProfileStatsProps {
  eventCount: number;
  alarmCount: number;
  loading: boolean;
}

const ProfileStats = ({ eventCount, alarmCount, loading }: ProfileStatsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-md animate-pulse">
          <div className="h-8 w-8 bg-muted rounded mb-2"></div>
          <div className="h-4 w-16 bg-muted rounded"></div>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-md animate-pulse">
          <div className="h-8 w-8 bg-muted rounded mb-2"></div>
          <div className="h-4 w-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
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
  );
};

export default ProfileStats;
