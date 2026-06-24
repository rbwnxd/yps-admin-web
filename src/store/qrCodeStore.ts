import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { QRCode, QRCodeHash, QRCodeCheckIn, QRCodeCategory } from "@/lib/types";

interface QRCodeStore {
  // QR 코드 관련 상태
  qrCodes: QRCode[];
  totalQRCount: number;
  qrLoading: boolean;
  currentQRPage: number;
  qrItemsPerPage: number;
  selectedCategory: "ALL" | QRCodeCategory | undefined;
  includeDeleted: boolean;
  includeDisabled: boolean;

  // QR 해시 관련 상태
  qrHashes: QRCodeHash[];
  totalHashCount: number;
  hashLoading: boolean;
  currentHashPage: number;
  hashItemsPerPage: number;
  hashIncludeDeleted: boolean;

  // 체크인 관련 상태
  checkIns: QRCodeCheckIn[];
  totalCheckInCount: number;
  checkInLoading: boolean;
  currentCheckInPage: number;
  checkInItemsPerPage: number;
  checkInIncludeDeleted: boolean;

  // QR 코드 액션
  setQRCodes: (qrCodes: QRCode[]) => void;
  setTotalQRCount: (count: number) => void;
  setQRLoading: (loading: boolean) => void;
  setCurrentQRPage: (page: number) => void;
  setSelectedCategory: (category: "ALL" | QRCodeCategory | undefined) => void;
  setIncludeDeleted: (includeDeleted: boolean) => void;
  setIncludeDisabled: (includeDisabled: boolean) => void;

  // QR 해시 액션
  setQRHashes: (hashes: QRCodeHash[]) => void;
  setTotalHashCount: (count: number) => void;
  setHashLoading: (loading: boolean) => void;
  setCurrentHashPage: (page: number) => void;
  setHashIncludeDeleted: (includeDeleted: boolean) => void;

  // 체크인 액션
  setCheckIns: (checkIns: QRCodeCheckIn[]) => void;
  setTotalCheckInCount: (count: number) => void;
  setCheckInLoading: (loading: boolean) => void;
  setCurrentCheckInPage: (page: number) => void;
  setCheckInIncludeDeleted: (includeDeleted: boolean) => void;

  // 헬퍼 함수
  findQRCodeById: (id: string) => QRCode | undefined;
  findQRHashById: (id: string) => QRCodeHash | undefined;
  findCheckInById: (id: string) => QRCodeCheckIn | undefined;
  addQRCode: (qrCode: QRCode) => void;
  addCheckIn: (checkIn: QRCodeCheckIn) => void;
  updateCheckIn: (id: string, updatedCheckIn: Partial<QRCodeCheckIn>) => void;
  removeCheckIn: (id: string) => void;
  updateQRCode: (id: string, updatedQRCode: Partial<QRCode>) => void;
  removeQRCode: (id: string) => void;

  // 리셋
  reset: () => void;
}

