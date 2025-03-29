
/**
 * Utility functions for handling touch events in calendar events
 */

// Extract time info from event description
export const getTimeInfo = (description?: string) => {
  if (!description) return { start: '09:00', end: '10:00' };
  
  const parts = description.split('|');
  if (parts.length >= 1) {
    const timesPart = parts[0].trim();
    const times = timesPart.split('-').map(t => t.trim());
    return {
      start: times[0] || '09:00',
      end: times[1] || '10:00'
    };
  }
  
  return { start: '09:00', end: '10:00' };
};

// Get drag data for an event
export const getDragData = (event: any, isLocked: boolean = false, color: string = '') => {
  const timeInfo = getTimeInfo(event.description);
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    timeStart: timeInfo.start,
    timeEnd: timeInfo.end,
    isLocked,
    isTodo: event.isTodo,
    hasAlarm: event.hasAlarm,
    hasReminder: event.hasReminder,
    color,
    participants: event.participants
  };
};
