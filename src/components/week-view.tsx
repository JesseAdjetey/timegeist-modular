
import React, { useEffect, useState } from "react";
import { getWeekDays } from "@/lib/getTime";
import { useDateStore, useEventStore } from "@/lib/store";
import dayjs from "dayjs";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddEventButton from "@/components/calendar/AddEventButton";
import EventForm from "@/components/calendar/EventForm";
import EventDetails from "@/components/calendar/EventDetails";
import WeekHeader from "./calendar/week-view/WeekHeader";
import TimeColumn from "./calendar/week-view/TimeColumn";
import DayColumn from "./calendar/week-view/DayColumn";
import {
  handleDragOver,
  handleDrop as libHandleDrop,
} from "./calendar/week-view/DragDropHandlers";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { CalendarEventType } from "@/lib/stores/types";
import { toast } from "sonner";
import { useTodos } from "@/hooks/use-todos";
import TodoCalendarDialog from "@/components/calendar/integration/TodoCalendarDialog";
import { useTodoCalendarIntegration } from "@/hooks/use-todo-calendar-integration";

const WeekView = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate } = useDateStore();
  const {
    openEventSummary,
    toggleEventLock,
    isEventSummaryOpen,
    closeEventSummary,
  } = useEventStore();
  const { events, updateEvent, addEvent } = useCalendarEvents();
  const { linkTodoToEvent, deleteTodo } = useTodos();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<
    { date: Date; startTime: string } | undefined
  >();
  const [todoData, setTodoData] = useState<any>(null);
  // Add this new state for pending time selection
  const [pendingTimeSelection, setPendingTimeSelection] = useState<{
    day: dayjs.Dayjs;
    hour: dayjs.Dayjs;
  } | null>(null);

  const {
    isTodoCalendarDialogOpen,
    currentTodoData,
    showTodoCalendarDialog,
    hideTodoCalendarDialog,
    handleCreateBoth,
    handleCreateCalendarOnly,
    handleCreateTodoFromEvent
  } = useTodoCalendarIntegration();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // New useEffect to handle time slot selection properly
  useEffect(() => {
    if (pendingTimeSelection) {
      const { day, hour } = pendingTimeSelection;

      // First update the selected time
      setSelectedTime({
        date: day.toDate(),
        startTime: hour.format("HH:00"),
      });

      // Then open the form in the next render cycle
      // This ensures selectedTime is updated before the form uses it
      setTimeout(() => {
        setFormOpen(true);
        // Clear the pending selection
        setPendingTimeSelection(null);
      }, 0);
    }
  }, [pendingTimeSelection]);

  const getEventsForDay = (day: dayjs.Dayjs) => {
    const dayStr = day.format("YYYY-MM-DD");
    return events.filter((event) => event.date === dayStr);
  };

  // Update to use the pending time selection approach
  const handleTimeSlotClick = (day: dayjs.Dayjs, hour: dayjs.Dayjs) => {
    setTodoData(null); // Reset todo data
    // Instead of immediately updating state and opening form,
    // set a pending time selection that will be processed by the useEffect
    setPendingTimeSelection({ day, hour });
  };

  const openEventForm = (todoData: any, date: Date, startTime: string) => {
    console.log(
      "Opening event form with todo data:",
      todoData,
      date,
      startTime
    );
    setTodoData(todoData);

    // Create a dayjs object from the date and hour for the pending selection
    const dayObj = dayjs(date);
    const hourObj = dayjs(date).hour(parseInt(startTime.split(":")[0]));

    setPendingTimeSelection({ day: dayObj, hour: hourObj });
  };

  const handleDrop = (e: React.DragEvent, day: dayjs.Dayjs, hour: dayjs.Dayjs) => {
    // Extract logic to parse todo data, calculate time, and show dialog
    try {
      const dataString = e.dataTransfer.getData('application/json');
      if (!dataString) {
        console.error("No data found in drag event");
        return;
      }
      
      const data = JSON.parse(dataString);
      
      // Handle todo item drag
      if (data.source === 'todo-module') {
        // Calculate precise drop time based on cursor position
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const hourHeight = rect.height;
        const minutesWithinHour = Math.floor((relativeY / hourHeight) * 60);
        
        // Snap to nearest 30-minute interval (0 or 30)
        const snappedMinutes = minutesWithinHour < 30 ? 0 : 30;
        
        // Get the base hour and add the snapped minutes
        const baseHour = hour.hour();
        const startTime = `${baseHour.toString().padStart(2, '0')}:${snappedMinutes.toString().padStart(2, '0')}`;
        
        // Show the integration dialog
        showTodoCalendarDialog(data, day.toDate(), startTime);
        return;
      }
      
      // For regular calendar events, use the event directly
      if (data.isLocked) return;
      
      // Call updateEvent directly instead of using libHandleDrop
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const hourHeight = rect.height;
      const minutesWithinHour = Math.floor((relativeY / hourHeight) * 60);
      
      const snappedMinutes = minutesWithinHour < 30 ? 0 : 30;
      const baseHour = hour.hour();
      
      const oldStartParts = data.timeStart?.split(':') || ['00', '00'];
      const oldEndParts = data.timeEnd?.split(':') || ['01', '00'];
      
      const oldStartMinutes = parseInt(oldStartParts[0]) * 60 + parseInt(oldStartParts[1] || '0');
      const oldEndMinutes = parseInt(oldEndParts[0]) * 60 + parseInt(oldEndParts[1] || '0');
      
      const durationMinutes = oldEndMinutes - oldStartMinutes;
      
      const newStartMinutes = baseHour * 60 + snappedMinutes;
      const newEndMinutes = newStartMinutes + durationMinutes;
      
      const newStartHours = Math.floor(newStartMinutes / 60) % 24;
      const newStartMins = newStartMinutes % 60;
      const newStartTime = `${newStartHours.toString().padStart(2, '0')}:${newStartMins.toString().padStart(2, '0')}`;
      
      const newEndHours = Math.floor(newEndMinutes / 60) % 24;
      const newEndMins = newEndMinutes % 60;
      const newEndTime = `${newEndHours.toString().padStart(2, '0')}:${newEndMins.toString().padStart(2, '0')}`;
      
      const descriptionParts = data.description?.split('|') || ['', ''];
      const descText = descriptionParts.length > 1 ? descriptionParts[1].trim() : '';
      
      const updatedEvent = {
        ...data,
        date: day.format('YYYY-MM-DD'),
        description: `${newStartTime} - ${newEndTime} | ${descText}`,
        startsAt: day.hour(newStartHours).minute(newStartMins).toISOString(),
        endsAt: day.hour(newEndHours).minute(newEndMins).toISOString()
      };
      
      // Update the event
      updateEvent(updatedEvent);
      
      toast.success(`Event moved to ${day.format("MMM D")} at ${newStartTime}`);
    } catch (error) {
      console.error("Error handling drop:", error);
      toast.error("Failed to process drop event");
    }
  };

  // The following handler functions are wrappers for the hook functions
  // to ensure proper typing and avoid TypeScript errors
  const handleUpdateEvent = async (event: CalendarEventType): Promise<void> => {
    await updateEvent(event);
  };

  const handleAddEvent = async (event: CalendarEventType): Promise<void> => {
    await addEvent(event);
  };

  const handleSaveEvent = async (event: CalendarEventType) => {
    try {
      if (event.isTodo && !event.todoId) {
        const newTodoId = await handleCreateTodoFromEvent(event);
        if (newTodoId) {
          event.todoId = newTodoId;
        }
      }
      
      const response = await addEvent(event);

      if (response.success) {
        setFormOpen(false);
        toast.success(`${event.title} has been added to your calendar.`);
      } else {
        toast.error(response.message
          ? String(response.message)
          : "Failed to add event");
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <>
      <div className="glass m-4 rounded-xl overflow-hidden">
        <WeekHeader userSelectedDate={userSelectedDate} />

        {/* Time Column & Corresponding Boxes of time per each date */}
        <ScrollArea className="h-[80vh]">
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] px-4 py-2">
            {/* Time Column */}
            <TimeColumn />

            {/* Week Days Corresponding Boxes */}
            {getWeekDays(userSelectedDate).map(({ currentDate }, index) => {
              const dayEvents = getEventsForDay(currentDate);

              return (
                <DayColumn
                  key={index}
                  currentDate={currentDate}
                  dayEvents={dayEvents}
                  currentTime={currentTime}
                  onTimeSlotClick={handleTimeSlotClick}
                  onDragOver={handleDragOver}
                  onDrop={(e, day, hour) => handleDrop(e, day, hour)}
                  openEventSummary={openEventSummary}
                  toggleEventLock={toggleEventLock}
                />
              );
            })}
          </div>
        </ScrollArea>
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
        onSave={handleSaveEvent}
        createTodoFromEvent={handleCreateTodoFromEvent}
      />

      <EventDetails open={isEventSummaryOpen} onClose={closeEventSummary} />

      {/* Todo Calendar Dialog for integration */}
      {currentTodoData && (
        <TodoCalendarDialog
          open={isTodoCalendarDialogOpen}
          onClose={hideTodoCalendarDialog}
          todoTitle={currentTodoData.text}
          onCreateBoth={handleCreateBoth}
          onCreateCalendarOnly={handleCreateCalendarOnly}
        />
      )}
    </>
  );
};

export default WeekView;
