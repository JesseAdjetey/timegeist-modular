
import React from "react";
import { Bell, CalendarClock, ListTodo } from "lucide-react";

interface EventIndicatorsProps {
  hasAlarm?: boolean;
  hasReminder?: boolean;
  hasTodo?: boolean;
  participants?: string[];
}

const EventIndicators: React.FC<EventIndicatorsProps> = ({
  hasAlarm,
  hasReminder,
  hasTodo,
  participants = [],
}) => {
  return (
    <div className="flex gap-1 mt-1">
      {hasAlarm && <Bell size={12} className="text-white/70" />}
      {hasReminder && <CalendarClock size={12} className="text-white/70" />}
      {hasTodo && <ListTodo size={12} className="text-white/70" />}

      {/* Participants */}
      {participants && participants.length > 0 && (
        <div className="flex -space-x-1">
          {participants.slice(0, 3).map((participant, i) => (
            <div
              key={i}
              className="h-4 w-4 rounded-full bg-white/30 text-[8px] flex items-center justify-center ring-1 ring-white/10"
            >
              {participant.charAt(0)}
            </div>
          ))}
          {participants.length > 3 && (
            <div className="h-4 w-4 rounded-full bg-white/30 text-[8px] flex items-center justify-center ring-1 ring-white/10">
              +{participants.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventIndicators;
