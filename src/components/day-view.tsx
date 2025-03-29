
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useDateStore, useEventStore } from "@/lib/store";
import AddEventButton from "@/components/calendar/AddEventButton";
import EventForm from "@/components/calendar/EventForm";
import DayHeader from "./day-view/DayHeader";
import TimeSlotsGrid from "./day-view/TimeSlotsGrid";

const DayView = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate } = useDateStore();
  const { events } = useEventStore();
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
        <DayHeader 
          userSelectedDate={userSelectedDate} 
          isToday={isToday} 
        />
        
        <TimeSlotsGrid
          userSelectedDate={userSelectedDate}
          currentTime={currentTime}
          events={dayEvents}
          onTimeSlotClick={handleTimeSlotClick}
        />
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
