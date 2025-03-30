
import React from 'react';
import { ModuleInstance } from '@/lib/stores/types';
import TodoModule from '../modules/TodoModule';
import InvitesModule from '../modules/InvitesModule';
import PomodoroModule from '../modules/PomodoroModule';
import EisenhowerModule from '../modules/EisenhowerModule';
import AlarmsModule from '../modules/AlarmsModule';

interface ModuleRendererProps {
  module: ModuleInstance;
  index: number;
  moduleWidth: number;
  onRemove: () => void;
  onTitleChange: (title: string) => void;
  onToggleMinimize: () => void;
  isDragging?: boolean;
}

const ModuleRenderer: React.FC<ModuleRendererProps> = ({ 
  module, 
  index, 
  moduleWidth, 
  onRemove,
  onTitleChange,
  onToggleMinimize,
  isDragging = false
}) => {
  // Each module has a fixed width
  const moduleStyle = {
    width: `${moduleWidth}px`,
    maxWidth: '100%'
  };
  
  // Add common drag handle to each module type
  const moduleProps = {
    title: module.title,
    onRemove: onRemove,
    onTitleChange: onTitleChange,
    onMinimize: onToggleMinimize,
    isMinimized: module.minimized,
    isDragging: isDragging
  };
  
  const moduleClassName = `mb-4 gradient-border cursor-glow ${isDragging ? 'opacity-75' : ''}`;
  
  // If module is minimized, we'll still render it but with reduced height
  const minimizedClassName = module.minimized ? 'h-12 overflow-hidden' : '';
  
  switch (module.type) {
    case 'todo':
      return (
        <div key={index} style={moduleStyle} className={`${moduleClassName} ${minimizedClassName}`}>
          <TodoModule {...moduleProps} />
        </div>
      );
    case 'pomodoro':
      return (
        <div key={index} style={moduleStyle} className={`${moduleClassName} ${minimizedClassName}`}>
          <PomodoroModule {...moduleProps} />
        </div>
      );
    case 'alarms':
      return (
        <div key={index} style={moduleStyle} className={`${moduleClassName} ${minimizedClassName}`}>
          <AlarmsModule {...moduleProps} />
        </div>
      );
    case 'eisenhower':
      return (
        <div key={index} style={moduleStyle} className={`${moduleClassName} ${minimizedClassName}`}>
          <EisenhowerModule {...moduleProps} />
        </div>
      );
    case 'invites':
      return (
        <div key={index} style={moduleStyle} className={`${moduleClassName} ${minimizedClassName}`}>
          <InvitesModule {...moduleProps} />
        </div>
      );
    default:
      return null;
  }
};

export default ModuleRenderer;
