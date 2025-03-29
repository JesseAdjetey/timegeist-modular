
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
  // Module dimensions - fixed width for modules
  const MODULE_WIDTH = 320;
  
  // Use our custom hook for responsive layout
  const { isTwoColumn, containerRef } = useSidebarLayout({
    columnBreakpoint: 700
  });

  // Custom cursor effect
  const [cursorPosition, setCursorPosition] = useState({ x: -100, y: -100 });
  const [isCursorExpanded, setIsCursorExpanded] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => {
      setIsCursorExpanded(true);
    };

    const handleMouseLeave = () => {
      setIsCursorExpanded(false);
    };

    // Add listeners to the document
    document.addEventListener('mousemove', handleMouseMove);

    // Add listeners to all module containers
    const moduleElements = document.querySelectorAll('.module-container, .glass-card');
    moduleElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      moduleElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [modules.length]); // Re-run when modules change

  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.style.left = `${cursorPosition.x}px`;
      cursorRef.current.style.top = `${cursorPosition.y}px`;
      if (isCursorExpanded) {
        cursorRef.current.classList.add('expanded');
      } else {
        cursorRef.current.classList.remove('expanded');
      }
    }
  }, [cursorPosition, isCursorExpanded]);

  return (
    <>
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
      <div ref={cursorRef} className="custom-cursor hidden md:block"></div>
    </>
  );
};

export default ModuleGrid;
