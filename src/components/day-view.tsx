
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useDateStore, useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getHours, isCurrentDay } from "@/lib/getTime";
import CalendarEvent from "./calendar/CalendarEvent";
import AddEventButton from "@/components/calendar/AddEventButton";
import EventForm from "@/components/calendar/EventForm";

const DayView = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate } = useDateStore();
  const { events, openEventSummary, toggleEventLock } = useEventStore();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<{date: Date, startTime: string} | undefined>();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const isToday = userSelectedDate.format("DD-MM-YY") === dayjs().format("DD-MM-YY");
  
  const dayEvents = events.filter(event => 
    event.date === userSelectedDate.format('YYYY-MM-DD')
  );

  // Calculate event position (very simplified version for demo)
  const getEventPosition = (event: any) => {
    // Extract hour from event description (assuming format like "9:00 - 10:30 | Description")
    const hourMatch = event.description.match(/(\d+):(\d+)/);
    if (hourMatch) {
      return parseInt(hourMatch[1], 10);
    }
    return 9; // Default to 9am if we can't parse
  };

  const handleTimeSlotClick = (hour: dayjs.Dayjs) => {
    setSelectedTime({
      date: userSelectedDate.toDate(),
      startTime: hour.format("HH:00")
    });
    setFormOpen(true);
  };

  return (
    <>
      <div className="glass m-4 rounded-xl overflow-hidden gradient-border cursor-glow">
        <div className="grid grid-cols-[auto_auto_1fr] px-4 py-3 bg-secondary/50 border-b border-white/10">
          <div className="w-16 text-muted-foreground text-sm font-medium">GMT</div>
          <div className="flex w-16 flex-col items-center">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center font-semibold text-xl",
                isToday ? "bg-primary text-white" : "text-muted-foreground"
              )}
            >
              {userSelectedDate.format("DD")}
            </div>
            <div className={cn("text-xs", isToday ? "text-primary" : "text-muted-foreground")}>
              {userSelectedDate.format("ddd")}
            </div>
          </div>
          <div></div>
        </div>
        
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
                <div
                  key={i}
                  className="relative flex h-20 border-t border-white/10 hover:bg-white/5 gradient-border cursor-glow"
                  onClick={() => handleTimeSlotClick(hour)}
                >
                  {/* Events for this hour */}
                  {dayEvents
                    .filter(event => getEventPosition(event) === hour.hour())
                    .map(event => (
                      <div 
                        key={event.id} 
                        className="absolute inset-x-2 z-10"
                        style={{ top: '2px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEventSummary(event);
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
                          onClick={() => openEventSummary(event)}
                          onLockToggle={(isLocked) => toggleEventLock(event.id, isLocked)}
                        />
                      </div>
                    ))}
                </div>
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
      </div>
      <AddEventButton />

      {/* Event Form Dialog */}
      <EventForm 
        open={formOpen} 
        onClose={() => setFormOpen(false)}
        initialTime={selectedTime}
      />
    </>
  );
};

export default DayView;
