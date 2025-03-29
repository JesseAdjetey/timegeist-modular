
import React, { useState, useRef, useEffect } from "react";
import MonthView from "@/components/month-view";
import SideBar from "@/components/sidebar/sideBar";
import { useViewStore } from "@/lib/store";
import DayView from "@/components/day-view";
import WeekView from "@/components/week-view";
import Header from "@/components/header/Header";
import { GripVertical } from 'lucide-react';
import DraggableLogo from "@/components/ai/DraggableLogo";

const Mainview = () => {
  const { selectedView } = useViewStore();
  const [sidebarWidth, setSidebarWidth] = useState(400); // Initial width
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Set limits for sidebar width
  const MIN_WIDTH = 400;
  const MAX_WIDTH = 800;

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'ew-resize';

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
    document.body.style.cursor = 'default';
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", stopDrag);
  };

  useEffect(() => {
    return () => {
      // Cleanup event listeners when component unmounts
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", stopDrag);
      document.body.style.cursor = 'default';
    };
  }, []);

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
        className="flex items-center justify-center w-6 cursor-ew-resize z-10 hover:bg-purple-400/30 transition-colors"
        onMouseDown={startDrag}
      >
        <div className="h-16 w-4 rounded-md flex items-center justify-center light-mode:bg-purple-200 light-mode:hover:bg-purple-300 dark-mode:bg-purple-600/30 dark-mode:hover:bg-purple-500/60">
          <GripVertical className="text-purple-500 h-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-screen">
        <Header />
        <div className="overflow-y-auto flex-1">
          {selectedView === "Month" && <MonthView />}
          {selectedView === "Day" && <DayView />}
          {selectedView === "Week" && <WeekView />}
        </div>
      </div>

      {/* Draggable Logo */}
      <DraggableLogo />
    </div>
  );
};

export default Mainview;
