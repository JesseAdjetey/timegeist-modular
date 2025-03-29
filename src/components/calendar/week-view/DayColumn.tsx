
import React from "react";
import { getHours, isCurrentDay } from "@/lib/getTime";
import { CalendarEventType } from "@/lib/stores/types";
import dayjs from "dayjs";
import CalendarEvent from "../CalendarEvent";
import CurrentTimeIndicator from "./CurrentTimeIndicator";

interface DayColumnProps {
  currentDate: dayjs.Dayjs;
  dayEvents: CalendarEventType[];
  currentTime: dayjs.Dayjs;
  onTimeSlotClick: (day: dayjs.Dayjs, hour: dayjs.Dayjs) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, day: dayjs.Dayjs, hour: dayjs.Dayjs) => void;
  openEventSummary: (event: CalendarEventType) => void;
  toggleEventLock: (id: string, isLocked: boolean) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  currentDate,
  dayEvents,
  currentTime,
  onTimeSlotClick,
  onDragOver,
  onDrop,
  openEventSummary,
  toggleEventLock,
}) => {
  // Calculate event position (very simplified version for demo)
  const getEventPosition = (event: CalendarEventType) => {
    // Extract hour from event description (assuming format like "9:00 - 10:30 | Description")
    const hourMatch = event.description.match(/(\d+):(\d+)/);
    if (hourMatch) {
      return parseInt(hourMatch[1], 10);
    }
    return 9; // Default to 9am if we can't parse
  };

  return (
    <div className="relative border-r border-white/10">
      {getHours.map((hour, i) => (
        <div
          key={i}
          className="relative flex h-20 cursor-pointer border-t border-white/10 hover:bg-white/5"
          onClick={() => onTimeSlotClick(currentDate, hour)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, currentDate, hour)}
        >
          {/* Events for this hour */}
          {dayEvents
            .filter(event => getEventPosition(event) === hour.hour())
            .map(event => (
              <div 
                key={event.id} 
                className="absolute inset-x-0.5 z-10"
                style={{ top: '2px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  openEventSummary(event);
                }}
              >
                <CalendarEvent
                  event={event}
                  color={event.color}
                  isLocked={event.isLocked}
                  hasAlarm={event.hasAlarm}
                  hasReminder={event.hasReminder}
                  hasTodo={event.isTodo}
                  participants={event.participants}
                  onClick={() => openEventSummary(event)}
                  onLockToggle={(isLocked) => toggleEventLock(event.id, isLocked)}
                />
              </div>
            ))}
        </div>
      ))}

      {/* Current Time indicator */}
      <CurrentTimeIndicator 
        currentTime={currentTime} 
        isCurrentDay={isCurrentDay(currentDate)} 
      />
    </div>
  );
};

export default DayColumn;
