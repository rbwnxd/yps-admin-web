import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { axiosApi } from "@/lib/axios";

interface User {
  _id: string;
  name: string;
  account?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
}

interface AuthActions {
  login: (credentials: {
    account: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      // 로그인
      login: async (credentials) => {
        try {
          set({ isLoading: true });
          const response = await axiosApi(
            "/admin/web/signIn",
            "POST",
            credentials
          );

          const { webAdminUser, jsonWebToken } = response.data.data;

          // localStorage에 토큰 저장 (axios 인터셉터에서 사용)
          localStorage.setItem("auth-token", jsonWebToken);

          // 🍪 미들웨어에서 확인할 수 있도록 쿠키에도 저장
          if (credentials.rememberMe) {
            document.cookie = `adminToken=${jsonWebToken}; path=/; secure; samesite=strict;`;
          } else {
            document.cookie = `adminToken=${jsonWebToken}; path=/; secure; samesite=strict; max-age=86400`; // 24시간
          }

          set({
            user: webAdminUser,
            token: jsonWebToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // 로그아웃
      logout: async () => {
        localStorage.removeItem("auth-token");

        // 🍪 쿠키도 함께 삭제
        document.cookie =
          "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // 🔄 미들웨어를 통과했다면 인증된 상태로 설정
      checkAuth: () => {
        const { token, user } = get();

        // localStorage에 토큰과 사용자 정보가 있으면 인증됨으로 설정
        if (token && user) {
          set({ isAuthenticated: true });
        } else {
          set({ isAuthenticated: false });
        }
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      // 로딩 상태 설정
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "auth-storage", // localStorage 키
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Storage 로딩 완료 시 hasHydrated를 true로 설정
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
