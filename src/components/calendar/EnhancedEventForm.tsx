import React, { useState, useEffect } from "react";
import { CalendarEventType } from "@/lib/stores/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  Clock,
  Bell,
  Lock,
  Unlock,
  CheckSquare,
  CalendarClock,
  Sparkles,
  ListTodo,
} from "lucide-react";
import { useDateStore } from "@/lib/store";
import dayjs from "dayjs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getTimeInfo } from "@/components/calendar/event-utils/touch-handlers";
import { useTodos } from "@/hooks/use-todos";
import {
  createTodoFromCalendarEvent,
  syncEventTitleWithTodo,
} from "@/lib/dragdropHandlers";
import { toast } from "@/components/ui/use-toast";

interface EventFormProps {
  initialEvent?: Partial<CalendarEventType>;
  onSave: (event: CalendarEventType) => void;
  onCancel: () => void;
  onUseAI?: () => void;
  createTodoFromEvent?: (event: CalendarEventType) => Promise<string | null>;
}

const EnhancedEventForm: React.FC<EventFormProps> = ({
  initialEvent,
  onSave,
  onCancel,
  onUseAI,
  createTodoFromEvent,
}) => {
  const { userSelectedDate } = useDateStore();
  const { addTodo, linkTodoToEvent, updateTodoTitle } = useTodos();
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [originalTitle] = useState(initialEvent?.title || ""); // Keep track of original title

  // Parse times from description if available
  const parseTimeFromDescription = (description?: string) => {
    if (!description) return { startTime: "09:00", endTime: "10:00", desc: "" };

    const timeInfo = getTimeInfo(description);
    const parts = description.split("|");
    const desc = parts.length >= 2 ? parts[1].trim() : "";

    return {
      startTime: timeInfo.start,
      endTime: timeInfo.end,
      desc,
    };
  };

  const { startTime, endTime, desc } = parseTimeFromDescription(
    initialEvent?.description
  );

  const [description, setDescription] = useState(desc);
  const [timeStart, setTimeStart] = useState(startTime);
  const [timeEnd, setTimeEnd] = useState(endTime);

  // Date state as Date object for the calendar
  const [date, setDate] = useState<Date>(
    initialEvent?.date ? new Date(initialEvent.date) : userSelectedDate.toDate()
  );

  const [isLocked, setIsLocked] = useState(initialEvent?.isLocked || false);
  const [isTodo, setIsTodo] = useState(initialEvent?.isTodo || false);
  const [hasAlarm, setHasAlarm] = useState(initialEvent?.hasAlarm || false);
  const [hasReminder, setHasReminder] = useState(
    initialEvent?.hasReminder || false
  );
  const [todoId, setTodoId] = useState<string | undefined>(
    initialEvent?.todoId
  );
  const [isTitleChanged, setIsTitleChanged] = useState(false);

  // Track if this is a new event or an edit
  const isEditMode = !!initialEvent?.id;

  // Ensure timeEnd is after timeStart
  useEffect(() => {
    const startMinutes =
      parseInt(timeStart.split(":")[0]) * 60 +
      parseInt(timeStart.split(":")[1] || "0");
    const endMinutes =
      parseInt(timeEnd.split(":")[0]) * 60 +
      parseInt(timeEnd.split(":")[1] || "0");

    if (endMinutes <= startMinutes) {
      // Set end time to be 1 hour after start time
      const newEndMinutes = startMinutes + 60;
      const newEndHours = Math.floor(newEndMinutes / 60) % 24;
      const newEndMins = newEndMinutes % 60;
      setTimeEnd(
        `${newEndHours.toString().padStart(2, "0")}:${newEndMins
          .toString()
          .padStart(2, "0")}`
      );
    }
  }, [timeStart, timeEnd]);

  // Track if title has changed
  useEffect(() => {
    setIsTitleChanged(title !== originalTitle && originalTitle !== "");
  }, [title, originalTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert the date and times to ISO strings for startsAt and endsAt
    const eventDate = dayjs(date).format("YYYY-MM-DD");
    const startDateTime = dayjs(`${eventDate} ${timeStart}`);
    const endDateTime = dayjs(`${eventDate} ${timeEnd}`);

    // Create the event object
    const newEvent: CalendarEventType = {
      id: initialEvent?.id || "temp-id", // Will be replaced with nanoid in the parent component
      title,
      description: `${timeStart} - ${timeEnd} | ${description}`,
      date: eventDate, // For backward compatibility
      isLocked,
      isTodo,
      hasAlarm,
      hasReminder,
      color: initialEvent?.color, // Preserve the original color if it exists
      startsAt: startDateTime.toISOString(),
      endsAt: endDateTime.toISOString(),
      todoId,
    };

    // Synchronize with todo if needed
    if (initialEvent?.id && todoId && isTitleChanged) {
      // Update the linked todo with new title
      await syncEventTitleWithTodo(
        initialEvent.id,
        todoId,
        title,
        updateTodoTitle
      );
    }

    // Create a new todo if this is a new event and isTodo is true
    if (!isEditMode && isTodo && !todoId && createTodoFromEvent) {
      // We need to pass a valid id, but we don't have one yet
      // We'll use a temporary one and the actual function should handle it
      const temporaryEvent: CalendarEventType = {
        ...newEvent,
        id: "temp-id-for-todo-creation",
      };

      const newTodoId = await createTodoFromEvent(temporaryEvent);
      if (newTodoId) {
        newEvent.todoId = newTodoId;
      }
    }

    // For existing event that wasn't a todo before, but now is
    if (
      isEditMode &&
      isTodo &&
      !initialEvent?.isTodo &&
      !todoId &&
      createTodoFromEvent
    ) {
      const newTodoId = await createTodoFromEvent({
        ...(initialEvent as CalendarEventType),
        title, // Use the new title
      });

      if (newTodoId) {
        newEvent.todoId = newTodoId;
      }
    }

    // For existing todo-event that's no longer a todo
    if (isEditMode && !isTodo && initialEvent?.isTodo && initialEvent.todoId) {
      // This will be handled at the event update level
      newEvent.todoId = undefined;
    }

    console.log("Event being saved:", newEvent);
    onSave(newEvent);
  };

  const formattedDate = dayjs(date).format("dddd, MMMM D");

  return (
    <div className="py-6 max-h-[85vh] overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold gradient-text mb-1">
          {isEditMode ? "Edit Event" : "Add Event"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isEditMode
            ? "Update this event on your calendar"
            : "Create a new event on your calendar"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title input */}
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-background/30 border-white/10 focus:border-primary h-12 text-base"
            placeholder="Event title"
            required
          />
        </div>

        {/* Date and time row */}
        <div className="grid grid-cols-1 gap-3">
          {/* Date picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-[42px] bg-background/30 border-white/10 hover:bg-white/10"
              >
                <CalendarIcon size={18} className="text-primary/80 mr-2" />
                {formattedDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-white/10 bg-background/95">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
                className="bg-background/95 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Time selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1 ml-1">
                Start Time
              </label>
              <div className="flex items-center h-[42px] rounded-md border border-white/10 bg-background/30 overflow-hidden">
                <Clock size={18} className="text-primary/80 ml-3 mr-2" />
                <Input
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="border-0 bg-transparent h-full p-0 focus-visible:ring-0"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1 ml-1">
                End Time
              </label>
              <div className="flex items-center h-[42px] rounded-md border border-white/10 bg-background/30 overflow-hidden">
                <Clock size={18} className="text-primary/80 ml-3 mr-2" />
                <Input
                  type="time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="border-0 bg-transparent h-full p-0 focus-visible:ring-0"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[60px] bg-background/30 border-white/10 focus:border-primary resize-none"
            placeholder="Event description"
          />
        </div>

        {/* Event options */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => setIsTodo(!isTodo)}
            variant={isTodo ? "default" : "outline"}
            className={`rounded-full text-sm h-9 ${
              isTodo ? "bg-primary/90" : "bg-background/30 border-white/10"
            }`}
          >
            <ListTodo size={16} className="mr-1" />
            To-do
          </Button>

          <Button
            type="button"
            onClick={() => setHasAlarm(!hasAlarm)}
            variant={hasAlarm ? "default" : "outline"}
            className={`rounded-full text-sm h-9 ${
              hasAlarm ? "bg-primary/90" : "bg-background/30 border-white/10"
            }`}
          >
            <Bell size={16} className="mr-1" />
            Alarm
          </Button>

          <Button
            type="button"
            onClick={() => setHasReminder(!hasReminder)}
            variant={hasReminder ? "default" : "outline"}
            className={`rounded-full text-sm h-9 ${
              hasReminder ? "bg-primary/90" : "bg-background/30 border-white/10"
            }`}
          >
            <CalendarClock size={16} className="mr-1" />
            Reminder
          </Button>

          <Button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            variant={isLocked ? "default" : "outline"}
            className={`rounded-full text-sm h-9 ${
              isLocked ? "bg-primary/90" : "bg-background/30 border-white/10"
            }`}
          >
            {isLocked ? (
              <>
                <Lock size={16} className="mr-1" /> Locked
              </>
            ) : (
              <>
                <Unlock size={16} className="mr-1" /> Unlocked
              </>
            )}
          </Button>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-white/10 hover:bg-white/10"
          >
            Cancel
          </Button>

          <Button type="submit" className="bg-primary hover:bg-primary/80">
            {isEditMode ? "Save Changes" : "Add Event"}
          </Button>
        </div>

        {/* AI assistant button - show for both add and edit modes */}
        {onUseAI && (
          <Button
            type="button"
            variant="outline"
            onClick={onUseAI}
            className="w-full mt-2 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Sparkles size={16} className="mr-2" />
            Use Mally AI Assistant
          </Button>
        )}
      </form>
    </div>
  );
};

export default EnhancedEventForm;
