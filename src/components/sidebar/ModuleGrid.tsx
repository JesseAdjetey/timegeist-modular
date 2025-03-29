
import React, { useRef, useEffect, useState } from 'react';
import { ModuleType } from '@/lib/store';
import TodoModule from '../modules/TodoModule';
import InvitesModule from '../modules/InvitesModule';
import PomodoroModule from '../modules/PomodoroModule';
import EisenhowerModule from '../modules/EisenhowerModule';
import AlarmsModule from '../modules/AlarmsModule';

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

  const renderModule = (type: ModuleType, index: number) => {
    // Each module has a fixed width, regardless of sidebar width
    const moduleStyle = {
      width: `${MODULE_WIDTH}px`,
      maxWidth: '100%'
    };
    
    switch (type) {
      case 'todo':
        return (
          <div key={index} style={moduleStyle} className="mb-4">
            <TodoModule title="To-Do List" onRemove={() => onRemoveModule(index)} />
          </div>
        );
      case 'pomodoro':
        return (
          <div key={index} style={moduleStyle} className="mb-4">
            <PomodoroModule onRemove={() => onRemoveModule(index)} />
          </div>
        );
      case 'alarms':
        return (
          <div key={index} style={moduleStyle} className="mb-4">
            <AlarmsModule onRemove={() => onRemoveModule(index)} />
          </div>
        );
      case 'eisenhower':
        return (
          <div key={index} style={moduleStyle} className="mb-4">
            <EisenhowerModule onRemove={() => onRemoveModule(index)} />
          </div>
        );
      case 'invites':
        return (
          <div key={index} style={moduleStyle} className="mb-4">
            <InvitesModule onRemove={() => onRemoveModule(index)} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      ref={gridRef} 
      className={`${isTwoColumn ? 'grid grid-cols-2 gap-4 justify-items-center' : 'flex flex-col items-center'}`}
    >
      {modules.map((moduleType, index) => renderModule(moduleType, index))}
    </div>
  );
};

export default ModuleGrid;
