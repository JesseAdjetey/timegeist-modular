
import React, { Fragment } from "react";
import MonthViewBox from "@/components/month-view-box";
import { useDateStore, useEventStore } from "@/lib/store";

const MonthView = () => {
  const { twoDMonthArray } = useDateStore();
  const { events, openEventSummary } = useEventStore();

  const getEventsForDay = (day: any) => {
    if (!day) return [];
    
    const dayStr = day.format('YYYY-MM-DD');
    return events.filter(event => event.date === dayStr);
  };

  return (
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
              />
            ))}
          </Fragment>
        ))}
      </section>
    </div>
  );
};

export default MonthView;
