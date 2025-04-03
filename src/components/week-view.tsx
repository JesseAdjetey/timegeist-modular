// src/components/week-view.tsx
import React, { useEffect, useState } from "react";
import { getWeekDays } from "@/lib/getTime";
import { useDateStore, useEventStore } from "@/lib/store";
import dayjs from "dayjs";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddEventButton from "@/components/calendar/AddEventButton";
import EventForm from "@/components/calendar/EventForm";
import EventDetails from "@/components/calendar/EventDetails";
import WeekHeader from "./calendar/week-view/WeekHeader";
import TimeColumn from "./calendar/week-view/TimeColumn";
import DayColumn from "./calendar/week-view/DayColumn";
import { handleDragOver, handleDrop } from "./calendar/week-view/DragDropHandlers";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { CalendarEventType } from "@/lib/stores/types";
import { toast } from "@/components/ui/use-toast"; // Proper import for toast

const WeekView = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate } = useDateStore();
  const { openEventSummary, toggleEventLock, isEventSummaryOpen, closeEventSummary } = useEventStore();
  const { events, updateEvent, addEvent } = useCalendarEvents();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<{date: Date, startTime: string} | undefined>();
  const [todoData, setTodoData] = useState<any>(null);

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

  const handleTimeSlotClick = (day: dayjs.Dayjs, hour: dayjs.Dayjs) => {
    setTodoData(null); // Reset todo data
    setSelectedTime({
      date: day.toDate(),
      startTime: hour.format("HH:00")
    });
    setFormOpen(true);
  };
  
  const openEventForm = (todoData: any, date: Date, startTime: string) => {
    console.log("Opening event form with todo data:", todoData, date, startTime);
    setTodoData(todoData);
    setSelectedTime({
      date: date,
      startTime: startTime
    });
    setFormOpen(true);
  };

  const handleUpdateEvent = async (event: CalendarEventType) => {
    await updateEvent(event);
  };
  
  const handleAddEvent = async (event: CalendarEventType) => {
    await addEvent(event);
    return;
  };

  const handleSaveEvent = async (event: CalendarEventType) => {
    try {
      // Use the addEvent function from useCalendarEvents
      const response = await addEvent(event);
      
      if (response && response.success) {
        setFormOpen(false); // Close form if applicable
        toast({
          title: "Event Added",
          description: `${event.title} has been added to your calendar.`,
        });
        return { success: true, data: response.data };
      } else {
        toast({
          title: "Error",
          description: response && response.error ? String(response.error) : "Failed to add event",
          variant: "destructive"
        });
        return { success: false, error: response && response.error };
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  return (
    <>
      <div className="glass m-4 rounded-xl overflow-hidden">
        <WeekHeader userSelectedDate={userSelectedDate} />

        {/* Time Column & Corresponding Boxes of time per each date */}
        <ScrollArea className="h-[80vh]">
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] px-4 py-2">
            {/* Time Column */}
            <TimeColumn />

            {/* Week Days Corresponding Boxes */}
            {getWeekDays(userSelectedDate).map(({ currentDate }, index) => {
              const dayEvents = getEventsForDay(currentDate);
              
              return (
                <DayColumn
                  key={index}
                  currentDate={currentDate}
                  dayEvents={dayEvents}
                  currentTime={currentTime}
                  onTimeSlotClick={handleTimeSlotClick}
                  onDragOver={handleDragOver}
                  onDrop={(e, day, hour) => handleDrop(e, day, hour, handleUpdateEvent, handleAddEvent, openEventForm)}
                  openEventSummary={openEventSummary}
                  toggleEventLock={toggleEventLock}
                />
              );
            })}
          </div>
        </ScrollArea>
      </div>
      <AddEventButton />

      <EventForm 
        open={formOpen} 
        onClose={() => {
          setFormOpen(false);
          setTodoData(null);
        }}
        initialTime={selectedTime}
        todoData={todoData}
        onSave={handleSaveEvent}
      />

      <EventDetails
        open={isEventSummaryOpen}
        onClose={closeEventSummary}
      />
    </>
  );
};

export default WeekView;
