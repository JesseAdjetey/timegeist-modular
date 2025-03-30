
import React, { useEffect, useRef } from 'react';

interface AnimatedLogoProps {
  className?: string;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className }) => {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logoElement = logoRef.current;
    if (!logoElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = logoElement.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      // Calculate distance from center (normalized)
      const distX = (e.clientX - centerX) / (window.innerWidth / 2);
      const distY = (e.clientY - centerY) / (window.innerHeight / 2);
      
      // Apply subtle rotation based on mouse position
      logoElement.style.transform = `perspective(1000px) rotateY(${distX * 5}deg) rotateX(${-distY * 5}deg)`;
    };

    const resetPosition = () => {
      logoElement.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', resetPosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', resetPosition);
    };
  }, []);

  return (
    <div ref={logoRef} className={`transition-transform duration-300 ease-out ${className}`}>
      <img 
        src="/lovable-uploads/43ff48d8-817a-40cc-ae01-ccfeb52283cd.png" 
        alt="Malleabite Logo" 
        className="w-full h-full object-contain animate-gentle-rotate"
      />
    </div>
  );
};

export default AnimatedLogo;
