
import { AlarmDisplay } from '@/types/database';

// Get weekday name from day number
export const getWeekdayName = (dayNum: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayNum];
};

// Get month name from month number
export const getMonthName = (monthNum: number): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthNum - 1];
};

// Format recurring pattern for display
export const formatRecurringPattern = (alarm: AlarmDisplay): string | null => {
  if (!alarm.is_recurring) return null;
  
  let pattern = "";
  const interval = alarm.recurring_interval || 1;
  
  switch (alarm.recurring_type) {
    case 'daily':
      pattern = interval === 1 ? "Daily" : `Every ${interval} days`;
      break;
    case 'weekly':
      if (alarm.recurring_days && alarm.recurring_days.length > 0) {
        const daysText = alarm.recurring_days.map((d: number) => getWeekdayName(d)).join(', ');
        pattern = interval === 1 
          ? `Weekly on ${daysText}` 
          : `Every ${interval} weeks on ${daysText}`;
      } else {
        pattern = interval === 1 ? "Weekly" : `Every ${interval} weeks`;
      }
      break;
    case 'monthly':
      const dayOfMonth = alarm.recurring_day_of_month 
        ? `on day ${alarm.recurring_day_of_month}` 
        : '';
      pattern = interval === 1 
        ? `Monthly ${dayOfMonth}` 
        : `Every ${interval} months ${dayOfMonth}`;
      break;
    case 'yearly':
      if (alarm.recurring_months && alarm.recurring_months.length > 0) {
        const monthsText = alarm.recurring_months.map((m: number) => getMonthName(m)).join(', ');
        pattern = interval === 1 
          ? `Yearly in ${monthsText}` 
          : `Every ${interval} years in ${monthsText}`;
      } else {
        pattern = interval === 1 ? "Yearly" : `Every ${interval} years`;
      }
      break;
    default:
      pattern = "Recurring";
  }
  
  if (alarm.recurring_end_date) {
    pattern += ` until ${new Date(alarm.recurring_end_date).toLocaleDateString()}`;
  }
  
  return pattern;
};
