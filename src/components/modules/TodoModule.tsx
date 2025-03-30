
import React, { useState } from 'react';
import ModuleContainer from './ModuleContainer';
import { cn } from '@/lib/utils';
import { Calendar, Circle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useEventStore } from '@/lib/store';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  isCalendarEvent: boolean;
  eventId?: string; // Reference to the calendar event if it exists
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
  const { addEvent } = useEventStore();

  const addItem = () => {
    if (newItem.trim()) {
      const newTodoItem: TodoItem = {
        id: Date.now().toString(),
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
      isTodo: true,
      source: 'todo-module'
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(todoData));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Add visual feedback for dragging
    const dragIcon = document.createElement('div');
    dragIcon.className = 'invisible';
    document.body.appendChild(dragIcon);
    e.dataTransfer.setDragImage(dragIcon, 0, 0);
    
    setTimeout(() => {
      document.body.removeChild(dragIcon);
    }, 0);
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
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
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
