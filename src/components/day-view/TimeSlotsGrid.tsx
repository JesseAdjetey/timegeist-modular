
import React from "react";
import dayjs from "dayjs";
import { getHours, isCurrentDay } from "@/lib/getTime";
import { ScrollArea } from "@/components/ui/scroll-area";
import TimeSlot from "./TimeSlot";

interface TimeSlotsGridProps {
  userSelectedDate: dayjs.Dayjs;
  currentTime: dayjs.Dayjs;
  events: any[];
  onTimeSlotClick: (hour: dayjs.Dayjs) => void;
}

const TimeSlotsGrid: React.FC<TimeSlotsGridProps> = ({ 
  userSelectedDate, 
  currentTime, 
  events, 
  onTimeSlotClick 
}) => {
  // Calculate event position (very simplified version for demo)
  const getEventPosition = (event: any) => {
    // Extract hour from event description (assuming format like "9:00 - 10:30 | Description")
    const hourMatch = event.description.match(/(\d+):(\d+)/);
    if (hourMatch) {
      return parseInt(hourMatch[1], 10);
    }
    return 9; // Default to 9am if we can't parse
  };

  // Filter events for each hour
  const getEventsForHour = (hour: dayjs.Dayjs) => {
    return events.filter(event => getEventPosition(event) === hour.hour());
  };

  return (
    <ScrollArea className="h-[80vh]">
      <div className="grid grid-cols-[auto_1fr] p-4">
        {/* Time Column */}
        <div className="w-16 border-r border-white/10">
          {getHours.map((hour, index) => (
            <div key={index} className="relative h-20">
              <div className="absolute -top-2 text-xs text-muted-foreground">
                {hour.format("h A")}
              </div>
            </div>
          ))}
        </div>
        
        {/* Day/Boxes Column */}
        <div className="relative">
          {getHours.map((hour, i) => (
            <TimeSlot
              key={i}
              hour={hour}
              events={getEventsForHour(hour)}
              onTimeSlotClick={onTimeSlotClick}
            />
          ))}
          
          {/* Current time indicator */}
          {isCurrentDay(userSelectedDate) && (
            <div
              className="absolute h-0.5 w-full bg-primary z-20"
              style={{
                top: `${(currentTime.hour() * 60 + currentTime.minute()) / (24 * 60) * 100 * 20}px`,
              }}
            />
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default TimeSlotsGrid;
