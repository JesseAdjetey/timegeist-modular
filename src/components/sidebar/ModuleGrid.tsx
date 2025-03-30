
import React, { useEffect, useRef, useState } from 'react';
import { useSidebarStore } from '@/lib/store';
import ModuleRenderer from './ModuleRenderer';
import { useSidebarLayout } from '@/hooks/use-sidebar-layout';
import { ModuleInstance, ModuleType } from '@/lib/stores/types';

interface ModuleGridProps {
  modules: ModuleInstance[];
  onRemoveModule: (index: number) => void;
  onUpdateModuleTitle: (index: number, title: string) => void;
}

const ModuleGrid: React.FC<ModuleGridProps> = ({ 
  modules, 
  onRemoveModule,
  onUpdateModuleTitle
}) => {
  // Module dimensions - reduced width for better fit in sidebar
  const MODULE_WIDTH = 280; // Reduced from 320 to 280
  
  // Use our custom hook for responsive layout with lower breakpoint
  const { isTwoColumn, containerRef } = useSidebarLayout({
    columnBreakpoint: 620 // Reduced from 700 to trigger two columns more easily
  });

  // Custom cursor effect
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create the custom cursor element
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    document.body.appendChild(cursor);

    const handleMouseMove = (e: MouseEvent) => {
      if (cursor) {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      }
    };

    const handleHoverStart = () => {
      cursor.classList.add('expanded');
    };

    const handleHoverEnd = () => {
      cursor.classList.remove('expanded');
    };

    // Add listeners to document
    document.addEventListener('mousemove', handleMouseMove);

    // Attach hover listeners to all module containers and calendar elements
    const gradientElements = document.querySelectorAll('.gradient-border');
    gradientElements.forEach(el => {
      el.addEventListener('mouseenter', handleHoverStart);
      el.addEventListener('mouseleave', handleHoverEnd);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      gradientElements.forEach(el => {
        el.removeEventListener('mouseenter', handleHoverStart);
        el.removeEventListener('mouseleave', handleHoverEnd);
      });
      if (cursor && document.body.contains(cursor)) {
        document.body.removeChild(cursor);
      }
    };
  }, [modules.length]); // Re-run when modules change

  return (
    <div 
      ref={containerRef} 
      className={`${isTwoColumn ? 'grid grid-cols-2 gap-4 justify-items-center' : 'flex flex-col items-center'}`}
    >
      {modules.map((module, index) => (
        <ModuleRenderer
          key={index}
          module={module}
          index={index}
          moduleWidth={MODULE_WIDTH}
          onRemove={() => onRemoveModule(index)}
          onTitleChange={(title) => onUpdateModuleTitle(index, title)}
        />
      ))}
    </div>
  );
};

export default ModuleGrid;
