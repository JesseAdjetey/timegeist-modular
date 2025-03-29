
import React, { useState, useEffect, useRef } from 'react';
import MallyAI from './MallyAI';

const DraggableLogo = () => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStartPos.current.x,
      y: e.clientY - dragStartPos.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleLogoClick = () => {
    if (!isDragging) {
      setShowAI(!showAI);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <>
      <div
        ref={dragRef}
        className="fixed z-50 cursor-grab active:cursor-grabbing"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleLogoClick}
      >
        <div className="relative rounded-lg shadow-lg p-1 bg-white/80 dark:bg-black/50 hover:scale-105 transition-transform duration-200">
          <img 
            src="/lovable-uploads/50041269-e66c-4735-b847-3d4fef85beca.png" 
            alt="Company Logo" 
            className="h-12 w-12 rounded-lg" 
            draggable="false"
          />
        </div>
      </div>

      {showAI && <MallyAI />}
    </>
  );
};

export default DraggableLogo;
