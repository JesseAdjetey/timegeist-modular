
import React from 'react';
import { Bot, X, Plus, ArrowUpRight, ArrowRight, ArrowLeft } from 'lucide-react';

interface ChatHeaderProps {
  isExpanded: boolean;
  isSidebarView: boolean;
  onToggleExpand: () => void;
  onToggleSidebarView: () => void;
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isExpanded,
  isSidebarView,
  onToggleExpand,
  onToggleSidebarView,
  onClose
}) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center">
        <Bot size={20} className="text-primary mr-2" />
        <h3 className="font-semibold">Mally AI</h3>
      </div>
      <div className="flex items-center space-x-1">
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
