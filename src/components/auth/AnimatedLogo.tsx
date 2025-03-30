
import React, { useEffect, useRef } from 'react';

interface AnimatedLogoProps {
  className?: string;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className }) => {
  const logoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logoElement = logoRef.current;
    const container = containerRef.current;
    if (!logoElement || !container) return;

    // Add glow animation
    const addGlow = () => {
      const glowElement = document.createElement('div');
      glowElement.className = 'absolute inset-0 z-0 opacity-0';
      glowElement.style.background = 'radial-gradient(circle, rgba(138, 43, 226, 0.6) 0%, rgba(25, 15, 45, 0) 70%)';
      glowElement.style.animation = 'glow 3s ease-in-out infinite alternate';
      glowElement.style.filter = 'blur(20px)';
      container.appendChild(glowElement);
    };
    
    addGlow();

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = container.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      // Calculate distance from center (normalized)
      const distX = (e.clientX - centerX) / (window.innerWidth / 3);
      const distY = (e.clientY - centerY) / (window.innerHeight / 3);
      
      // Apply more dramatic 3D rotation effect
      logoElement.style.transform = `
        perspective(1000px) 
        rotateY(${distX * 15}deg) 
        rotateX(${-distY * 15}deg)
        scale3d(1.05, 1.05, 1.05)
      `;
      
      // Change shadow based on angle
      logoElement.style.filter = `
        drop-shadow(${-distX * 15}px ${-distY * 15}px 15px rgba(138, 43, 226, 0.3))
      `;
    };

    const resetPosition = () => {
      logoElement.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
      logoElement.style.filter = 'drop-shadow(0 0 10px rgba(138, 43, 226, 0.2))';
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', resetPosition);

    // Add floating animation
    logoElement.style.animation = 'floatLogo 6s ease-in-out infinite';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', resetPosition);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div 
        ref={logoRef} 
        className="transition-all duration-200 ease-out z-10 relative"
      >
        <img 
          src="/lovable-uploads/43ff48d8-817a-40cc-ae01-ccfeb52283cd.png" 
          alt="Malleabite Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Add animated orbs around the logo */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div 
          key={i}
          className="absolute rounded-full bg-primary/10 blur-xl z-0"
          style={{
            width: `${Math.random() * 100 + 50}px`,
            height: `${Math.random() * 100 + 50}px`,
            top: `${Math.random() * 200 - 50}%`,
            left: `${Math.random() * 200 - 50}%`,
            animation: `orbit ${Math.random() * 15 + 20}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedLogo;
