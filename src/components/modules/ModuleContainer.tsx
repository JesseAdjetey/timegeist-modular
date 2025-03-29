
import React, { ReactNode, useState } from 'react';
import { Minus, Edit, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ModuleContainerProps {
  title: string;
  children: ReactNode;
  onRemove?: () => void;
  onTitleChange?: (newTitle: string) => void;
}

const ModuleContainer: React.FC<ModuleContainerProps> = ({ 
  title, 
  children, 
  onRemove,
  onTitleChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleEditClick = () => {
    setEditTitle(title);
    setIsEditing(true);
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && onTitleChange) {
      onTitleChange(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(title);
    }
  };

  return (
    <div className="module-container bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-4 gradient-border cursor-glow">
      <div className="module-header flex justify-between items-center mb-3">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-lg font-semibold bg-white/10"
              autoFocus
            />
            <button 
              onClick={handleSaveTitle}
              className="hover:bg-white/10 p-1 rounded-full transition-all"
            >
              <Check size={16} className="text-primary" />
            </button>
          </div>
        ) : (
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
        )}
        <div className="flex gap-1">
          {onTitleChange && (
            <button 
              onClick={handleEditClick}
              className="hover:bg-white/10 p-1 rounded-full transition-all"
            >
              <Edit size={16} />
            </button>
          )}
          {onRemove && (
            <button 
              onClick={onRemove}
              className="hover:bg-white/10 p-1 rounded-full transition-all"
            >
              <Minus size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="module-content">{children}</div>
    </div>
  );
};

export default ModuleContainer;
