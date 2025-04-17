
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEventStore } from "@/lib/store";
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import EnhancedEventForm from './EnhancedEventForm';
import { CalendarEventType } from '@/lib/stores/types';
import { useTodos } from '@/hooks/use-todos';

interface EventDetailsProps {
  open: boolean;
  onClose: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ open, onClose }) => {
  const { selectedEvent } = useEventStore();
  const { updateEvent, removeEvent } = useCalendarEvents();
  const { handleCompleteTodo, deleteTodo } = useTodos();
  const [isEditing, setIsEditing] = useState(false);

  if (!selectedEvent) return null;

  // Extract time information from description (format: "HH:MM - HH:MM | Description")
  const descriptionParts = selectedEvent.description.split('|');
  const timeRange = descriptionParts[0].trim();
  const actualDescription = descriptionParts.length > 1 ? descriptionParts[1].trim() : '';

  const handleDelete = async () => {
    try {
      // If it's a todo event, also handle todo item
      if (selectedEvent.isTodo && selectedEvent.todoId) {
        // Only delete the calendar event, not the todo item
        console.log("Removing todo calendar event:", selectedEvent.id);
      }
      
      await removeEvent(selectedEvent.id);
      toast.success("Event deleted");
      onClose();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const handleComplete = async () => {
    try {
      if (!selectedEvent.todoId) {
        toast.error("No todo associated with this event");
        return;
      }
      
      await handleCompleteTodo(selectedEvent.todoId);
      toast.success("Todo marked as complete");
      
      // Update calendar event to reflect completion
      const updatedEvent = {
        ...selectedEvent,
        color: "bg-green-500/70", // Change color to indicate completion
      };
      
      await updateEvent(updatedEvent);
      onClose();
    } catch (error) {
      console.error("Error completing todo:", error);
      toast.error("Failed to complete todo");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleUpdate = async (updatedEvent: CalendarEventType) => {
    try {
      await updateEvent(updatedEvent);
      toast.success("Event updated");
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleUseAI = () => {
    toast.info("AI assistance coming soon!");
  };

  // Format date for display
  const formattedDate = selectedEvent.date 
    ? dayjs(selectedEvent.date).format('dddd, MMMM D, YYYY')
    : dayjs(selectedEvent.startsAt).format('dddd, MMMM D, YYYY');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 border-white/10">
        {isEditing ? (
          <EnhancedEventForm 
            event={selectedEvent}
            onUpdateEvent={handleUpdate}
            onCancel={handleCancel}
            onUseAI={handleUseAI}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="mb-4">
                <span className="text-sm font-medium text-muted-foreground">Date:</span>
                <p>{formattedDate}</p>
              </div>
              
              <div className="mb-4">
                <span className="text-sm font-medium text-muted-foreground">Time:</span>
                <p>{timeRange}</p>
              </div>
              
              {actualDescription && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Description:</span>
                  <p>{actualDescription}</p>
                </div>
              )}
              
              {selectedEvent.isTodo && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Todo:</span>
                  <p className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-purple-500 mr-2"></span>
                    Linked to todo
                  </p>
                </div>
              )}
              
              {selectedEvent.isLocked && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  <p className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                    Locked event
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <div>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
              <div className="flex gap-2">
                {selectedEvent.isTodo && (
                  <Button variant="secondary" onClick={handleComplete}>
                    Complete
                  </Button>
                )}
                <Button onClick={handleEdit}>
                  Edit
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventDetails;
