
import React from 'react';
import { ModuleType } from '@/lib/store';
import TodoModule from '../modules/TodoModule';
import InvitesModule from '../modules/InvitesModule';
import PomodoroModule from '../modules/PomodoroModule';
import EisenhowerModule from '../modules/EisenhowerModule';
import AlarmsModule from '../modules/AlarmsModule';

interface ModuleRendererProps {
  type: ModuleType;
  index: number;
  moduleWidth: number;
  onRemove: () => void;
}

const ModuleRenderer: React.FC<ModuleRendererProps> = ({ 
  type, 
  index, 
  moduleWidth, 
  onRemove 
}) => {
  // Each module has a fixed width
  const moduleStyle = {
    width: `${moduleWidth}px`,
    maxWidth: '100%'
  };
  
  switch (type) {
    case 'todo':
      return (
        <div key={index} style={moduleStyle} className="mb-4">
          <TodoModule title="To-Do List" onRemove={onRemove} />
        </div>
      );
    case 'pomodoro':
      return (
        <div key={index} style={moduleStyle} className="mb-4">
          <PomodoroModule onRemove={onRemove} />
        </div>
      );
    case 'alarms':
      return (
        <div key={index} style={moduleStyle} className="mb-4">
          <AlarmsModule onRemove={onRemove} />
        </div>
      );
    case 'eisenhower':
      return (
        <div key={index} style={moduleStyle} className="mb-4">
          <EisenhowerModule onRemove={onRemove} />
        </div>
      );
    case 'invites':
      return (
        <div key={index} style={moduleStyle} className="mb-4">
          <InvitesModule onRemove={onRemove} />
        </div>
      );
    default:
      return null;
  }
};

export default ModuleRenderer;
