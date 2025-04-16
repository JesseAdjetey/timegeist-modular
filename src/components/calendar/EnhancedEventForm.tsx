import React, { useState, useEffect } from 'react';
import { CalendarEventType } from '@/lib/stores/types';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner';
import { useTodoCalendarIntegration } from '@/hooks/use-todo-calendar-integration';

interface EnhancedEventFormProps {
  event: CalendarEventType | null;
  onUpdateEvent: (event: CalendarEventType) => void;
  onClose: () => void;
}

const EnhancedEventForm = ({ 
  event, 
  onUpdateEvent, 
  onClose 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isTodo, setIsTodo] = useState(false);
  const { handleCreateTodoFromEvent } = useTodoCalendarIntegration();

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setIsLocked(event.isLocked || false);
      setIsTodo(event.isTodo || false);
    }
  }, [event]);

  const handleSubmit = () => {
    if (!event) return;

    const updatedEvent = {
      ...event,
      title: title,
      description: description,
      isLocked: isLocked,
      isTodo: isTodo
    };

    onUpdateEvent(updatedEvent);
    onClose();
  };

  const handleCreateTodoFromEvent = async () => {
    if (!event) return;
    
    try {
      // Fix: Pass an empty object as the argument since the function expects a parameter
      const todoId = await handleCreateTodoFromEvent({});
      
      if (todoId) {
        toast.success("Todo created from event");
        // Update the event to link it with the todo
        const updatedEvent = {
          ...event,
          todoId,
          isTodo: true
        };
        onUpdateEvent(updatedEvent);
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
          onCheckedChange={(checked) => setIsLocked(checked || false)}
        />
        <Label htmlFor="isLocked">Is Locked</Label>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="isTodo"
          checked={isTodo}
          onCheckedChange={(checked) => setIsTodo(checked || false)}
        />
        <Label htmlFor="isTodo">Is Todo</Label>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <div>
          <Button variant="secondary" onClick={handleCreateTodoFromEvent}>
            Create Todo
          </Button>
          <Button className="ml-2" onClick={handleSubmit}>
            Update Event
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEventForm;
