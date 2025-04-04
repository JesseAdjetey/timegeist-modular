// src/components/month-view.tsx

import React, { Fragment, useState, useEffect } from "react";
import MonthViewBox from "@/components/month-view-box";
import { useDateStore, useEventStore } from "@/lib/store";
import AddEventButton from "@/components/calendar/AddEventButton";
import EventForm from "@/components/calendar/EventForm";
import EventDetails from "@/components/calendar/EventDetails";
import dayjs from "dayjs";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { CalendarEventType } from "@/lib/stores/types";
import { toast } from "sonner";

const MonthView = () => {
  const { twoDMonthArray } = useDateStore();
  const { openEventSummary, isEventSummaryOpen, closeEventSummary } =
    useEventStore();
  const { events, updateEvent, addEvent } = useCalendarEvents();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<
    { date: Date; startTime: string } | undefined
  >();
  const [todoData, setTodoData] = useState<any>(null);
  const [pendingDaySelection, setPendingDaySelection] =
    useState<dayjs.Dayjs | null>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .touch-dragging {
        opacity: 0.6;
        transform: scale(0.95);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 100;
        position: relative;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (pendingDaySelection) {
      setSelectedTime({
        date: pendingDaySelection.toDate(),
        startTime: "09:00",
      });

      setTimeout(() => {
        setFormOpen(true);
        setPendingDaySelection(null);
      }, 0);
    }
  }, [pendingDaySelection]);

  const getEventsForDay = (day: any) => {
    if (!day) return [];

    const dayStr = day.format("YYYY-MM-DD");
    return events.filter((event) => event.date === dayStr);
  };

  const handleDayClick = (day: any) => {
    if (!day) return;

    setTodoData(null);
    setPendingDaySelection(day);
  };

  const openEventForm = (todoData: any, day: dayjs.Dayjs) => {
    console.log(
      "Opening event form with todo data in month view:",
      todoData,
      day.format("YYYY-MM-DD")
    );
    setTodoData(todoData);
    setPendingDaySelection(day);
  };

  const handleEventDrop = async (event: any, newDate: string) => {
    const updatedEvent = {
      ...event,
      date: newDate,
    };

    await updateEvent(updatedEvent);
  };

  const handleSaveEvent = async (event: CalendarEventType) => {
    try {
      const response = await addEvent(event);

      if (response.success) {
        setFormOpen(false);
        toast.success(`${event.title} has been added to your calendar.`);
      } else {
        toast.error(response.error
          ? String(response.error)
          : "Failed to add event");
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <>
      <div className="glass m-4 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 text-center py-2 bg-secondary/50 border-b border-white/10">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        <section className="grid grid-cols-7 grid-rows-5 lg:h-[85vh]">
          {twoDMonthArray.map((row, i) => (
            <Fragment key={i}>
              {row.map((day, index) => (
                <MonthViewBox
                  key={index}
                  day={day}
                  rowIndex={i}
                  events={getEventsForDay(day)}
                  onEventClick={openEventSummary}
                  onDayClick={handleDayClick}
                  onEventDrop={handleEventDrop}
                  addEvent={addEvent}
                  openEventForm={openEventForm}
                />
              ))}
            </Fragment>
          ))}
        </section>
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

export default MonthView;
