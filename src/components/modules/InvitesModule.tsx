import React from 'react';
import ModuleContainer from './ModuleContainer';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X } from 'lucide-react';

interface Invitation {
  id: string;
  title: string;
  time: string;
  inviter: {
    name: string;
    avatar?: string;
  };
}

interface InvitesModuleProps {
  title?: string;
  onRemove?: () => void;
  onTitleChange?: (title: string) => void;
  invitations?: Invitation[];
}

const InvitesModule: React.FC<InvitesModuleProps> = ({ 
  title = "Event Invites",
  onRemove, 
  onTitleChange,
  invitations = [
    {
      id: '1',
      title: 'Study date',
      time: '11 - 12',
      inviter: { name: 'Julie B' }
    },
    {
      id: '2',
      title: 'Brunch',
      time: '13 - 14:30',
      inviter: { name: 'Michael T' }
    },
    {
      id: '3',
      title: 'Gym time',
      time: '9 - 9:30',
      inviter: { name: 'Sarah K' }
    },
    {
      id: '4',
      title: 'Group meeting',
      time: '8 - 8:30',
      inviter: { name: 'Team' }
    }
  ] 
}) => {
  return (
    <ModuleContainer 
      title={title} 
      onRemove={onRemove}
      onTitleChange={onTitleChange}
    >
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {invitations.map(invitation => (
          <div 
            key={invitation.id}
            className="flex items-center gap-2 bg-white/5 p-2 rounded-lg"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={invitation.inviter.avatar} />
              <AvatarFallback className="text-xs">
                {invitation.inviter.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="text-sm font-medium">{invitation.title}</div>
              <div className="text-xs opacity-70">{invitation.time}</div>
            </div>
            
            <div className="flex gap-1">
              <button className="p-1 rounded-full bg-green-500/20 hover:bg-green-500/40 transition-colors">
                <Check size={14} className="text-green-500" />
              </button>
              <button className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors">
                <X size={14} className="text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ModuleContainer>
  );
};

export default InvitesModule;
