
import React, { Fragment, useState, useEffect } from "react";
import MonthViewBox from "@/components/month-view-box";
import { useDateStore, useEventStore } from "@/lib/store";
import AddEventButton from "@/components/calendar/AddEventButton";
import EventForm from "@/components/calendar/EventForm";
import EventDetails from "@/components/calendar/EventDetails";
import dayjs from "dayjs";

const MonthView = () => {
  const { twoDMonthArray } = useDateStore();
  const { events, openEventSummary, updateEvent, addEvent, isEventSummaryOpen, closeEventSummary } = useEventStore();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<{date: Date, startTime: string} | undefined>();
  const [todoData, setTodoData] = useState<any>(null);
  
  useEffect(() => {
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
    
    setTodoData(null);
    setSelectedTime({
      date: day.toDate(),
      startTime: '09:00'
    });
    setFormOpen(true);
  };
  
  const openEventForm = (todoData: any, day: dayjs.Dayjs) => {
    console.log("Opening event form with todo data in month view:", todoData, day.format("YYYY-MM-DD"));
    setTodoData(todoData);
    setSelectedTime({
      date: day.toDate(),
      startTime: '09:00'
    });
    setFormOpen(true);
  };
  
  const handleEventDrop = (event: any, newDate: string) => {
    const updatedEvent = {
      ...event,
      date: newDate
    };
    
    updateEvent(updatedEvent);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="glass m-4 rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="grid grid-cols-7 text-center py-2 bg-secondary/50 border-b border-white/10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-sm font-medium">
              {day}
            </div>
          ))}
        </div>
        
        <section className="grid grid-cols-7 grid-rows-5 flex-1">
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
      />

      <EventDetails
        open={isEventSummaryOpen}
        onClose={closeEventSummary}
      />
    </div>
  );
};

export default MonthView;
