
import React from 'react';
import { Bot, X, Plus, ArrowUpRight, ArrowRight, ArrowLeft } from 'lucide-react';
import ChatSettings from './ChatSettings';

interface ChatHeaderProps {
  isExpanded: boolean;
  isSidebarView: boolean;
  onToggleExpand: () => void;
  onToggleSidebarView: () => void;
  onClose: () => void;
  size: 'small' | 'medium' | 'large';
  onSizeChange: (size: 'small' | 'medium' | 'large') => void;
  position: { x: number, y: number };
  onPositionReset: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isExpanded,
  isSidebarView,
  onToggleExpand,
  onToggleSidebarView,
  onClose,
  size,
  onSizeChange,
  position,
  onPositionReset
}) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center">
        <Bot size={20} className="text-primary mr-2" />
        <h3 className="font-semibold">Mally AI</h3>
      </div>
      <div className="flex items-center space-x-1">
        <ChatSettings 
          onSizeChange={onSizeChange}
          size={size}
          position={position}
          onPositionReset={onPositionReset}
          isDarkMode={true} // Always dark mode in this app
        />
        <button 
          onClick={onToggleSidebarView}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          {isSidebarView ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
        </button>
        <button 
          onClick={onToggleExpand}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          {isExpanded ? <ArrowUpRight size={14} /> : <Plus size={14} />}
        </button>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
