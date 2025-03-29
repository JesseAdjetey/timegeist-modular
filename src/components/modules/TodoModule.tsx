
import React, { useState } from 'react';
import ModuleContainer from './ModuleContainer';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  isCalendarEvent: boolean;
}

interface TodoModuleProps {
  title: string;
  onRemove?: () => void;
  initialItems?: TodoItem[];
  onDragStart?: (item: TodoItem) => void;
}

const TodoModule: React.FC<TodoModuleProps> = ({ 
  title, 
  onRemove, 
  initialItems = [],
  onDragStart
}) => {
  const [items, setItems] = useState<TodoItem[]>(initialItems);
  const [newItem, setNewItem] = useState("");

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
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) onDragStart(item);
  };

  return (
    <ModuleContainer title={title} onRemove={onRemove}>
      <div className="max-h-60 overflow-y-auto mb-3">
        {items.map(item => (
          <div 
            key={item.id}
            className="flex items-center gap-2 bg-white/5 p-2 rounded-lg mb-2 group"
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleCompleted(item.id)}
              className="cursor-pointer"
            />
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
