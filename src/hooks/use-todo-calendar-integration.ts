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
    if (!currentTodoData) return;
    
    // Handle different sources differently
    if (currentTodoData.source === 'todo-module') {
      // Todo to Calendar: Create calendar event from todo
      if (currentDateTimeData) {
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
      }
    } else if (currentTodoData.source === 'calendar-module') {
      // Calendar to Todo: Create todo from calendar event
      if (currentTodoData.eventId) {
        // Find the event by id
        const eventResponse = await useCalendarEvents().getEventById(currentTodoData.eventId);
        
        if (eventResponse && eventResponse.success && eventResponse.event) {
          // Create a new todo from the event
          const todoId = await createTodoFromCalendarEvent(
            eventResponse.event,
            linkTodoToEvent,
            addTodo
          );
          
          if (todoId) {
            toast.success(`"${currentTodoData.text}" added to your todo list`);
          } else {
            toast.error("Failed to create todo from event");
          }
        } else {
          toast.error("Could not find the calendar event");
        }
      }
    }
    
    hideTodoCalendarDialog();
  };
  
  // Create calendar event only (delete todo)
  const handleCreateCalendarOnly = async () => {
    if (!currentTodoData) return;
    
    if (currentTodoData.source === 'todo-module' && currentDateTimeData) {
      // Todo to Calendar: Create calendar event from todo and delete todo
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
    } else if (currentTodoData.source === 'calendar-module') {
      // Calendar to Todo: No action needed, just close dialog
      toast.info("No changes made to your calendar event");
    }
    
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
