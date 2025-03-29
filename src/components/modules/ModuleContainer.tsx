
import React, { ReactNode } from 'react';
import { Minus } from 'lucide-react';

interface ModuleContainerProps {
  title: string;
  children: ReactNode;
  onRemove?: () => void;
}

const ModuleContainer: React.FC<ModuleContainerProps> = ({ title, children, onRemove }) => {
  return (
    <div className="module-container bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-4">
      <div className="module-header flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        {onRemove && (
          <button 
            onClick={onRemove}
            className="hover:bg-white/10 p-1 rounded-full transition-all"
          >
            <Minus size={16} />
          </button>
        )}
      </div>
      <div className="module-content">{children}</div>
    </div>
  );
};

export default ModuleContainer;
