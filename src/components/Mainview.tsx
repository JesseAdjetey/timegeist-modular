
import React, { useState, useRef, useEffect } from "react";
import MonthView from "@/components/month-view";
import SideBar from "@/components/sidebar/sideBar";
import { useViewStore, useEventStore } from "@/lib/store";
import DayView from "@/components/day-view";
import WeekView from "@/components/week-view";
import Header from "@/components/header/Header";
import MallyAI from "@/components/ai/MallyAI";
import EventForm from "@/components/calendar/EventForm";

const Mainview = () => {
  const { selectedView } = useViewStore();
  const { addEvent, selectedEvent, closeEventSummary, updateEvent, deleteEvent } = useEventStore();
  const [sidebarWidth, setSidebarWidth] = useState(400); // Initial width
  const [showEventForm, setShowEventForm] = useState(false);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Set limits for sidebar width
  const MIN_WIDTH = 320;
  const MAX_WIDTH = 800;

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    // Attach mousemove and mouseup listeners to the document
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging.current) return;
    let newWidth = e.clientX; // Get current mouse X position

    // Constrain sidebar width between min and max
    newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));

    setSidebarWidth(newWidth);
  };

  const stopDrag = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", stopDrag);
  };

  const handleAddEvent = (event: any) => {
    if (selectedEvent) {
      updateEvent(event);
      closeEventSummary();
    } else {
      addEvent(event);
    }
    setShowEventForm(false);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id);
      closeEventSummary();
    }
    setShowEventForm(false);
  };

  const handleAISchedule = () => {
    setShowEventForm(false);
    // This would open the AI interface for scheduling
  };

  useEffect(() => {
    return () => {
      // Cleanup event listeners when component unmounts
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", stopDrag);
    };
  }, []);

  // Handle opening event form when an event is selected
  useEffect(() => {
    if (selectedEvent) {
      setShowEventForm(true);
    }
  }, [selectedEvent]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${MAX_WIDTH}px` }}
        className="transition-all duration-100"
      >
        <SideBar />
      </div>

      {/* Resizer */}
      <div
        className="resizer"
        onMouseDown={startDrag}
      ></div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-screen">
        <Header />
        <div className="overflow-y-auto flex-1">
          {selectedView === "Month" && <MonthView />}
          {selectedView === "Day" && <DayView />}
          {selectedView === "Week" && <WeekView />}
        </div>
      </div>

      {/* AI Assistant */}
      <MallyAI onScheduleEvent={() => setShowEventForm(true)} />

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <EventForm
            initialEvent={selectedEvent || {}}
            onSave={handleAddEvent}
            onCancel={() => {
              setShowEventForm(false);
              if (selectedEvent) closeEventSummary();
            }}
            onUseAI={handleAISchedule}
          />
        </div>
      )}
    </div>
  );
};

export default Mainview;
