
import React from "react";
import { cn } from "@/lib/utils";
import { useEventDrag } from "@/hooks/use-event-drag";
import EventIndicators from "./event-components/EventIndicators";
import EventLockToggle from "./event-components/EventLockToggle";
import DragHandle from "./event-components/DragHandle";
import { CalendarEventType } from "@/lib/stores/types";
import { CheckSquare, ListTodo } from "lucide-react";

interface CalendarEventProps {
  event: CalendarEventType;
  color?: string;
  isLocked?: boolean;
  hasAlarm?: boolean;
  hasReminder?: boolean;
  hasTodo?: boolean;
  participants?: string[];
  onClick?: () => void;
  onLockToggle?: (locked: boolean) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  color = "bg-primary/70",
  isLocked = false,
  hasAlarm = false,
  hasReminder = false,
  hasTodo = false,
  participants = [],
  onClick,
  onLockToggle,
  onMouseDown,
}) => {
  const {
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
  } = useEventDrag(event, isLocked, color);

  const handleLockToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLockToggle) onLockToggle(!isLocked);
  };

  // Whether this is a todo-related event
  const isTodoEvent = Boolean(event.isTodo || event.todoId || hasTodo);

  const startCalendarDrag = (e: React.DragEvent) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }

    // Add the source field to identify this as coming from the calendar
    const dragData = {
      ...event,
      source: "calendar-module",
      isLocked: !!isLocked,
      hasTodo: isTodoEvent,
    };

    console.log("Starting calendar event drag:", dragData);
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={cn(
        "calendar-event group",
        color,
        !isLocked && "cursor-move",
        isDragging && "opacity-70"
      )}
      onClick={(e) => handleClick(e, onClick)}
      draggable={!isLocked}
      onDragStart={isLocked ? undefined : startCalendarDrag}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={onMouseDown}
    >
      <div className="relative">
        {/* Lock/Unlock Button */}
        <EventLockToggle isLocked={Boolean(isLocked)} onToggle={handleLockToggle} />

        {/* Drag Handle (only shown if not locked) */}
        {!isLocked && <DragHandle />}

        {/* Event Title */}
        <div className="font-medium">{event.title}</div>

        {/* Event Time or Description */}
        <div className="text-xs opacity-80">{event.description}</div>

        {/* Indicators */}
        <EventIndicators
          hasAlarm={hasAlarm}
          hasReminder={hasReminder}
          hasTodo={isTodoEvent}
          participants={participants}
        />

        {/* Todo indicator at bottom right */}
        {isTodoEvent && (
          <div className="absolute bottom-0 right-0 bg-white/10 rounded-full p-0.5 m-0.5">
            <ListTodo size={12} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarEvent;
