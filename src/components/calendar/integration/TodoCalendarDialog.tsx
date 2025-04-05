
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Calendar, ArrowLeft } from "lucide-react";

interface TodoCalendarDialogProps {
  open: boolean;
  onClose: () => void;
  todoTitle: string;
  onCreateBoth: () => void;
  onCreateCalendarOnly: () => void;
}

const TodoCalendarDialog: React.FC<TodoCalendarDialogProps> = ({
  open,
  onClose,
  todoTitle,
  onCreateBoth,
  onCreateCalendarOnly,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-text">
            Schedule Todo Item
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4 text-foreground/80">
            Would you like to make "{todoTitle}" a calendar event?
          </p>

          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={onCreateBoth}
              className="bg-primary hover:bg-primary/80 flex items-center gap-2 justify-start py-6"
            >
              <CalendarCheck size={20} />
              <span>Both calendar event and todo item</span>
            </Button>

            <Button
              onClick={onCreateCalendarOnly}
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary flex items-center gap-2 justify-start py-6"
            >
              <Calendar size={20} />
              <span>Calendar event only</span>
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              className="flex items-center gap-2 justify-start"
            >
              <ArrowLeft size={20} />
              <span>Go back</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TodoCalendarDialog;
