
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { ModuleInstance, ModuleType, SidebarPage } from "./types";

interface SidebarStoreType {
  pages: SidebarPage[];
  currentPageIndex: number;
  addPage: (title: string) => void;
  setCurrentPage: (index: number) => void;
  addModule: (pageIndex: number, moduleType: ModuleType) => void;
  removeModule: (pageIndex: number, moduleIndex: number) => void;
  updatePageTitle: (pageIndex: number, title: string) => void;
  updateModuleTitle: (pageIndex: number, moduleIndex: number, title: string) => void;
  reorderModules: (pageIndex: number, fromIndex: number, toIndex: number) => void;
  toggleModuleMinimized: (pageIndex: number, moduleIndex: number) => void; // New method
}

export const useSidebarStore = create<SidebarStoreType>()(
  devtools(
    persist(
      (set, get) => ({
        pages: [
          {
            id: '1',
            title: 'Tasks',
            modules: [
              { type: 'todo', title: 'To-Do List' },
              { type: 'eisenhower', title: 'Eisenhower Matrix' }
            ]
          },
          {
            id: '2',
            title: 'Tools',
            modules: [
              { type: 'pomodoro', title: 'Pomodoro' },
              { type: 'alarms', title: 'Alarms' },
              { type: 'invites', title: 'Event Invites' }
            ]
          }
        ],
        currentPageIndex: 0,
        addPage: (title) => {
          set(state => ({
            pages: [...state.pages, {
              id: Date.now().toString(),
              title,
              modules: []
            }]
          }));
        },
        setCurrentPage: (index) => {
          set({ currentPageIndex: index });
        },
        addModule: (pageIndex, moduleType) => {
          set(state => {
            const newPages = [...state.pages];
            if (newPages[pageIndex]) {
              let defaultTitle = '';
              switch (moduleType) {
                case 'todo': defaultTitle = 'To-Do List'; break;
                case 'pomodoro': defaultTitle = 'Pomodoro'; break;
                case 'alarms': defaultTitle = 'Alarms'; break;
                case 'eisenhower': defaultTitle = 'Eisenhower Matrix'; break;
                case 'invites': defaultTitle = 'Event Invites'; break;
              }
              
              newPages[pageIndex].modules = [
                ...newPages[pageIndex].modules, 
                { type: moduleType, title: defaultTitle }
              ];
            }
            return { pages: newPages };
          });
        },
        removeModule: (pageIndex, moduleIndex) => {
          set(state => {
            const newPages = [...state.pages];
            if (newPages[pageIndex] && newPages[pageIndex].modules) {
              newPages[pageIndex].modules = newPages[pageIndex].modules.filter((_, i) => i !== moduleIndex);
            }
            return { pages: newPages };
          });
        },
        updatePageTitle: (pageIndex, title) => {
          set(state => {
            const newPages = [...state.pages];
            if (newPages[pageIndex]) {
              newPages[pageIndex].title = title;
            }
            return { pages: newPages };
          });
        },
        updateModuleTitle: (pageIndex, moduleIndex, title) => {
          set(state => {
            const newPages = [...state.pages];
            if (newPages[pageIndex] && newPages[pageIndex].modules[moduleIndex]) {
              newPages[pageIndex].modules[moduleIndex].title = title;
            }
            return { pages: newPages };
          });
        },
        reorderModules: (pageIndex, fromIndex, toIndex) => {
          set(state => {
            const newPages = [...state.pages];
            if (newPages[pageIndex] && newPages[pageIndex].modules) {
              const modules = [...newPages[pageIndex].modules];
              const [movedModule] = modules.splice(fromIndex, 1);
              modules.splice(toIndex, 0, movedModule);
              newPages[pageIndex].modules = modules;
            }
            return { pages: newPages };
          });
        },
        toggleModuleMinimized: (pageIndex, moduleIndex) => {
          set(state => {
            const newPages = [...state.pages];
            if (newPages[pageIndex] && newPages[pageIndex].modules[moduleIndex]) {
              const module = newPages[pageIndex].modules[moduleIndex];
              newPages[pageIndex].modules[moduleIndex] = {
                ...module,
                minimized: !module.minimized
              };
            }
            return { pages: newPages };
          });
        }
      }),
      { name: "sidebar_data", skipHydration: true }
    )
  )
);
