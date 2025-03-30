
import React from 'react';

const ResizeHandle: React.FC = () => {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 h-2.5 bg-transparent hover:bg-white/50 cursor-ns-resize flex items-center justify-center" 
      data-resize-handle="true"
    >
      <div className="w-6 h-1 bg-white/50 rounded-full hover:bg-white/80" />
    </div>
  );
};

export default ResizeHandle;
