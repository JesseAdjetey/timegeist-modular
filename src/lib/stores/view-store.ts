
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface ViewStoreType {
  selectedView: string;
  setView: (value: string) => void;
}

export const useViewStore = create<ViewStoreType>()(
  devtools(
    persist(
      (set) => ({
        selectedView: "Week",
        setView: (value: string) => {
          set({ selectedView: value });
        },
      }),
      { name: "calendar_view", skipHydration: true }
    )
  )
);
