
import React from 'react';
import { GripVertical } from 'lucide-react';

const DragHandle: React.FC = () => {
  return (
    <div className="absolute top-0 right-1 opacity-70 hover:opacity-100">
      <GripVertical size={14} className="text-white/70" />
    </div>
  );
};

export default DragHandle;
