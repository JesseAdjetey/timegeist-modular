import React, { useState, useEffect } from 'react';
import { useEisenhower } from '@/hooks/use-eisenhower';
import ModuleContainer from '@/components/modules/ModuleContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAuth } from '@/contexts/AuthContext';

interface EisenhowerModuleProps {
  title: string;
  instanceId: string; // Add instanceId as a required prop
  onRemove?: () => void;
  onTitleChange?: (newTitle: string) => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const EisenhowerModule: React.FC<EisenhowerModuleProps> = ({ 
  title, 
  instanceId, 
  onRemove, 
  onTitleChange,
  onMinimize,
  isMinimized 
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useLocalStorage<string>(`eisenhower-active-tab-${instanceId}`, 'urgent_important');
  const [newItemText, setNewItemText] = useState('');
  const { items, loading, addItem, removeItem, updateQuadrant } = useEisenhower({ instanceId });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
      await addItem(newItemText, activeTab as any);
      setNewItemText('');
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('itemId', itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, quadrant: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    if (itemId) {
      updateQuadrant(itemId, quadrant as any);
    }
  };

  useEffect(() => {
    // We can conditionally execute user-specific logic here
    if (user) {
      console.log(`EisenhowerModule with instanceId ${instanceId} mounted for user ${user.id}`);
    }
  }, [user, instanceId]);

  // Filter items by quadrant
  const urgentImportant = items.filter(item => item.quadrant === 'urgent_important');
  const notUrgentImportant = items.filter(item => item.quadrant === 'not_urgent_important');
  const urgentNotImportant = items.filter(item => item.quadrant === 'urgent_not_important');
  const notUrgentNotImportant = items.filter(item => item.quadrant === 'not_urgent_not_important');

  return (
    <ModuleContainer 
      title={title} 
      instanceId={instanceId}
      onRemove={onRemove} 
      onTitleChange={onTitleChange}
      onMinimize={onMinimize}
      isMinimized={isMinimized}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="urgent_important">Urgent & Important</TabsTrigger>
          <TabsTrigger value="not_urgent_important">Not Urgent & Important</TabsTrigger>
          <TabsTrigger value="urgent_not_important">Urgent & Not Important</TabsTrigger>
          <TabsTrigger value="not_urgent_not_important">Not Urgent & Not Important</TabsTrigger>
        </TabsList>

        <form onSubmit={handleAddItem} className="mb-4 flex gap-2">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add new item"
            className="flex-1"
          />
          <Button type="submit" disabled={!newItemText.trim()}>Add</Button>
        </form>

        <TabsContent 
          value="urgent_important" 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'urgent_important')}
        >
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading...</p>
          ) : urgentImportant.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No items in this quadrant</p>
          ) : (
            <ul className="space-y-2">
              {urgentImportant.map(item => (
                <li 
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  className="flex justify-between items-center p-2 bg-white/5 rounded-md"
                >
                  <span>{item.text}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent
          value="not_urgent_important"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'not_urgent_important')}
        >
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading...</p>
          ) : notUrgentImportant.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No items in this quadrant</p>
          ) : (
            <ul className="space-y-2">
              {notUrgentImportant.map(item => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  className="flex justify-between items-center p-2 bg-white/5 rounded-md"
                >
                  <span>{item.text}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent
          value="urgent_not_important"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'urgent_not_important')}
        >
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading...</p>
          ) : urgentNotImportant.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No items in this quadrant</p>
          ) : (
            <ul className="space-y-2">
              {urgentNotImportant.map(item => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  className="flex justify-between items-center p-2 bg-white/5 rounded-md"
                >
                  <span>{item.text}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent
          value="not_urgent_not_important"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'not_urgent_not_important')}
        >
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading...</p>
          ) : notUrgentNotImportant.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No items in this quadrant</p>
          ) : (
            <ul className="space-y-2">
              {notUrgentNotImportant.map(item => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  className="flex justify-between items-center p-2 bg-white/5 rounded-md"
                >
                  <span>{item.text}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </ModuleContainer>
  );
};

export default EisenhowerModule;
