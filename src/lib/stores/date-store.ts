
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import dayjs, { Dayjs } from "dayjs";
import { getMonth, getWeekDays } from "@/lib/getTime";

interface DateStoreType {
  userSelectedDate: Dayjs;
  setDate: (value: Dayjs) => void;
  twoDMonthArray: dayjs.Dayjs[][];
  selectedMonthIndex: number;
  setMonth: (index: number) => void;
  // Add these computed properties
  weekDates: { currentDate: dayjs.Dayjs; today: boolean }[];
  currentMonth: number;
}

export const useDateStore = create<DateStoreType>()(
  devtools(
    persist(
      (set, get) => ({
        userSelectedDate: dayjs(),
        setDate: (value: Dayjs) => {
          set({ userSelectedDate: value });
        },
        twoDMonthArray: getMonth(),
        selectedMonthIndex: dayjs().month(),
        setMonth: (index: number) => {
          set({twoDMonthArray: getMonth(index), selectedMonthIndex: index });
        },
        // Add getter for weekDates that uses userSelectedDate
        get weekDates() {
          return getWeekDays(get().userSelectedDate);
        },
        // Add getter for currentMonth
        get currentMonth() {
          return get().selectedMonthIndex;
        }
      }),
      { name: "date_data", skipHydration: true }
    )
  )
);
