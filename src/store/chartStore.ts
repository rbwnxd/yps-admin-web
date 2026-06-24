import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ChartItem } from "@/lib/types";

interface ChartStore {
  // 상태
  charts: ChartItem[];
  totalCount: number;
  isLoading: boolean;
  currentPage: number;
  itemsPerPage: number;
  includeDeleted: boolean;
  includeInactive: boolean;

  // 액션
  setCharts: (charts: ChartItem[]) => void;
  setTotalCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setCurrentPage: (page: number) => void;
  setIncludeDeleted: (includeDeleted: boolean) => void;
  setIncludeInactive: (includeInactive: boolean) => void;

  // 헬퍼 함수
  findChartById: (id: string) => ChartItem | undefined;
  addChart: (chart: ChartItem) => void;
  updateChart: (id: string, updatedChart: Partial<ChartItem>) => void;
  removeChart: (id: string) => void;

  // 리셋
  reset: () => void;
}

export const useChartStore = create<ChartStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      charts: [],
      totalCount: 0,
      isLoading: false,
      currentPage: 1,
      itemsPerPage: 10,
      includeDeleted: false,
      includeInactive: false,

      // 액션
      setCharts: (charts) => set({ charts }),
      setTotalCount: (totalCount) => set({ totalCount }),
      setLoading: (isLoading) => set({ isLoading }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      setIncludeDeleted: (includeDeleted) => set({ includeDeleted }),
      setIncludeInactive: (includeInactive) => set({ includeInactive }),

      // 헬퍼 함수
      findChartById: (id) => {
        const { charts } = get();
        return charts.find((chart) => chart._id === id);
      },

      addChart: (chart) =>
        set((state) => ({
          charts: [chart, ...state.charts],
          totalCount: state.totalCount + 1,
        })),

      updateChart: (id, updatedChart) =>
        set((state) => ({
          charts: state.charts.map((chart) =>
            chart._id === id ? { ...chart, ...updatedChart } : chart
          ),
        })),

      removeChart: (id) =>
        set((state) => ({
          charts: state.charts.filter((chart) => chart._id !== id),
          totalCount: Math.max(0, state.totalCount - 1),
        })),

      reset: () =>
        set({
          charts: [],
          totalCount: 0,
          isLoading: false,
          currentPage: 1,
        }),
    }),
    {
      name: "chart-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      // 일부 상태만 persist (isLoading 같은 UI 상태는 제외)
      partialize: (state) => ({
        charts: state.charts,
        totalCount: state.totalCount,
        currentPage: state.currentPage,
        itemsPerPage: state.itemsPerPage,
        includeDeleted: state.includeDeleted,
        includeInactive: state.includeInactive,
      }),
      // SSR 환경에서 하이드레이션 이슈 방지
      skipHydration: true,
    }
  )
);
