
import React from 'react';

const ResizeHandle: React.FC = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-transparent hover:bg-white/30 cursor-ns-resize" 
         data-resize-handle="true" />
  );
};

export default ResizeHandle;
