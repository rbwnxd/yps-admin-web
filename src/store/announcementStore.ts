import { create } from "zustand";
import { Announcement } from "@/lib/types";
import { createJSONStorage, persist } from "zustand/middleware";

interface AnnouncementState {
  announcements: Announcement[];
  currentPage: number;
  totalCount: number;
  includeDeleted: boolean;
  includeUnpublished: boolean;
}

interface AnnouncementActions {
  setAnnouncements: (announcements: Announcement[]) => void;
  setCurrentPage: (page: number) => void;
  setTotalCount: (count: number) => void;
  resetPagination: () => void;
  setIncludeDeleted: (includeDeleted: boolean) => void;
  setIncludeUnpublished: (includeUnpublished: boolean) => void;
}

type AnnouncementStore = AnnouncementState & AnnouncementActions;

export const useAnnouncementStore = create<AnnouncementStore>()(
  persist(
    (set, get) => ({
      announcements: [],
      currentPage: 1,
      totalCount: 0,
      includeDeleted: false,
      includeUnpublished: true,
      setAnnouncements: (announcements: Announcement[]) => {
        set({ announcements });
      },
      setCurrentPage: (page: number) => {
        set({ currentPage: page });
      },
      setTotalCount: (count: number) => {
        set({ totalCount: count });
      },
      resetPagination: () => {
        set({ currentPage: 1, totalCount: 0 });
      },
      setIncludeDeleted: (includeDeleted: boolean) => {
        set({ includeDeleted });
      },
      setIncludeUnpublished: (includeUnpublished: boolean) => {
        set({ includeUnpublished });
      },
    }),
    {
      name: "announcement-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        announcements: state.announcements,
        currentPage: state.currentPage,
        totalCount: state.totalCount,
        includeDeleted: state.includeDeleted,
        includeUnpublished: state.includeUnpublished,
      }),
    }
  )
);
