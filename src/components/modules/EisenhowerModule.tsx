
import React, { useState } from 'react';
import ModuleContainer from './ModuleContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ArrowLeft } from 'lucide-react';
import { nanoid } from 'nanoid';

interface EisenhowerItem {
  id: string;
  text: string;
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';
}

type QuadrantType = EisenhowerItem['quadrant'] | null;

interface QuadrantConfig {
  title: string;
  className: string;
  description: string;
}

interface EisenhowerModuleProps {
  title?: string;
  onRemove?: () => void;
  onTitleChange?: (title: string) => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  initialItems?: EisenhowerItem[];
}

const EisenhowerModule: React.FC<EisenhowerModuleProps> = ({ 
  title = "Eisenhower Matrix",
  onRemove, 
  onTitleChange,
  onMinimize,
  isMinimized,
  initialItems = [] 
}) => {
  const [items, setItems] = useState<EisenhowerItem[]>(initialItems);
  const [focusedQuadrant, setFocusedQuadrant] = useState<QuadrantType>(null);
  const [newItemText, setNewItemText] = useState('');

  const quadrantConfig: Record<EisenhowerItem['quadrant'], QuadrantConfig> = {
    'urgent-important': {
      title: 'Urgent & Important',
      className: 'bg-red-500/20',
      description: 'Do these tasks immediately'
    },
    'not-urgent-important': {
      title: 'Not Urgent & Important',
      className: 'bg-yellow-500/20',
      description: 'Schedule time to do these tasks'
    },
    'urgent-not-important': {
      title: 'Urgent & Not Important',
      className: 'bg-blue-500/20',
      description: 'Delegate these tasks if possible'
    },
    'not-urgent-not-important': {
      title: 'Not Urgent & Not Important',
      className: 'bg-green-500/20',
      description: 'Eliminate these tasks if possible'
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, quadrant: EisenhowerItem['quadrant']) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      const draggedItem = JSON.parse(data);
      
      const existingItemIndex = items.findIndex(item => item.id === draggedItem.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quadrant
        };
        setItems(updatedItems);
      } else {
        const newItem: EisenhowerItem = {
          id: draggedItem.id || nanoid(),
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

  const addNewItem = (quadrant: EisenhowerItem['quadrant']) => {
    if (newItemText.trim()) {
      const newItem: EisenhowerItem = {
        id: nanoid(),
        text: newItemText.trim(),
        quadrant
      };
      setItems([...items, newItem]);
      setNewItemText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, quadrant: EisenhowerItem['quadrant']) => {
    if (e.key === 'Enter') {
      addNewItem(quadrant);
    }
  };

  const renderFocusedQuadrant = () => {
    if (!focusedQuadrant) return null;
    
    const config = quadrantConfig[focusedQuadrant];
    const quadrantItems = getQuadrantItems(focusedQuadrant);
    const textColorClass = focusedQuadrant === 'urgent-important' ? 'text-red-400' : 
                          focusedQuadrant === 'not-urgent-important' ? 'text-yellow-400' : 
                          focusedQuadrant === 'urgent-not-important' ? 'text-blue-400' : 
                          'text-green-400';
    
    return (
      <div className={`rounded-lg p-3 h-64 ${config.className}`}>
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-6 w-6 mr-2" 
            onClick={() => setFocusedQuadrant(null)}
          >
            <ArrowLeft size={16} />
          </Button>
          <h3 className={`text-sm font-medium ${textColorClass}`}>{config.title}</h3>
        </div>
        
        <p className="text-xs mb-3 opacity-70">{config.description}</p>
        
        <div className="flex gap-2 mb-3">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, focusedQuadrant)}
            placeholder="Add new item..."
            className="h-8 text-xs bg-white/10 border-white/10"
          />
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 px-2 bg-white/10 border-white/10"
            onClick={() => addNewItem(focusedQuadrant)}
          >
            <Plus size={14} />
          </Button>
        </div>
        
        <div className="overflow-y-auto max-h-[150px]">
          {quadrantItems.map(item => (
            <div key={item.id} className="bg-white/10 text-xs p-2 rounded mb-1 flex justify-between">
              <span>{item.text}</span>
              <button onClick={() => removeItem(item.id)} className="opacity-50 hover:opacity-100">×</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMatrix = () => {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-2 h-64">
        {Object.entries(quadrantConfig).map(([quadrant, config]) => {
          const quadrantType = quadrant as EisenhowerItem['quadrant'];
          const quadrantItems = getQuadrantItems(quadrantType);
          
          return (
            <div 
              key={quadrant}
              className={`${config.className} rounded-lg p-2 overflow-y-auto relative`}
              onDrop={(e) => handleDrop(e, quadrantType)}
              onDragOver={handleDragOver}
              onClick={() => setFocusedQuadrant(quadrantType)}
            >
              <div className={`text-xs font-medium mb-1 ${
                quadrantType === 'urgent-important' ? 'text-red-400' : 
                quadrantType === 'not-urgent-important' ? 'text-yellow-400' : 
                quadrantType === 'urgent-not-important' ? 'text-blue-400' : 
                'text-green-400'
              }`}>
                {config.title}
              </div>
              
              {quadrantItems.length === 0 ? (
                <div className="text-xs opacity-50 text-center pt-2">Click to add items</div>
              ) : (
                quadrantItems.slice(0, 3).map(item => (
                  <div key={item.id} className="bg-white/10 text-xs p-1 rounded mb-1 flex justify-between">
                    <span>{item.text}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }} 
                      className="opacity-50 hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
              
              {quadrantItems.length > 3 && (
                <div className="text-xs opacity-70 text-center">+{quadrantItems.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ModuleContainer 
      title={title} 
      onRemove={onRemove}
      onTitleChange={onTitleChange}
      onMinimize={onMinimize}
      isMinimized={isMinimized}
    >
      {focusedQuadrant ? renderFocusedQuadrant() : renderMatrix()}
    </ModuleContainer>
  );
};

export default EisenhowerModule;
