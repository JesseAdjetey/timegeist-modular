
import React, { useState, useEffect } from 'react';
import ModuleContainer from './ModuleContainer';
import { cn } from '@/lib/utils';
import { Calendar, Circle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEventStore } from '@/lib/store';
import { useTodos, TodoItem } from '@/hooks/use-todos';
import { useAuth } from '@/contexts/AuthContext';

interface TodoModuleProps {
  title: string;
  onRemove?: () => void;
  onTitleChange?: (title: string) => void;
  initialItems?: TodoItem[];
  isMinimized?: boolean;
  onMinimize?: () => void;
  isDragging?: boolean;
}

const TodoModule: React.FC<TodoModuleProps> = ({ 
  title, 
  onRemove, 
  onTitleChange,
  isMinimized,
  onMinimize,
  isDragging
}) => {
  const [newItem, setNewItem] = useState("");
  const { addEvent, events } = useEventStore();
  const { todos, loading, error, addTodo, toggleTodo, linkTodoToEvent } = useTodos();
  const { user } = useAuth();

  // Find todo items that are already calendar events
  useEffect(() => {
    // Check for todo items that have been added to the calendar
    const todoEvents = events.filter(event => event.todoId);
    
    if (todoEvents.length > 0 && todos.length > 0) {
      todoEvents.forEach(event => {
        if (event.todoId) {
          const matchingTodo = todos.find(todo => todo.id === event.todoId && !todo.isCalendarEvent);
          if (matchingTodo) {
            linkTodoToEvent(matchingTodo.id, event.id);
          }
        }
      });
    }
  }, [events, todos]);

  const handleAddItem = async () => {
    if (newItem.trim()) {
      await addTodo(newItem.trim());
      setNewItem("");
    }
  };

  const handleToggleCompleted = async (id: string, completed: boolean) => {
    await toggleTodo(id, !completed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  const handleDragStart = (e: React.DragEvent, item: TodoItem) => {
    // Set data transfer with todo item data
    const todoData = {
      id: item.id,
      text: item.title,
      source: 'todo-module'
    };
    
    console.log("Starting drag with data:", todoData);
    
    // Set the drag data as JSON string
    e.dataTransfer.setData('application/json', JSON.stringify(todoData));
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback for dragging
    if (e.currentTarget) {
      e.currentTarget.classList.add('opacity-50');
    }
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    // Remove visual feedback
    if (e.currentTarget) {
      e.currentTarget.classList.remove('opacity-50');
    }
  };

  if (isMinimized) {
    return (
      <ModuleContainer 
        title={title} 
        onRemove={onRemove}
        onTitleChange={onTitleChange}
        isMinimized={isMinimized}
        onMinimize={onMinimize}
      >
        <div className="text-center text-sm text-muted-foreground py-2">
          {loading ? 'Loading...' : `${todos.length} todo items`}
        </div>
      </ModuleContainer>
    );
  }

  if (!user) {
    return (
      <ModuleContainer 
        title={title} 
        onRemove={onRemove}
        onTitleChange={onTitleChange}
        isMinimized={isMinimized}
        onMinimize={onMinimize}
      >
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          Sign in to use todos
        </div>
      </ModuleContainer>
    );
  }

  return (
    <ModuleContainer 
      title={title} 
      onRemove={onRemove}
      onTitleChange={onTitleChange}
      isMinimized={isMinimized}
      onMinimize={onMinimize}
    >
      <div className="max-h-60 overflow-y-auto mb-3">
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-sm">Loading todos...</span>
          </div>
        ) : error ? (
          <div className="text-center text-sm text-red-400 p-2">{error}</div>
        ) : todos.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground p-2">No todos yet</div>
        ) : (
          todos.map(item => (
            <div 
              key={item.id}
              className="flex items-center gap-2 bg-white/5 p-2 rounded-lg mb-2 group cursor-pointer"
              draggable={true}
              onDragStart={(e) => handleDragStart(e, item)}
              onDragEnd={handleDragEnd}
            >
              <div 
                className="cursor-pointer flex-shrink-0" 
                onClick={() => handleToggleCompleted(item.id, item.completed)}
              >
                {item.completed ? (
                  <CheckCircle size={18} className="text-primary" />
                ) : (
                  <Circle size={18} className="text-primary/60" />
                )}
              </div>
              <span className={cn("text-sm flex-1", { 
                "line-through opacity-50": item.completed 
              })}>
                {item.title}
              </span>
              {item.isCalendarEvent && (
                <span className="text-primary text-xs opacity-70">
                  <Calendar size={14} />
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          className="glass-input w-full"
          placeholder="Add a task..."
        />
        <button
          onClick={handleAddItem}
          className="bg-primary px-3 py-1 rounded-md hover:bg-primary/80 transition-colors"
        >
          Add
        </button>
      </div>
    </ModuleContainer>
  );
};

export default TodoModule;
