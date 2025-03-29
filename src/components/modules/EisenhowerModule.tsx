
import React, { useState } from 'react';
import ModuleContainer from './ModuleContainer';
import { cn } from '@/lib/utils';

interface EisenhowerItem {
  id: string;
  text: string;
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';
}

interface EisenhowerModuleProps {
  onRemove?: () => void;
  initialItems?: EisenhowerItem[];
}

const EisenhowerModule: React.FC<EisenhowerModuleProps> = ({ onRemove, initialItems = [] }) => {
  const [items, setItems] = useState<EisenhowerItem[]>(initialItems);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, quadrant: EisenhowerItem['quadrant']) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      const draggedItem = JSON.parse(data);
      
      // If it already exists as an Eisenhower item, just update its quadrant
      const existingItemIndex = items.findIndex(item => item.id === draggedItem.id);
      
      if (existingItemIndex >= 0) {
        // Update quadrant of existing item
        const updatedItems = [...items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quadrant
        };
        setItems(updatedItems);
      } else {
        // Add new item from another module
        const newItem: EisenhowerItem = {
          id: draggedItem.id || Date.now().toString(),
          text: draggedItem.text || draggedItem.title || 'Untitled Task',
          quadrant
        };
        setItems([...items, newItem]);
      }
    } catch (error) {
      console.error('Error processing dragged item:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const getQuadrantItems = (quadrant: EisenhowerItem['quadrant']) => {
    return items.filter(item => item.quadrant === quadrant);
  };

  return (
    <ModuleContainer title="Eisenhower Matrix" onRemove={onRemove}>
      <div className="grid grid-cols-2 grid-rows-2 gap-2 h-64">
        {/* Urgent & Important */}
        <div 
          className="bg-red-500/20 rounded-lg p-2 overflow-y-auto"
          onDrop={(e) => handleDrop(e, 'urgent-important')}
          onDragOver={handleDragOver}
        >
          <div className="text-xs font-medium mb-1 text-red-400">Urgent & Important</div>
          {getQuadrantItems('urgent-important').map(item => (
            <div key={item.id} className="bg-white/10 text-xs p-1 rounded mb-1 flex justify-between">
              <span>{item.text}</span>
              <button onClick={() => removeItem(item.id)} className="opacity-50 hover:opacity-100">×</button>
            </div>
          ))}
        </div>
        
        {/* Not Urgent & Important */}
        <div 
          className="bg-yellow-500/20 rounded-lg p-2 overflow-y-auto"
          onDrop={(e) => handleDrop(e, 'not-urgent-important')}
          onDragOver={handleDragOver}
        >
          <div className="text-xs font-medium mb-1 text-yellow-400">Not Urgent & Important</div>
          {getQuadrantItems('not-urgent-important').map(item => (
            <div key={item.id} className="bg-white/10 text-xs p-1 rounded mb-1 flex justify-between">
              <span>{item.text}</span>
              <button onClick={() => removeItem(item.id)} className="opacity-50 hover:opacity-100">×</button>
            </div>
          ))}
        </div>
        
        {/* Urgent & Not Important */}
        <div 
          className="bg-blue-500/20 rounded-lg p-2 overflow-y-auto"
          onDrop={(e) => handleDrop(e, 'urgent-not-important')}
          onDragOver={handleDragOver}
        >
          <div className="text-xs font-medium mb-1 text-blue-400">Urgent & Not Important</div>
          {getQuadrantItems('urgent-not-important').map(item => (
            <div key={item.id} className="bg-white/10 text-xs p-1 rounded mb-1 flex justify-between">
              <span>{item.text}</span>
              <button onClick={() => removeItem(item.id)} className="opacity-50 hover:opacity-100">×</button>
            </div>
          ))}
        </div>
        
        {/* Not Urgent & Not Important */}
        <div 
          className="bg-green-500/20 rounded-lg p-2 overflow-y-auto"
          onDrop={(e) => handleDrop(e, 'not-urgent-not-important')}
          onDragOver={handleDragOver}
        >
          <div className="text-xs font-medium mb-1 text-green-400">Not Urgent & Not Important</div>
          {getQuadrantItems('not-urgent-not-important').map(item => (
            <div key={item.id} className="bg-white/10 text-xs p-1 rounded mb-1 flex justify-between">
              <span>{item.text}</span>
              <button onClick={() => removeItem(item.id)} className="opacity-50 hover:opacity-100">×</button>
            </div>
          ))}
        </div>
      </div>
    </ModuleContainer>
  );
};

export default EisenhowerModule;
