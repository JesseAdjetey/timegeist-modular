
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import dayjs, { Dayjs } from "dayjs";
import { getMonth } from "@/lib/getTime";

interface DateStoreType {
  userSelectedDate: Dayjs;
  setDate: (value: Dayjs) => void;
  twoDMonthArray: dayjs.Dayjs[][];
  selectedMonthIndex: number;
  setMonth: (index: number) => void;
}

export const useDateStore = create<DateStoreType>()(
  devtools(
    persist(
      (set) => ({
        userSelectedDate: dayjs(),
        setDate: (value: Dayjs) => {
          set({ userSelectedDate: value });
        },
        twoDMonthArray: getMonth(),
        selectedMonthIndex: dayjs().month(),
        setMonth: (index: number) => {
          set({twoDMonthArray: getMonth(index), selectedMonthIndex: index });
        },
      }),
      { name: "date_data", skipHydration: true }
    )
  )
);
