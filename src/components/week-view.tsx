import React, { useEffect, useState } from "react";
import { getHours, getWeekDays, isCurrentDay } from "@/lib/getTime";
import { useDateStore, useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { ScrollArea } from "@/components/ui/scroll-area";
import CalendarEvent from "./calendar/CalendarEvent";
import AddEventButton from "@/components/calendar/AddEventButton";
import EventForm from "@/components/calendar/EventForm";
import { toast } from "sonner";

const WeekView = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate } = useDateStore();
  const { events, openEventSummary, toggleEventLock, updateEvent } = useEventStore();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<{date: Date, startTime: string} | undefined>();

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

  const handleTimeSlotClick = (day: dayjs.Dayjs, hour: dayjs.Dayjs) => {
    setSelectedTime({
      date: day.toDate(),
      startTime: hour.format("HH:00")
    });
    setFormOpen(true);
  };
  
  // Handle dropping an event onto a time slot
  const handleDrop = (e: React.DragEvent, day: dayjs.Dayjs, hour: dayjs.Dayjs) => {
    e.preventDefault();
    
    try {
      // Get the drag data
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Don't process if the event is locked
      if (data.isLocked) return;
      
      // Calculate new time - keep the same duration but update the start time
      const oldStart = data.timeStart;
      const oldEnd = data.timeEnd;
      
      // Calculate duration in minutes
      const oldStartParts = oldStart.split(':').map(Number);
      const oldEndParts = oldEnd.split(':').map(Number);
      const oldStartMinutes = oldStartParts[0] * 60 + oldStartParts[1];
      const oldEndMinutes = oldEndParts[0] * 60 + oldEndParts[1];
      const durationMinutes = oldEndMinutes - oldStartMinutes;
      
      // Set new start time to the hour of the drop target
      const newStartTime = hour.format("HH:00");
      
      // Calculate new end time
      const newStartParts = newStartTime.split(':').map(Number);
      const newStartMinutes = newStartParts[0] * 60 + newStartParts[1];
      const newEndMinutes = newStartMinutes + durationMinutes;
      
      const newEndHours = Math.floor(newEndMinutes / 60) % 24;
      const newEndMinutes2 = newEndMinutes % 60;
      
      const newEndTime = `${newEndHours.toString().padStart(2, '0')}:${newEndMinutes2.toString().padStart(2, '0')}`;
      
      // Get description without time part
      const descriptionParts = data.description.split('|');
      const descriptionText = descriptionParts.length > 1 ? descriptionParts[1].trim() : '';
      
      // Create the updated event
      const updatedEvent = {
        ...data,
        date: day.format('YYYY-MM-DD'), // Set to the drop target day
        description: `${newStartTime} - ${newEndTime} | ${descriptionText}`
      };
      
      // Update the event in the store
      updateEvent(updatedEvent);
      
      // Show success message
      toast.success(`Event moved to ${day.format("MMM D")} at ${newStartTime}`);
      
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
                      onClick={() => handleTimeSlotClick(currentDate, hour)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, currentDate, hour)}
                    >
                      {/* Events for this hour */}
                      {dayEvents
                        .filter(event => getEventPosition(event) === hour.hour())
                        .map(event => (
                          <div 
                            key={event.id} 
                            className="absolute inset-x-0.5 z-10"
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

      {/* Event Form Dialog */}
      <EventForm 
        open={formOpen} 
        onClose={() => setFormOpen(false)}
        initialTime={selectedTime}
      />
    </>
  );
};

export default WeekView;
