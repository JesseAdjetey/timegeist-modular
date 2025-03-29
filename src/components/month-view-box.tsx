
import React from "react";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import CalendarEvent from "./calendar/CalendarEvent";
import { CalendarEventType } from "@/lib/store";

interface MonthViewBoxProps {
  day: dayjs.Dayjs | null;
  rowIndex: number;
  events?: CalendarEventType[];
  onEventClick?: (event: CalendarEventType) => void;
}

const MonthViewBox: React.FC<MonthViewBoxProps> = ({
  day,
  rowIndex,
  events = [],
  onEventClick
}) => {
  if (!day) {
    return <div className="h-full border-r border-t border-white/10 bg-secondary/30"></div>;
  }

  const isFirstDayOfMonth = day.date() === 1;
  const isToday = day.format("DD-MM-YY") === dayjs().format("DD-MM-YY");
  
  // Show max 3 events on month view
  const visibleEvents = events.slice(0, 3);
  const hasMoreEvents = events.length > 3;
  
  return (
    <div 
      className={cn(
        "group relative flex flex-col border-r border-t border-white/10",
        "transition-all hover:bg-white/5",
        isToday && "bg-primary/10"
      )}
    >
      {/* Day Header */}
      <div className="flex flex-col items-center py-1 border-b border-white/10">
        {rowIndex === 0 && (
          <h4 className="text-xs text-muted-foreground">{day.format("ddd").toUpperCase()}</h4>
        )}
        <h4 
          className={cn(
            "text-center", 
            isToday ? "h-7 w-7 flex items-center justify-center rounded-full bg-primary text-white font-medium" : "text-sm"
          )}
        >
          {isFirstDayOfMonth ? day.format("MMM D") : day.format("D")}
        </h4>
      </div>
      
      {/* Events */}
      <div className="flex-1 p-1 overflow-hidden">
        {visibleEvents.map(event => (
          <div key={event.id} className="mb-1" onClick={() => onEventClick && onEventClick(event)}>
            <CalendarEvent
              event={event}
              color={event.color}
              isLocked={event.isLocked}
              hasAlarm={event.hasAlarm}
              hasReminder={event.hasReminder}
              hasTodo={event.isTodo}
              participants={event.participants}
            />
          </div>
        ))}
        
        {hasMoreEvents && (
          <div className="text-xs text-center bg-white/10 rounded p-1">
            +{events.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthViewBox;
