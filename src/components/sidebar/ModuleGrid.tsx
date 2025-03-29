
import React from 'react';
import { ModuleType } from '@/lib/store';
import ModuleRenderer from './ModuleRenderer';
import { useSidebarLayout } from '@/hooks/use-sidebar-layout';

interface ModuleGridProps {
  modules: ModuleType[];
  onRemoveModule: (index: number) => void;
}

const ModuleGrid: React.FC<ModuleGridProps> = ({ modules, onRemoveModule }) => {
  // Module dimensions - fixed width for modules
  const MODULE_WIDTH = 320;
  
  // Use our custom hook for responsive layout
  const { isTwoColumn, containerRef } = useSidebarLayout({
    columnBreakpoint: 700
  });

  return (
    <div 
      ref={containerRef} 
      className={`${isTwoColumn ? 'grid grid-cols-2 gap-4 justify-items-center' : 'flex flex-col items-center'}`}
    >
      {modules.map((moduleType, index) => (
        <ModuleRenderer
          key={index}
          type={moduleType}
          index={index}
          moduleWidth={MODULE_WIDTH}
          onRemove={() => onRemoveModule(index)}
        />
      ))}
    </div>
  );
};

export default ModuleGrid;
