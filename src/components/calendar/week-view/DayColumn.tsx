
import React from "react";
import { getHours, isCurrentDay } from "@/lib/getTime";
import { CalendarEventType } from "@/lib/stores/types";
import dayjs from "dayjs";
import CalendarEvent from "../CalendarEvent";
import CurrentTimeIndicator from "./CurrentTimeIndicator";
import { calculateEventHeight, calculateEventPosition, getTimeInfo } from "../event-utils/touch-handlers";

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
  const hourHeight = 80; // The height in pixels of each hour cell

  return (
    <div className="relative border-r border-white/10">
      {getHours.map((hour, i) => (
        <div
          key={i}
          className="relative flex h-20 cursor-pointer border-t border-white/10 hover:bg-white/5"
          onClick={() => onTimeSlotClick(currentDate, hour)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, currentDate, hour)}
        />
      ))}

      {/* Events displayed at their exact positions */}
      {dayEvents.map(event => {
        const timeInfo = getTimeInfo(event.description);
        const topPosition = calculateEventPosition(timeInfo.start, hourHeight);
        const eventHeight = calculateEventHeight(timeInfo.start, timeInfo.end, hourHeight);
        
        return (
          <div 
            key={event.id} 
            className="absolute inset-x-0.5 z-10"
            style={{ 
              top: `${topPosition}px`,
              height: `${eventHeight}px`
            }}
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
        );
      })}

      {/* Current Time indicator */}
      <CurrentTimeIndicator 
        currentTime={currentTime} 
        isCurrentDay={isCurrentDay(currentDate)} 
      />
    </div>
  );
};

export default DayColumn;
