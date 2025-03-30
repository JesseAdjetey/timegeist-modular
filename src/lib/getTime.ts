
import dayjs from "dayjs";

export const isCurrentDay = (day: dayjs.Dayjs) => {
  return day.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
};

export const getMonth = (month = dayjs().month()) => {
  const year = dayjs().year();
  const firstDayofMonth = dayjs(new Date(year, month, 1)).startOf("month").day();

  let currentMonthCount = 0 - firstDayofMonth;

  return Array.from({ length: 5 }, () =>
    Array.from({ length: 7 }, () => {
      currentMonthCount++;
      return dayjs(new Date(year, month, currentMonthCount));
    })
  );
};

export const getWeekDays = (date: dayjs.Dayjs) => {
  const startOfWeek = date.startOf("week");
  const weekDates = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = startOfWeek.add(i, "day");
    weekDates.push({
      currentDate,
      today: currentDate.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD"),
    });
  }

  return weekDates;
};

export const getHours = Array.from({ length: 24 }, (_, i) =>
  dayjs().startOf("day").add(i, "hour")
);

// Properly define the isCurrentHour function
export const isCurrentHour = (hour: dayjs.Dayjs) => {
  const currentHour = dayjs().hour();
  return hour.hour() === currentHour && isCurrentDay(hour);
};
