
import React from 'react';
import { Clock, Calendar, ListTodo, BellRing } from 'lucide-react';

const TimeManagementVisual: React.FC = () => {
  const icons = [
    { Icon: Clock, delay: '0s', duration: '15s' },
    { Icon: Calendar, delay: '3s', duration: '18s' },
    { Icon: ListTodo, delay: '5s', duration: '20s' },
    { Icon: BellRing, delay: '8s', duration: '17s' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {icons.map(({ Icon, delay, duration }, index) => (
        <div
          key={index}
          className="absolute text-white/20"
          style={{
            fontSize: `${Math.random() * 2 + 2}rem`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${duration} linear infinite`,
            animationDelay: delay,
          }}
        >
          <Icon size={64} />
        </div>
      ))}
    </div>
  );
};

export default TimeManagementVisual;
