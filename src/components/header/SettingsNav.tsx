
import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';

const SettingsNav = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full h-9 w-9 cursor-glow gradient-border"
            asChild
          >
            <Link to="/settings">
              <Settings size={18} />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SettingsNav;
