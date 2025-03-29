
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import EventForm from "@/components/calendar/EventForm";
import { useState } from "react";
import { useEventStore } from "@/lib/store";
import { nanoid } from "@/lib/utils";
import { CalendarEventType } from "@/lib/stores/types";
import { useToast } from "@/components/ui/use-toast";

const AddEventButton = () => {
  const { addEvent } = useEventStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleSaveEvent = (event: CalendarEventType) => {
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
    
    // Create the event with a generated ID
    const newEvent = {
      ...event,
      id: nanoid(),
      color: randomColor,
    };
    
    addEvent(newEvent);
    setOpen(false);
    
    toast({
      title: "Event Added",
      description: `${event.title} has been added to your calendar.`,
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full fixed bottom-8 right-8 z-50 shadow-lg bg-primary hover:bg-primary/90"
          aria-label="Add event"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md md:max-w-lg border-white/10 bg-background/95 backdrop-blur-xl">
        <EventForm 
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
