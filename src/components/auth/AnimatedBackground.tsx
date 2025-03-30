
import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* First layer - gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-900"
        style={{ opacity: 0.9 }}
      ></div>
      
      {/* Second layer - animated geometric shapes */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-purple-400/20 to-blue-500/20 blur-xl"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `translate(-50%, -50%)`,
              animation: `float ${Math.random() * 10 + 20}s linear infinite`,
              animationDelay: `${Math.random() * 20}s`,
              opacity: 0.4,
            }}
          ></div>
        ))}
      </div>
      
      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
    </div>
  );
};

export default AnimatedBackground;
