import { create } from "zustand";
import { User } from "@/lib/types";

interface UserManagementState {
  users: User[];
  totalCount: number;
  loading: boolean;
  currentPage: number;
  itemsPerPage: number;
  searchNickname: string;
  includeDeleted: boolean;

  // Actions
  setUsers: (users: User[]) => void;
  setTotalCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setCurrentPage: (page: number) => void;
  setSearchNickname: (nickname: string) => void;
  setIncludeDeleted: (includeDeleted: boolean) => void;
  resetPagination: () => void;
  findUserById: (id: string) => User | null;
}

export const useUserManagementStore = create<UserManagementState>(
  (set, get) => ({
    users: [],
    totalCount: 0,
    loading: false,
    currentPage: 1,
    itemsPerPage: 10,
    searchNickname: "",
    includeDeleted: false,

    setUsers: (users) => set({ users }),
    setTotalCount: (totalCount) => set({ totalCount }),
    setLoading: (loading) => set({ loading }),
    setCurrentPage: (currentPage) => set({ currentPage }),
    setSearchNickname: (searchNickname) => set({ searchNickname }),
    setIncludeDeleted: (includeDeleted) => set({ includeDeleted }),
    resetPagination: () => set({ currentPage: 1, searchNickname: "" }),

    findUserById: (id) => {
      const { users } = get();
      return users.find((user) => user._id === id) || null;
    },
  })
);
