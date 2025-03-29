
import React from 'react';
import { useDateStore, useViewStore } from "@/lib/store";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import dayjs from 'dayjs';
import SettingsNav from './SettingsNav';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

const Header = () => {
  const todaysDate = dayjs();
  const { userSelectedDate, setDate, setMonth, selectedMonthIndex } = useDateStore();
  const { selectedView, setView } = useViewStore();

  const handleTodayClick = () => {
    switch (selectedView) {
      case "Month":
        setMonth(dayjs().month());
        break;
      case "Week":
        setDate(todaysDate);
        break;
      case "Day":
        setDate(todaysDate);
        setMonth(dayjs().month());
        break;
      default:
        break;
    }
  };
  
  const handlePrevClick = () => {
    switch (selectedView) {
      case "Month":
        setMonth(selectedMonthIndex - 1);
        break;
      case "Week":
        setDate(userSelectedDate.subtract(1, "week"));
        break;
      case "Day":
        setDate(userSelectedDate.subtract(1, "day"));
        break;
      default:
        break;
    }
  };

  const handleNextClick = () => {
    switch (selectedView) {
      case "Month":
        setMonth(selectedMonthIndex + 1);
        break;
      case "Week":
        setDate(userSelectedDate.add(1, "week"));
        break;
      case "Day":
        setDate(userSelectedDate.add(1, "day"));
        break;
      default:
        break;
    }
  };

  const formatDate = () => {
    switch (selectedView) {
      case "Month":
        return dayjs(new Date(dayjs().year(), selectedMonthIndex)).format("MMMM YYYY");
      case "Week":
        const weekStart = userSelectedDate.startOf('week').format("MMM D");
        const weekEnd = userSelectedDate.endOf('week').format("MMM D, YYYY");
        return `${weekStart} - ${weekEnd}`;
      case "Day":
        return userSelectedDate.format("dddd, MMMM D, YYYY");
      default:
        return "";
    }
  };

  return (
    <div className="glass mx-4 mt-4 rounded-xl p-4 flex items-center justify-between border light-mode:border-gray-400 dark-mode:border-white/10">
      {/* Left Side - Logo and Navigation */}
      <div className="flex items-center gap-4">
        {/* Logo with hover effect */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="relative overflow-hidden rounded-lg cursor-pointer group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 opacity-0 group-hover:opacity-70 animate-pulse z-0 group-hover:animate-[gradient-shift_3s_ease_infinite]"></div>
              <img 
                src="/lovable-uploads/50041269-e66c-4735-b847-3d4fef85beca.png" 
                alt="Company Logo" 
                className="h-10 w-10 rounded-lg shadow-md relative z-20 transition-transform duration-300 group-hover:scale-110" 
              />
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-60 p-4 light-mode:bg-white/95 dark-mode:bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold gradient-text">Your Company</h3>
              <p className="text-sm text-muted-foreground">Innovative solutions for your productivity needs</p>
            </div>
          </HoverCardContent>
        </HoverCard>
        
        <Button 
          variant="outline" 
          onClick={handleTodayClick} 
          className="light-mode:bg-white/95 light-mode:text-gray-800 light-mode:border-gray-400 dark-mode:bg-white/10 dark-mode:border-white/10 dark-mode:hover:bg-white/20"
        >
          Today
        </Button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevClick}
            className="p-1 rounded-full light-mode:hover:bg-gray-200 dark-mode:hover:bg-white/10"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={handleNextClick}
            className="p-1 rounded-full light-mode:hover:bg-gray-200 dark-mode:hover:bg-white/10"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        <h1 className="text-xl font-semibold">{formatDate()}</h1>
      </div>

      {/* Right Side - View Selector and Settings */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {["Day", "Week", "Month"].map((view) => (
            <Button
              key={view}
              variant={selectedView === view ? "default" : "outline"}
              onClick={() => setView(view)}
              className={selectedView === view 
                ? "bg-primary text-white" 
                : "light-mode:bg-white light-mode:text-gray-800 light-mode:border-gray-400 dark-mode:bg-white/10 dark-mode:border-white/10 dark-mode:hover:bg-white/20"
              }
            >
              {view}
            </Button>
          ))}
        </div>
        
        <SettingsNav />
      </div>
    </div>
  );
};

export default Header;
