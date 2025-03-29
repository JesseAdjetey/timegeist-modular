import React, { useEffect, useState } from "react";
import { getHours, getWeekDays, isCurrentDay } from "@/lib/getTime";
import { useDateStore, useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { ScrollArea } from "@/components/ui/scroll-area";
import CalendarEvent from "./calendar/CalendarEvent";
import AddEventButton from "@/components/calendar/AddEventButton";

const WeekView = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate } = useDateStore();
  const { events, openEventSummary, toggleEventLock } = useEventStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getEventsForDay = (day: dayjs.Dayjs) => {
    const dayStr = day.format('YYYY-MM-DD');
    return events.filter(event => event.date === dayStr);
  };

  // Calculate event position (very simplified version for demo)
  const getEventPosition = (event: any) => {
    // Extract hour from event description (assuming format like "9:00 - 10:30 | Description")
    const hourMatch = event.description.match(/(\d+):(\d+)/);
    if (hourMatch) {
      return parseInt(hourMatch[1], 10);
    }
    return 9; // Default to 9am if we can't parse
  };

  return (
    <>
      <div className="glass m-4 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] place-items-center px-4 py-2 bg-secondary/50 border-b border-white/10">
          <div className="w-16 text-muted-foreground text-sm font-medium">GMT</div>

          {/* Week View Header */}
          {getWeekDays(userSelectedDate).map(({ currentDate, today }, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center font-semibold text-xl",
                  today ? "bg-primary text-white" : "text-muted-foreground"
                )}
              >
                {currentDate.format("DD")}
              </div>
              <div className={cn("text-xs", today ? "text-primary" : "text-muted-foreground")}>
                {currentDate.format("ddd")}
              </div>
            </div>
          ))}
        </div>

        {/* Time Column & Corresponding Boxes of time per each date */}
        <ScrollArea className="h-[80vh]">
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] px-4 py-2">
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

            {/* Week Days Corresponding Boxes */}
            {getWeekDays(userSelectedDate).map(({ currentDate }, index) => {
              const dayEvents = getEventsForDay(currentDate);
              
              return (
                <div key={index} className="relative border-r border-white/10">
                  {getHours.map((hour, i) => (
                    <div
                      key={i}
                      className="relative flex h-20 cursor-pointer border-t border-white/10 hover:bg-white/5"
                    >
                      {/* Events for this hour */}
                      {dayEvents
                        .filter(event => getEventPosition(event) === hour.hour())
                        .map(event => (
                          <div 
                            key={event.id} 
                            className="absolute inset-x-0.5 z-10"
                            style={{ top: '2px' }}
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

                  {/* Current Time indicator */}
                  {isCurrentDay(currentDate) && (
                    <div
                      className="absolute h-0.5 w-full bg-primary z-20"
                      style={{
                        top: `${(currentTime.hour() * 60 + currentTime.minute()) / (24 * 60) * 100 * 20}px`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
      <AddEventButton />
    </>
  );
};

export default WeekView;
