
import React, { useState } from "react";
import dayjs from "dayjs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDateStore, useEventStore } from "@/lib/store";
import { getHours } from "@/lib/getTime";
import EventForm from "./calendar/EventForm";
import { useToast } from "@/hooks/use-toast";
import WeekHeader from "./calendar/week-view/WeekHeader";
import TimeColumn from "./calendar/week-view/TimeColumn";
import DayColumn from "./calendar/week-view/DayColumn";
import { handleDragOver, handleDrop } from "./calendar/week-view/DragDropHandlers";

const WeekView = () => {
  const { toast } = useToast();
  const { weekDates, currentMonth } = useDateStore();
  const { events, openEventSummary, toggleEventLock, updateEvent } = useEventStore();
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<{
    date: Date;
    startTime: string;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(dayjs());

  // Update current time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Handle click on time slot to create new event
  const handleTimeSlotClick = (day: dayjs.Dayjs, hour: dayjs.Dayjs) => {
    setSelectedDateTime({
      date: day.toDate(),
      startTime: hour.format("HH:00"),
    });
    setShowEventDialog(true);
  };

  // Get events for each day
  const getEventsForDay = (currentDate: dayjs.Dayjs) => {
    const date = currentDate.format("YYYY-MM-DD");
    return events.filter((event) => event.date === date);
  };

  return (
    <div>
      {/* Week Header with dates */}
      <WeekHeader weekDates={weekDates} currentMonth={currentMonth} />

      {/* Main grid with time slots */}
      <div className="grid grid-cols-[auto_1fr] h-[calc(100vh-12rem)] overflow-hidden rounded-xl bg-background/70 border border-white/10">
        {/* Time Column */}
        <TimeColumn />

        {/* Days Columns */}
        <div
          className={cn(
            "grid grid-cols-7"
          )}
        >
          {weekDates.map(({ currentDate }, i) => (
            <DayColumn
              key={i}
              currentDate={currentDate}
              dayEvents={getEventsForDay(currentDate)}
              currentTime={currentTime}
              onTimeSlotClick={handleTimeSlotClick}
              onDragOver={handleDragOver}
              onDrop={(e, day, hour) => handleDrop(e, day, hour, updateEvent)}
              openEventSummary={openEventSummary}
              toggleEventLock={toggleEventLock}
              updateEvent={updateEvent}
            />
          ))}
        </div>
      </div>

      {/* Event Creation Dialog */}
      {showEventDialog && selectedDateTime && (
        <EventForm
          open={showEventDialog}
          onClose={() => setShowEventDialog(false)}
          initialTime={selectedDateTime}
        />
      )}
    </div>
  );
};

export default WeekView;
