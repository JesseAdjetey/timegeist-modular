
import React, { Fragment, useState, useEffect } from "react";
import MonthViewBox from "@/components/month-view-box";
import { useDateStore, useEventStore } from "@/lib/store";
import AddEventButton from "@/components/calendar/AddEventButton";
import EventForm from "@/components/calendar/EventForm";
import EventDetails from "@/components/calendar/EventDetails";

const MonthView = () => {
  const { twoDMonthArray } = useDateStore();
  const { events, openEventSummary, updateEvent, addEvent, isEventSummaryOpen, closeEventSummary } = useEventStore();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<{date: Date, startTime: string} | undefined>();
  const [todoData, setTodoData] = useState<any>(null);
  
  useEffect(() => {
    // Add global CSS to style elements while being dragged via touch
    const style = document.createElement('style');
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

  const getEventsForDay = (day: any) => {
    if (!day) return [];
    
    const dayStr = day.format('YYYY-MM-DD');
    return events.filter(event => event.date === dayStr);
  };

  const handleDayClick = (day: any) => {
    if (!day) return;
    
    // Default to 9 AM when clicking on a day in month view
    setTodoData(null); // Reset todo data
    setSelectedTime({
      date: day.toDate(),
      startTime: '09:00'
    });
    setFormOpen(true);
  };
  
  // Handle opening event form with todo data
  const openEventForm = (todoData: any, day: dayjs.Dayjs) => {
    console.log("Opening event form with todo data in month view:", todoData, day.format("YYYY-MM-DD"));
    setTodoData(todoData);
    setSelectedTime({
      date: day.toDate(),
      startTime: '09:00' // Default to 9 AM for month view
    });
    setFormOpen(true);
  };
  
  // Handle event dropping in the month view
  const handleEventDrop = (event: any, newDate: string) => {
    // Create updated event with new date
    const updatedEvent = {
      ...event,
      date: newDate
    };
    
    // Update the event in the store
    updateEvent(updatedEvent);
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

export default MonthView;
