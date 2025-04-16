import React, { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    if (pendingTimeSelection) {
      const { day, hour } = pendingTimeSelection;

      setSelectedTime({
        date: day.toDate(),
        startTime: hour.format("HH:00"),
      });

      setTimeout(() => {
        setFormOpen(true);
        setPendingTimeSelection(null);
      }, 0);
    }
  }, [pendingTimeSelection]);

  const getEventsForDay = (day: dayjs.Dayjs) => {
    const dayStr = day.format("YYYY-MM-DD");
    return events.filter((event) => event.date === dayStr);
  };

  const handleTimeSlotClick = (day: dayjs.Dayjs, hour: dayjs.Dayjs) => {
    setTodoData(null);
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

    const dayObj = dayjs(date);
    const hourObj = dayjs(date).hour(parseInt(startTime.split(":")[0]));

    setPendingTimeSelection({ day: dayObj, hour: hourObj });
  };

  const handleDrop = (e: React.DragEvent, day: dayjs.Dayjs, hour: dayjs.Dayjs) => {
    try {
      const dataString = e.dataTransfer.getData('application/json');
      if (!dataString) {
        console.error("No data found in drag event");
        return;
      }
      
      const data = JSON.parse(dataString);
      
      if (data.source === 'todo-module') {
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const hourHeight = rect.height;
        const minutesWithinHour = Math.floor((relativeY / hourHeight) * 60);
        
        const snappedMinutes = minutesWithinHour < 30 ? 0 : 30;
        
        const baseHour = hour.hour();
        const startTime = `${baseHour.toString().padStart(2, '0')}:${snappedMinutes.toString().padStart(2, '0')}`;
        
        showTodoCalendarDialog(data, day.toDate(), startTime);
        return;
      }
      
      libHandleDrop(e, day, hour, updateEvent);
    } catch (error) {
      console.error("Error handling drop:", error);
      toast.error("Failed to process drop event");
    }
  };

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
        toast.error(response.error
          ? String(response.error)
          : "Failed to add event");
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleCreateTodoFromEvent = async (event: CalendarEventType) => {
    if (!todoCalendarIntegration || !event) {
      console.error("Todo-Calendar integration not available");
      return null;
    }
    
    return await todoCalendarIntegration.handleCreateTodoFromEvent(event);
  };

  return (
    <>
      <div className="glass m-4 rounded-xl overflow-hidden">
        <WeekHeader userSelectedDate={userSelectedDate} />

        <ScrollArea className="h-[80vh]">
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] px-4 py-2">
            <TimeColumn />
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
      />

      <EventDetails open={isEventSummaryOpen} onClose={closeEventSummary} />

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
