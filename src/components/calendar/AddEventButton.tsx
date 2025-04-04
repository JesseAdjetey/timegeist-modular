
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import EventForm from "@/components/calendar/EventForm";
import { useState } from "react";
import { useEventStore } from "@/lib/store";
import { nanoid } from "@/lib/utils";
import { CalendarEventType } from "@/lib/stores/types";
import { toast } from "@/components/ui/use-toast";
import { useCalendarEvents } from "@/hooks/use-calendar-events";

const AddEventButton = () => {
  const { addEvent: storeAddEvent } = useEventStore();
  const { addEvent: dbAddEvent } = useCalendarEvents();
  const [open, setOpen] = useState(false);

  const handleSaveEvent = async (event: CalendarEventType) => {
    // Generate a random color for the event
    const colors = [
      'bg-[hsl(var(--event-red))]',
      'bg-[hsl(var(--event-green))]',
      'bg-[hsl(var(--event-blue))]',
      'bg-[hsl(var(--event-purple))]',
      'bg-[hsl(var(--event-teal))]',
      'bg-[hsl(var(--event-orange))]',
      'bg-[hsl(var(--event-pink))]',
    ];
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Create the event with a temporary ID (will be replaced by DB)
    const newEvent = {
      ...event,
      id: nanoid(),
      color: event.color || randomColor,
    };
    
    try {
      // Add to database and update store if successful
      const response = await dbAddEvent(newEvent);
      
      if (response.success) {
        setOpen(false);
        
        toast({
          title: "Event Added",
          description: `${event.title} has been added to your calendar.`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message ? String(response.message) : "Failed to add event",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        title: "Error",
        description: "Failed to add event. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full fixed bottom-20 right-8 z-50 shadow-lg bg-primary hover:bg-primary/90"
          aria-label="Add event"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md md:max-w-lg border-white/10 bg-background/95 backdrop-blur-xl overflow-y-auto pb-16">
        <EventForm 
          open={true}
          onSave={handleSaveEvent} 
          onCancel={() => setOpen(false)}
          onUseAI={() => {
            toast({
              title: "Mally AI",
              description: "AI event planning is coming soon!",
            });
          }}
        />
      </SheetContent>
    </Sheet>
  );
};

export default AddEventButton;
