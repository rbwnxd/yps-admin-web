import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AnniversaryRewardPolicy } from "@/lib/types";

interface AnniversaryRewardPolicyStore {
  // QR 코드 관련 상태
  policies: AnniversaryRewardPolicy[];
  totalPolicyCount: number;
  policyLoading: boolean;
  currentPolicyPage: number;
  policyItemsPerPage: number;
  includeDeleted: boolean;
  includeDisabled: boolean;

  // QR 코드 액션
  setPolicies: (policies: AnniversaryRewardPolicy[]) => void;
  setTotalPolicyCount: (count: number) => void;
  setPolicyLoading: (loading: boolean) => void;
  setCurrentPolicyPage: (page: number) => void;
  setIncludeDeleted: (includeDeleted: boolean) => void;
  setIncludeDisabled: (includeDisabled: boolean) => void;
  resetPagination: () => void;
}

export const useAnniversaryRewardPolicyStore =
  create<AnniversaryRewardPolicyStore>()(
    persist(
      (set, get) => ({
        policies: [],
        totalPolicyCount: 0,
        policyLoading: false,
        currentPolicyPage: 1,
        policyItemsPerPage: 10,
        includeDeleted: false,
        includeDisabled: true,

        // QR 코드 액션
        setPolicies: (policies) => set({ policies }),
        setTotalPolicyCount: (totalPolicyCount) => set({ totalPolicyCount }),
        setPolicyLoading: (policyLoading) => set({ policyLoading }),
        setCurrentPolicyPage: (currentPolicyPage) => set({ currentPolicyPage }),
        setIncludeDeleted: (includeDeleted) => set({ includeDeleted }),
        setIncludeDisabled: (includeDisabled) => set({ includeDisabled }),
        resetPagination: () => set({ currentPolicyPage: 1 }),
      }),
      {
        name: "anniversary-reward-policy-storage",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          policies: state.policies,
          totalPolicyCount: state.totalPolicyCount,
          policyLoading: state.policyLoading,
          currentPolicyPage: state.currentPolicyPage,
          policyItemsPerPage: state.policyItemsPerPage,
          includeDeleted: state.includeDeleted,
          includeDisabled: state.includeDisabled,
        }),
      }
    )
  );
