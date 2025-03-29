
import React from 'react';
import { useDateStore, useViewStore } from "@/lib/store";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import dayjs from 'dayjs';

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
    <div className="glass mx-4 mt-4 rounded-xl p-4 flex items-center justify-between border border-white/10">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={handleTodayClick} 
          className="bg-white/10 hover:bg-white/20 border border-white/10"
        >
          Today
        </Button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevClick}
            className="p-1 rounded-full hover:bg-white/10"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={handleNextClick}
            className="p-1 rounded-full hover:bg-white/10"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        <h1 className="text-xl font-semibold">{formatDate()}</h1>
      </div>

      {/* Right Side - View Selector */}
      <div className="flex gap-2">
        {["Day", "Week", "Month"].map((view) => (
          <Button
            key={view}
            variant={selectedView === view ? "default" : "outline"}
            onClick={() => setView(view)}
            className={selectedView === view 
              ? "bg-primary text-white" 
              : "bg-white/10 border border-white/10 hover:bg-white/20"
            }
          >
            {view}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Header;
