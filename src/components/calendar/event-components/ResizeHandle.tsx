
import React from 'react';

const ResizeHandle: React.FC = () => {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 h-3 bg-transparent hover:bg-white/20 cursor-ns-resize flex items-center justify-center" 
      data-resize-handle="true"
    >
      <div className="w-10 h-1.5 bg-white/60 rounded-full hover:bg-white/90 transition-colors" />
    </div>
  );
};

export default ResizeHandle;
