
import React from "react";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import CalendarEvent from "./calendar/CalendarEvent";
import { CalendarEventType } from "@/lib/store";
import { toast } from "sonner";

interface MonthViewBoxProps {
  day: dayjs.Dayjs | null;
  rowIndex: number;
  events?: CalendarEventType[];
  onEventClick?: (event: CalendarEventType) => void;
  onDayClick?: (day: dayjs.Dayjs) => void;
  onEventDrop?: (event: any, date: string) => void;
}

const MonthViewBox: React.FC<MonthViewBoxProps> = ({
  day,
  rowIndex,
  events = [],
  onEventClick,
  onDayClick,
  onEventDrop
}) => {
  if (!day) {
    return <div className="h-full border-r border-t border-white/10 bg-secondary/30"></div>;
  }

  const isFirstDayOfMonth = day.date() === 1;
  const isToday = day.format("DD-MM-YY") === dayjs().format("DD-MM-YY");
  
  // Show max 3 events on month view
  const visibleEvents = events.slice(0, 3);
  const hasMoreEvents = events.length > 3;
  
  // Handle dropping an event onto this day
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      // Parse the drag data
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Don't process if the event is locked
      if (data.isLocked) return;
      
      // Only update if the date actually changed
      if (data.date === day.format('YYYY-MM-DD')) return;
      
      // Update the event with the new date
      if (onEventDrop) {
        onEventDrop(data, day.format('YYYY-MM-DD'));
        toast.success(`Event moved to ${day.format("MMM D")}`);
      }
    } catch (error) {
      console.error("Error handling drop:", error);
      toast.error("Failed to move event");
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  return (
    <div 
      className={cn(
        "group relative flex flex-col border-r border-t border-white/10 gradient-border cursor-glow",
        "transition-all hover:bg-white/5",
        isToday && "bg-primary/10"
      )}
      onClick={(e) => {
        // Only trigger day click if the click wasn't on an event
        if ((e.target as HTMLElement).closest('.calendar-event-wrapper') === null) {
          onDayClick?.(day);
        }
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
          <div 
            key={event.id} 
            className="mb-1 gradient-border calendar-event-wrapper" 
            onClick={(e) => {
              e.stopPropagation();
              onEventClick && onEventClick(event);
            }}
          >
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
