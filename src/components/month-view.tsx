
import React, { Fragment, useState } from "react";
import MonthViewBox from "@/components/month-view-box";
import { useDateStore, useEventStore } from "@/lib/store";
import AddEventButton from "@/components/calendar/AddEventButton";
import EventForm from "@/components/calendar/EventForm";

const MonthView = () => {
  const { twoDMonthArray } = useDateStore();
  const { events, openEventSummary } = useEventStore();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<{date: Date, startTime: string} | undefined>();

  const getEventsForDay = (day: any) => {
    if (!day) return [];
    
    const dayStr = day.format('YYYY-MM-DD');
    return events.filter(event => event.date === dayStr);
  };

  const handleDayClick = (day: any) => {
    if (!day) return;
    
    // Default to 9 AM when clicking on a day in month view
    setSelectedTime({
      date: day.toDate(),
      startTime: '09:00'
    });
    setFormOpen(true);
  };

  return (
    <>
      <div className="glass m-4 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 text-center py-2 bg-secondary/50 border-b border-white/10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
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
                />
              ))}
            </Fragment>
          ))}
        </section>
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

export default MonthView;
