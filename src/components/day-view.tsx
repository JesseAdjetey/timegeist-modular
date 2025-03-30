
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useDateStore, useEventStore } from "@/lib/store";
import AddEventButton from "@/components/calendar/AddEventButton";
import EventForm from "@/components/calendar/EventForm";
import EventDetails from "@/components/calendar/EventDetails";
import DayHeader from "./day-view/DayHeader";
import TimeSlotsGrid from "./day-view/TimeSlotsGrid";
import { useCalendarEvents } from "@/hooks/use-calendar-events";

const DayView = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate } = useDateStore();
  const { isEventSummaryOpen, closeEventSummary } = useEventStore();
  const { events, addEvent } = useCalendarEvents();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<{date: Date, startTime: string} | undefined>();
  const [todoData, setTodoData] = useState<any>(null);

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

  const handleTimeSlotClick = (hour: dayjs.Dayjs) => {
    setTodoData(null); // Reset todo data
    setSelectedTime({
      date: userSelectedDate.toDate(),
      startTime: hour.format("HH:00")
    });
    setFormOpen(true);
  };
  
  // Function to open event form with todo data
  const openEventForm = (todoData: any, hour: dayjs.Dayjs) => {
    console.log("Opening event form with todo data in day view:", todoData, hour.format("HH:mm"));
    setTodoData(todoData);
    setSelectedTime({
      date: userSelectedDate.toDate(),
      startTime: hour.format("HH:00")
    });
    setFormOpen(true);
  };

  return (
    <>
      <div className="glass m-4 rounded-xl overflow-hidden gradient-border cursor-glow">
        <DayHeader 
          userSelectedDate={userSelectedDate} 
          isToday={isToday} 
        />
        
        <TimeSlotsGrid
          userSelectedDate={userSelectedDate}
          currentTime={currentTime}
          events={dayEvents}
          onTimeSlotClick={handleTimeSlotClick}
          addEvent={addEvent}
          openEventForm={openEventForm}
        />
      </div>
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
    </>
  );
};

export default DayView;
