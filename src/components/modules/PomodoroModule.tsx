import React, { useState, useEffect } from 'react';
import ModuleContainer from './ModuleContainer';

interface PomodoroModuleProps {
  title?: string;
  onRemove?: () => void;
  onTitleChange?: (title: string) => void;
}

const PomodoroModule: React.FC<PomodoroModuleProps> = ({ 
  title = "Pomodoro", 
  onRemove,
  onTitleChange
}) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(100);
  const totalTime = 25 * 60; // 25 minutes

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          setProgress((newTime / totalTime) * 100);
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Notification when timer ends
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
          body: 'Time is up! Take a break.',
        });
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
    setProgress(100);
  };

  return (
    <ModuleContainer 
      title={title} 
      onRemove={onRemove}
      onTitleChange={onTitleChange}
    >
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 mb-4">
          {/* Circular progress background */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-secondary"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
            />
            {/* Progress indicator */}
            <circle
              className="text-primary transition-all duration-1000"
              strokeWidth="4"
              strokeDasharray={264} // 2 * π * 42
              strokeDashoffset={264 - (264 * progress) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
            />
          </svg>
          
          {/* Timer display */}
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={toggleTimer}
            className="bg-primary px-4 py-1 rounded-md hover:bg-primary/80 transition-colors"
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="bg-secondary px-4 py-1 rounded-md hover:bg-secondary/80 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </ModuleContainer>
  );
};

export default PomodoroModule;
