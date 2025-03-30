
import React from "react";
import dayjs from "dayjs";

interface CurrentTimeIndicatorProps {
  currentTime: dayjs.Dayjs;
  isCurrentDay: boolean;
}

const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({ 
  currentTime, 
  isCurrentDay 
}) => {
  if (!isCurrentDay) return null;
  
  // Calculate position more precisely
  const minutes = currentTime.hour() * 60 + currentTime.minute();
  const position = (minutes / (24 * 60)) * 100 * 20;
  
  return (
    <div
      className="absolute h-0.5 w-full bg-primary z-20 flex items-center"
      style={{
        top: `${position}px`,
      }}
    >
      <div className="w-2 h-2 rounded-full bg-primary -ml-1" />
    </div>
  );
};

export default CurrentTimeIndicator;
