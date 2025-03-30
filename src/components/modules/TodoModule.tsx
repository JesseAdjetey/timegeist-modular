
import React, { useState, useEffect } from 'react';
import ModuleContainer from './ModuleContainer';
import { cn } from '@/lib/utils';
import { Calendar, Circle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useEventStore } from '@/lib/store';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import { CalendarEventType } from '@/lib/stores/types';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  isCalendarEvent: boolean;
  eventId?: string;
}

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
  initialItems = [],
  isMinimized,
  onMinimize,
  isDragging
}) => {
  const [items, setItems] = useState<TodoItem[]>(initialItems);
  const [newItem, setNewItem] = useState("");
  const { addEvent, events } = useEventStore();

  // Find todo items that are already calendar events
  useEffect(() => {
    // Check for todo items that have been added to the calendar
    const todoEvents = events.filter(event => event.todoId);
    
    if (todoEvents.length > 0) {
      setItems(prevItems => 
        prevItems.map(item => {
          const matchingEvent = todoEvents.find(event => event.todoId === item.id);
          if (matchingEvent && !item.isCalendarEvent) {
            return {
              ...item,
              isCalendarEvent: true,
              eventId: matchingEvent.id
            };
          }
          return item;
        })
      );
    }
  }, [events]);

  const addItem = () => {
    if (newItem.trim()) {
      const newTodoItem: TodoItem = {
        id: nanoid(),
        text: newItem.trim(),
        completed: false,
        isCalendarEvent: false
      };
      setItems([...items, newTodoItem]);
      setNewItem("");
    }
  };

  const toggleCompleted = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addItem();
    }
  };

  const handleDragStart = (e: React.DragEvent, item: TodoItem) => {
    // Set data transfer with todo item data
    const todoData = {
      id: item.id,
      text: item.text,
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
  
  // Mark a todo item as a calendar event
  const setAsCalendarEvent = (todoId: string, eventId: string) => {
    setItems(items.map(item => 
      item.id === todoId ? { ...item, isCalendarEvent: true, eventId } : item
    ));
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
          {items.length} todo items
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
        {items.map(item => (
          <div 
            key={item.id}
            className="flex items-center gap-2 bg-white/5 p-2 rounded-lg mb-2 group cursor-pointer"
            draggable={true}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
          >
            <div 
              className="cursor-pointer flex-shrink-0" 
              onClick={() => toggleCompleted(item.id)}
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
              {item.text}
            </span>
            {item.isCalendarEvent && (
              <span className="text-primary text-xs opacity-70">
                <Calendar size={14} />
              </span>
            )}
          </div>
        ))}
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
          onClick={addItem}
          className="bg-primary px-3 py-1 rounded-md hover:bg-primary/80 transition-colors"
        >
          Add
        </button>
      </div>
    </ModuleContainer>
  );
};

export default TodoModule;
