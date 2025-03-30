
import React from 'react';
import { ModuleInstance } from '@/lib/stores/types';
import TodoModule from '../modules/TodoModule';
import InvitesModule from '../modules/InvitesModule';
import PomodoroModule from '../modules/PomodoroModule';
import EisenhowerModule from '../modules/EisenhowerModule';
import AlarmsModule from '../modules/AlarmsModule';
import { GripVertical } from 'lucide-react';

interface ModuleRendererProps {
  module: ModuleInstance;
  index: number;
  moduleWidth: number;
  onRemove: () => void;
  onTitleChange: (title: string) => void;
  isDragging?: boolean;
}

const ModuleRenderer: React.FC<ModuleRendererProps> = ({ 
  module, 
  index, 
  moduleWidth, 
  onRemove,
  onTitleChange,
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
    isDragging: isDragging
  };
  
  const moduleClassName = `mb-4 gradient-border cursor-glow ${isDragging ? 'opacity-75' : ''}`;
  
  switch (module.type) {
    case 'todo':
      return (
        <div key={index} style={moduleStyle} className={moduleClassName}>
          <TodoModule {...moduleProps} />
        </div>
      );
    case 'pomodoro':
      return (
        <div key={index} style={moduleStyle} className={moduleClassName}>
          <PomodoroModule {...moduleProps} />
        </div>
      );
    case 'alarms':
      return (
        <div key={index} style={moduleStyle} className={moduleClassName}>
          <AlarmsModule {...moduleProps} />
        </div>
      );
    case 'eisenhower':
      return (
        <div key={index} style={moduleStyle} className={moduleClassName}>
          <EisenhowerModule {...moduleProps} />
        </div>
      );
    case 'invites':
      return (
        <div key={index} style={moduleStyle} className={moduleClassName}>
          <InvitesModule {...moduleProps} />
        </div>
      );
    default:
      return null;
  }
};

export default ModuleRenderer;
