
import React, { useState, useEffect, useRef } from 'react';
import MallyAI from './MallyAI';

const DraggableLogo = () => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      dragStartPos.current = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    // Calculate new position while ensuring the logo stays within viewport bounds
    const newX = Math.max(0, Math.min(window.innerWidth - 60, clientX - dragStartPos.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 60, clientY - dragStartPos.current.y));
    
    setPosition({
      x: newX,
      y: newY
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragEnd();
  };

  const handleLogoClick = () => {
    if (!isDragging) {
      setShowAI(!showAI);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

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

  // Save position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('logo-position', JSON.stringify(position));
  }, [position]);

  // Load position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('logo-position');
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition));
      } catch (e) {
        console.error('Failed to parse saved position', e);
      }
    }
  }, []);

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
