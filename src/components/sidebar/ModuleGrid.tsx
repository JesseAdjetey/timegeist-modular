
import React from 'react';
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
