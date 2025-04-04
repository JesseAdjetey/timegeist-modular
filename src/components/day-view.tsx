// src/components/day-view.tsx

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useDateStore, useEventStore } from "@/lib/store";
import AddEventButton from "@/components/calendar/AddEventButton";
import EventForm from "@/components/calendar/EventForm";
import EventDetails from "@/components/calendar/EventDetails";
import DayHeader from "./day-view/DayHeader";
import TimeSlotsGrid from "./day-view/TimeSlotsGrid";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { CalendarEventType } from "@/lib/stores/types";
import { toast } from "@/components/ui/use-toast";

const DayView = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate } = useDateStore();
  const { isEventSummaryOpen, closeEventSummary } = useEventStore();
  const { events, addEvent } = useCalendarEvents();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<
    { date: Date; startTime: string } | undefined
  >();
  const [todoData, setTodoData] = useState<any>(null);
  const [pendingTimeSelection, setPendingTimeSelection] = useState<{
    hour: dayjs.Dayjs;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pendingTimeSelection) {
      const { hour } = pendingTimeSelection;

      setSelectedTime({
        date: userSelectedDate.toDate(),
        startTime: hour.format("HH:00"),
      });

      setTimeout(() => {
        setFormOpen(true);
        setPendingTimeSelection(null);
      }, 0);
    }
  }, [pendingTimeSelection, userSelectedDate]);

  const isToday =
    userSelectedDate.format("DD-MM-YY") === dayjs().format("DD-MM-YY");

  const dayEvents = events.filter(
    (event) => event.date === userSelectedDate.format("YYYY-MM-DD")
  );

  const handleTimeSlotClick = (hour: dayjs.Dayjs) => {
    setTodoData(null);
    setPendingTimeSelection({ hour });
  };

  const openEventForm = (todoData: any, hour: dayjs.Dayjs) => {
    console.log(
      "Opening event form with todo data in day view:",
      todoData,
      hour.format("HH:mm")
    );
    setTodoData(todoData);
    setPendingTimeSelection({ hour });
  };

  const handleAddEvent = async (event: CalendarEventType) => {
    return await addEvent(event);
  };

  const handleSaveEvent = async (event: CalendarEventType) => {
    try {
      const response = await addEvent(event);

      if (response.success) {
        setFormOpen(false);
        toast({
          title: "Event Added",
          description: `${event.title} has been added to your calendar.`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message
            ? String(response.message)
            : "Failed to add event",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="glass m-4 rounded-xl overflow-hidden gradient-border cursor-glow">
        <DayHeader userSelectedDate={userSelectedDate} isToday={isToday} />

        <TimeSlotsGrid
          userSelectedDate={userSelectedDate}
          currentTime={currentTime}
          events={dayEvents}
          onTimeSlotClick={handleTimeSlotClick}
          addEvent={handleAddEvent}
          openEventForm={openEventForm}
        />
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

      <EventDetails open={isEventSummaryOpen} onClose={closeEventSummary} />
    </>
  );
};

export default DayView;
