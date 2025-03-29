
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
  
  return (
    <div
      className="absolute h-0.5 w-full bg-primary z-20"
      style={{
        top: `${(currentTime.hour() * 60 + currentTime.minute()) / (24 * 60) * 100 * 20}px`,
      }}
    />
  );
};

export default CurrentTimeIndicator;
