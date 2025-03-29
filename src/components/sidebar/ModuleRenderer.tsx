
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
}

const ModuleRenderer: React.FC<ModuleRendererProps> = ({ 
  module, 
  index, 
  moduleWidth, 
  onRemove,
  onTitleChange
}) => {
  // Each module has a fixed width
  const moduleStyle = {
    width: `${moduleWidth}px`,
    maxWidth: '100%'
  };
  
  switch (module.type) {
    case 'todo':
      return (
        <div key={index} style={moduleStyle} className="mb-4 gradient-border cursor-glow">
          <TodoModule 
            title={module.title} 
            onRemove={onRemove} 
            onTitleChange={onTitleChange}
          />
        </div>
      );
    case 'pomodoro':
      return (
        <div key={index} style={moduleStyle} className="mb-4 gradient-border cursor-glow">
          <PomodoroModule 
            title={module.title}
            onRemove={onRemove} 
            onTitleChange={onTitleChange}
          />
        </div>
      );
    case 'alarms':
      return (
        <div key={index} style={moduleStyle} className="mb-4 gradient-border cursor-glow">
          <AlarmsModule 
            title={module.title}
            onRemove={onRemove} 
            onTitleChange={onTitleChange}
          />
        </div>
      );
    case 'eisenhower':
      return (
        <div key={index} style={moduleStyle} className="mb-4 gradient-border cursor-glow">
          <EisenhowerModule 
            title={module.title}
            onRemove={onRemove} 
            onTitleChange={onTitleChange}
          />
        </div>
      );
    case 'invites':
      return (
        <div key={index} style={moduleStyle} className="mb-4 gradient-border cursor-glow">
          <InvitesModule 
            title={module.title}
            onRemove={onRemove} 
            onTitleChange={onTitleChange}
          />
        </div>
      );
    default:
      return null;
  }
};

export default ModuleRenderer;
