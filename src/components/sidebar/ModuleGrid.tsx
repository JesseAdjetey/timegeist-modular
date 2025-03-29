
import React, { useRef, useEffect, useState } from 'react';
import { ModuleType } from '@/lib/store';
import ModuleRenderer from './ModuleRenderer';

interface ModuleGridProps {
  modules: ModuleType[];
  onRemoveModule: (index: number) => void;
}

const ModuleGrid: React.FC<ModuleGridProps> = ({ modules, onRemoveModule }) => {
  const [isTwoColumn, setIsTwoColumn] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Module dimensions - fixed width for modules
  const MODULE_WIDTH = 320;

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Check if there's enough space for two columns
        if (entry.contentRect.width > 700) {
          setIsTwoColumn(true);
        } else {
          setIsTwoColumn(false);
        }
      }
    });

    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div 
      ref={gridRef} 
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
