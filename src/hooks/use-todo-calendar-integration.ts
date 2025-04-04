
import { useState } from 'react';
import { CalendarEventType } from '@/lib/stores/types';
import { TodoDragData, createCalendarEventFromTodo, createTodoFromCalendarEvent, syncEventTitleWithTodo } from '@/lib/dragdropHandlers';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useTodos } from '@/hooks/use-todos';
import { toast } from 'sonner';

export function useTodoCalendarIntegration() {
  const [isTodoCalendarDialogOpen, setIsTodoCalendarDialogOpen] = useState(false);
  const [currentTodoData, setCurrentTodoData] = useState<TodoDragData | null>(null);
  const [currentDateTimeData, setCurrentDateTimeData] = useState<{ date: Date, startTime: string } | null>(null);
  
  const { addEvent, updateEvent } = useCalendarEvents();
  const { addTodo, linkTodoToEvent, deleteTodo, updateTodoTitle } = useTodos();
  
  // Show the integration dialog
  const showTodoCalendarDialog = (todoData: TodoDragData, date: Date, startTime: string) => {
    console.log("Showing todo calendar dialog with:", todoData, date, startTime);
    setCurrentTodoData(todoData);
    setCurrentDateTimeData({ date, startTime });
    setIsTodoCalendarDialogOpen(true);
  };
  
  // Hide the integration dialog
  const hideTodoCalendarDialog = () => {
    setIsTodoCalendarDialogOpen(false);
  };
  
  // Create both calendar event and keep todo
  const handleCreateBoth = async () => {
    if (!currentTodoData || !currentDateTimeData) return;
    
    await createCalendarEventFromTodo(
      currentTodoData,
      currentDateTimeData.date,
      currentDateTimeData.startTime,
      true, // keep todo
      {
        addEventFn: addEvent,
        updateEventFn: updateEvent,
        linkTodoToEventFn: linkTodoToEvent,
        deleteTodoFn: deleteTodo,
        onShowTodoCalendarDialog: showTodoCalendarDialog
      }
    );
    
    hideTodoCalendarDialog();
  };
  
  // Create calendar event only (delete todo)
  const handleCreateCalendarOnly = async () => {
    if (!currentTodoData || !currentDateTimeData) return;
    
    await createCalendarEventFromTodo(
      currentTodoData,
      currentDateTimeData.date,
      currentDateTimeData.startTime,
      false, // don't keep todo
      {
        addEventFn: addEvent,
        updateEventFn: updateEvent,
        linkTodoToEventFn: linkTodoToEvent,
        deleteTodoFn: deleteTodo,
        onShowTodoCalendarDialog: showTodoCalendarDialog
      }
    );
    
    hideTodoCalendarDialog();
  };
  
  // Create todo from calendar event
  const handleCreateTodoFromEvent = async (event: CalendarEventType): Promise<string | null> => {
    return await createTodoFromCalendarEvent(
      event,
      linkTodoToEvent,
      addTodo
    );
  };
  
  // Sync event title with todo title
  const syncTitles = async (eventId: string, todoId: string, newTitle: string): Promise<boolean> => {
    try {
      if (!updateTodoTitle) {
        console.error("updateTodoTitle function is not available");
        return false;
      }
      
      const result = await updateTodoTitle(todoId, newTitle);
      return result.success;
    } catch (error) {
      console.error("Error syncing titles:", error);
      return false;
    }
  };
  
  return {
    isTodoCalendarDialogOpen,
    showTodoCalendarDialog,
    hideTodoCalendarDialog,
    currentTodoData,
    handleCreateBoth,
    handleCreateCalendarOnly,
    handleCreateTodoFromEvent,
    syncTitles
  };
}