export const useQRCodeStore = create<QRCodeStore>()(
  persist(
    (set, get) => ({
      // QR 코드 초기 상태
      qrCodes: [],
      totalQRCount: 0,
      qrLoading: false,
      currentQRPage: 1,
      qrItemsPerPage: 10,
      selectedCategory: "ALL",
      includeDeleted: false,
      includeDisabled: false,

      // QR 해시 초기 상태
      qrHashes: [],
      totalHashCount: 0,
      hashLoading: false,
      currentHashPage: 1,
      hashItemsPerPage: 10,
      hashIncludeDeleted: false,

      // 체크인 초기 상태
      checkIns: [],
      totalCheckInCount: 0,
      checkInLoading: false,
      currentCheckInPage: 1,
      checkInItemsPerPage: 10,
      checkInIncludeDeleted: false,

      // QR 코드 액션
      setQRCodes: (qrCodes) => set({ qrCodes }),
      setTotalQRCount: (totalQRCount) => set({ totalQRCount }),
      setQRLoading: (qrLoading) => set({ qrLoading }),
      setCurrentQRPage: (currentQRPage) => set({ currentQRPage }),
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      setIncludeDeleted: (includeDeleted) => set({ includeDeleted }),
      setIncludeDisabled: (includeDisabled) => set({ includeDisabled }),

      // QR 해시 액션
      setQRHashes: (qrHashes) => set({ qrHashes }),
      setTotalHashCount: (totalHashCount) => set({ totalHashCount }),
      setHashLoading: (hashLoading) => set({ hashLoading }),
      setCurrentHashPage: (currentHashPage) => set({ currentHashPage }),
      setHashIncludeDeleted: (hashIncludeDeleted) =>
        set({ hashIncludeDeleted }),

      // 체크인 액션
      setCheckIns: (checkIns) => set({ checkIns }),
      setTotalCheckInCount: (totalCheckInCount) => set({ totalCheckInCount }),
      setCheckInLoading: (checkInLoading) => set({ checkInLoading }),
      setCurrentCheckInPage: (currentCheckInPage) =>
        set({ currentCheckInPage }),
      setCheckInIncludeDeleted: (checkInIncludeDeleted) =>
        set({ checkInIncludeDeleted }),

      // 헬퍼 함수
      findQRCodeById: (id) => {
        const { qrCodes } = get();
        return qrCodes.find((qr) => qr._id === id);
      },

      findQRHashById: (id) => {
        const { qrHashes } = get();
        return qrHashes.find((hash) => hash._id === id);
      },

      findCheckInById: (id) => {
        const { checkIns } = get();
        return checkIns.find((checkIn) => checkIn._id === id);
      },

      addQRCode: (qrCode) =>
        set((state) => ({
          qrCodes: [qrCode, ...state.qrCodes],
          totalQRCount: state.totalQRCount + 1,
        })),

      addCheckIn: (checkIn) =>
        set((state) => ({
          checkIns: [checkIn, ...state.checkIns],
          totalCheckInCount: state.totalCheckInCount + 1,
        })),

      updateCheckIn: (id, updatedCheckIn) =>
        set((state) => ({
          checkIns: state.checkIns.map((checkIn) =>
            checkIn._id === id ? { ...checkIn, ...updatedCheckIn } : checkIn,
          ),
        })),

      removeCheckIn: (id) =>
        set((state) => ({
          checkIns: state.checkIns.filter((checkIn) => checkIn._id !== id),
          totalCheckInCount: Math.max(0, state.totalCheckInCount - 1),
        })),

      updateQRCode: (id, updatedQRCode) =>
        set((state) => ({
          qrCodes: state.qrCodes.map((qr) =>
            qr._id === id ? { ...qr, ...updatedQRCode } : qr,
          ),
        })),

      removeQRCode: (id) =>
        set((state) => ({
          qrCodes: state.qrCodes.filter((qr) => qr._id !== id),
          totalQRCount: Math.max(0, state.totalQRCount - 1),
        })),

      reset: () =>
        set({
          qrCodes: [],
          totalQRCount: 0,
          qrLoading: false,
          currentQRPage: 1,
          selectedCategory: "ALL",
          qrHashes: [],
          totalHashCount: 0,
          hashLoading: false,
          currentHashPage: 1,
          checkIns: [],
          totalCheckInCount: 0,
          checkInLoading: false,
          currentCheckInPage: 1,
        }),
    }),
    {
      name: "qr-code-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        qrCodes: state.qrCodes,
        totalQRCount: state.totalQRCount,
        currentQRPage: state.currentQRPage,
        qrItemsPerPage: state.qrItemsPerPage,
        selectedCategory: state.selectedCategory,
        includeDeleted: state.includeDeleted,
        includeDisabled: state.includeDisabled,
        checkIns: state.checkIns,
        totalCheckInCount: state.totalCheckInCount,
        currentCheckInPage: state.currentCheckInPage,
        checkInItemsPerPage: state.checkInItemsPerPage,
      }),
    },
  ),
);
