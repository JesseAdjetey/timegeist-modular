
import React, { ReactNode } from 'react';
import { Minus } from 'lucide-react';

interface ModuleContainerProps {
  title: string;
  children: ReactNode;
  onRemove?: () => void;
}

const ModuleContainer: React.FC<ModuleContainerProps> = ({ title, children, onRemove }) => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h3 className="text-lg font-semibold">{title}</h3>
        {onRemove && (
          <button 
            onClick={onRemove}
            className="hover:bg-white/10 p-1 rounded-full transition-all"
          >
            <Minus size={16} />
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default ModuleContainer;
