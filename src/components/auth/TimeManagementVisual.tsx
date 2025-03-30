
import React, { useEffect, useRef } from 'react';
import { Clock, Calendar, ListTodo, BellRing, Timer, BarChart, Briefcase, Zap } from 'lucide-react';

const TimeManagementVisual: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const icons = container.querySelectorAll('.floating-icon');
      const containerRect = container.getBoundingClientRect();
      
      // Calculate the center point of the container
      const centerX = containerRect.width / 2;
      const centerY = containerRect.height / 2;
      
      // Calculate mouse position relative to center (normalized between -1 and 1)
      const mouseX = ((e.clientX - containerRect.left) / containerRect.width) * 2 - 1;
      const mouseY = ((e.clientY - containerRect.top) / containerRect.height) * 2 - 1;
      
      icons.forEach((icon) => {
        const depth = parseFloat(icon.getAttribute('data-depth') || '1');
        const iconElement = icon as HTMLElement;
        
        // Calculate parallax effect based on depth and mouse position
        const moveX = mouseX * 40 * depth;
        const moveY = mouseY * 40 * depth;
        
        // Add rotation effect for 3D feeling
        const rotateX = -mouseY * 20 * depth;
        const rotateY = mouseX * 20 * depth;
        
        // Apply transforms with transitions for smoothness
        iconElement.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
    };
    
    container.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  const icons = [
    { Icon: Clock, delay: '0s', duration: '15s', depth: 0.2, size: 64 },
    { Icon: Calendar, delay: '3s', duration: '18s', depth: 0.5, size: 72 },
    { Icon: ListTodo, delay: '5s', duration: '20s', depth: 0.3, size: 56 },
    { Icon: BellRing, delay: '8s', duration: '17s', depth: 0.4, size: 48 },
    { Icon: Timer, delay: '2s', duration: '22s', depth: 0.6, size: 68 },
    { Icon: BarChart, delay: '7s', duration: '19s', depth: 0.3, size: 52 },
    { Icon: Briefcase, delay: '4s', duration: '21s', depth: 0.5, size: 58 },
    { Icon: Zap, delay: '6s', duration: '16s', depth: 0.2, size: 44 },
  ];

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden perspective-1000"
    >
      {icons.map(({ Icon, delay, duration, depth, size }, index) => (
        <div
          key={index}
          className="absolute text-white/10 floating-icon transition-transform duration-300 ease-out"
          data-depth={depth}
          style={{
            fontSize: `${Math.random() * 2 + 2}rem`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `floatComplex ${duration} ease-in-out infinite`,
            animationDelay: delay,
            filter: `blur(${(1 - depth) * 2}px) drop-shadow(0 0 10px rgba(138, 43, 226, 0.3))`,
          }}
        >
          <Icon size={size} strokeWidth={1.5} className="transition-all hover:scale-110" />
        </div>
      ))}
      
      {/* Add some glowing orbs in the background */}
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={`orb-${index}`}
          className="absolute rounded-full transition-all duration-300"
          style={{
            width: `${Math.random() * 200 + 100}px`,
            height: `${Math.random() * 200 + 100}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `radial-gradient(circle, rgba(138, 43, 226, 0.2) 0%, rgba(25, 15, 45, 0) 70%)`,
            animation: `pulse ${Math.random() * 10 + 10}s infinite alternate`,
            animationDelay: `${Math.random() * 5}s`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
};

export default TimeManagementVisual;
