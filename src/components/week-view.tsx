
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

const WeekView = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate } = useDateStore();
  const { events, openEventSummary, toggleEventLock, updateEvent, addEvent, isEventSummaryOpen, closeEventSummary } = useEventStore();
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
  
  // Function to open the event form with todo data
  const openEventForm = (todoData: any, date: Date, startTime: string) => {
    console.log("Opening event form with todo data:", todoData, date, startTime);
    setTodoData(todoData);
    setSelectedTime({
      date: date,
      startTime: startTime
    });
    setFormOpen(true);
  };

  return (
    <div className="glass m-4 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <WeekHeader userSelectedDate={userSelectedDate} />

      {/* Time Column & Corresponding Boxes of time per each date */}
      <ScrollArea className="flex-1">
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
                onDrop={(e, day, hour) => handleDrop(e, day, hour, updateEvent, addEvent, openEventForm)}
                openEventSummary={openEventSummary}
                toggleEventLock={toggleEventLock}
              />
            );
          })}
        </div>
      </ScrollArea>
      <AddEventButton />

      {/* Event Form Dialog */}
      <EventForm 
        open={formOpen} 
        onClose={() => {
          setFormOpen(false);
          setTodoData(null);
        }}
        initialTime={selectedTime}
        todoData={todoData}
      />

      {/* Event Details Dialog */}
      <EventDetails
        open={isEventSummaryOpen}
        onClose={closeEventSummary}
      />
    </div>
  );
};

export default WeekView;
