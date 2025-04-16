
import React, { useState, useEffect } from 'react';
import { CalendarEventType } from '@/lib/stores/types';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useTodoCalendarIntegration } from '@/hooks/use-todo-calendar-integration';

interface EnhancedEventFormProps {
  event?: CalendarEventType | null;
  initialEvent?: CalendarEventType | null;
  onUpdateEvent?: (event: CalendarEventType) => void;
  onSave?: (event: CalendarEventType) => void;
  onClose?: () => void;
  onCancel?: () => void;
  onUseAI?: () => void;
}

const EnhancedEventForm: React.FC<EnhancedEventFormProps> = ({ 
  event, 
  initialEvent,
  onUpdateEvent,
  onSave,
  onClose,
  onCancel,
  onUseAI
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isTodo, setIsTodo] = useState(false);
  const { handleCreateTodoFromEvent } = useTodoCalendarIntegration();
  
  // Use either the event or initialEvent prop, whichever is provided
  const eventData = event || initialEvent;

  useEffect(() => {
    if (eventData) {
      setTitle(eventData.title);
      setDescription(eventData.description);
      setIsLocked(eventData.isLocked || false);
      setIsTodo(eventData.isTodo || false);
    }
  }, [eventData]);

  const handleSubmit = () => {
    if (!eventData) return;

    const updatedEvent: CalendarEventType = {
      ...eventData,
      title: title,
      description: description,
      isLocked: isLocked,
      isTodo: isTodo
    };

    if (onUpdateEvent) {
      onUpdateEvent(updatedEvent);
    } else if (onSave) {
      onSave(updatedEvent);
    }
    
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  const handleCreateTodo = async () => {
    if (!eventData) return;
    
    try {
      // Create a properly formed event object to pass to the handler
      const todoId = await handleCreateTodoFromEvent(eventData);
      
      if (todoId) {
        toast.success("Todo created from event");
        
        // Update the event to link it with the todo
        const updatedEvent = {
          ...eventData,
          todoId,
          isTodo: true
        };
        
        if (onUpdateEvent) {
          onUpdateEvent(updatedEvent);
        } else if (onSave) {
          onSave(updatedEvent);
        }
      }
    } catch (error) {
      console.error("Error creating todo from event:", error);
      toast.error("Failed to create todo from event");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Edit Event</h2>

      <div className="mb-4">
        <Label htmlFor="title">Title</Label>
        <Input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="description">Description</Label>
        <Input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="isLocked"
          checked={isLocked}
          onCheckedChange={(checked) => setIsLocked(checked === true)}
        />
        <Label htmlFor="isLocked">Is Locked</Label>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="isTodo"
          checked={isTodo}
          onCheckedChange={(checked) => setIsTodo(checked === true)}
        />
        <Label htmlFor="isTodo">Is Todo</Label>
      </div>

      <div className="flex justify-between">
        {onCancel || onClose ? (
          <Button variant="ghost" onClick={onCancel || onClose}>
            Cancel
          </Button>
        ) : null}
        <div>
          <Button 
            variant="secondary" 
            onClick={handleCreateTodo} 
            type="button"
          >
            Create Todo
          </Button>
          <Button className="ml-2" onClick={handleSubmit}>
            {onUpdateEvent ? "Update Event" : "Save Event"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEventForm;
