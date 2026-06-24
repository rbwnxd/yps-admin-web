"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Image,
  Users,
  FileText,
  User2,
  MoreHorizontal,
  Sun,
  Moon,
  Megaphone,
  Star,
  QrCode,
  BarChart3,
  Gift,
  Shield,
  Coins,
  Users2,
  CalendarHeart,
  Bell,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useUserManagementStore } from "@/store/userManagementStore";
import { useArtistStore } from "@/store/artistStore";
import { useQRCodeStore } from "@/store/qrCodeStore";
import { useChartStore } from "@/store/chartStore";
import { useAnnouncementStore } from "@/store/announcementStore";
import { usePointModificationStore } from "@/store/pointModificationStore";
import { useAnniversaryRewardPolicyStore } from "@/store/anniversaryRwardPolicyStore";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "../ui/sidebar";
import { useTheme } from "next-themes";

const menuItems = [
  {
    title: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "사용자 관리",
    href: "/dashboard/users",
    icon: Users2,
  },
  {
    title: "앱 관리자",
    href: "/dashboard/app-admin",
    icon: Shield,
  },
  {
    title: "아티스트 관리",
    href: "/dashboard/artists",
    icon: Star,
  },

  {
    title: "QR 코드 관리",
    href: "/dashboard/qr-codes",
    icon: QrCode,
  },
  {
    title: "차트 관리",
    href: "/dashboard/charts",
    icon: BarChart3,
  },
  {
    title: "공지사항 관리",
    href: "/dashboard/announcements",
    icon: Megaphone,
  },
  {
    title: "특전 관리",
    href: "/dashboard/benefits",
    icon: Gift,
  },
  {
    title: "포인트 지급 관리",
    href: "/dashboard/point-modifications",
    icon: Coins,
  },
  {
    title: "기념 리워드 정책 관리",
    href: "/dashboard/anniversary-reward-policies",
    icon: CalendarHeart,
  },
  {
    title: "약관 관리",
    href: "/dashboard/terms",
    icon: FileText,
  },
  {
    title: "알림 관리",
    href: "/dashboard/notifications",
    icon: Bell,
  },
];

interface SidebarProps {
  className?: string;
}

export function CustomSidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { setTheme, theme } = useTheme();

  // Store 리셋 함수들
  const resetUserPagination = useUserManagementStore(
    (state) => state.resetPagination,
  );
  const resetArtistPagination = useArtistStore(
    (state) => state.resetPagination,
  );
  const resetQRCode = useQRCodeStore((state) => state.reset);
  const resetChart = useChartStore((state) => state.reset);
  const resetAnnouncementPagination = useAnnouncementStore(
    (state) => state.resetPagination,
  );
  const resetPointModificationPagination = usePointModificationStore(
    (state) => state.resetPagination,
  );
  const resetAnniversaryRewardPolicyPagination =
    useAnniversaryRewardPolicyStore((state) => state.resetPagination);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 메뉴 클릭 시 페이지 리셋 핸들러
  const handleMenuClick = (href: string) => {
    // 현재 경로와 클릭한 경로가 같으면 초기화하지 않음
    if (pathname.startsWith(href)) {
      return;
    }

    switch (href) {
      case "/dashboard/users":
        resetUserPagination();
        break;
      case "/dashboard/artists":
        resetArtistPagination();
        break;
      case "/dashboard/qr-codes":
        resetQRCode();
        break;
      case "/dashboard/charts":
        resetChart();
        break;
      case "/dashboard/announcements":
        resetAnnouncementPagination();
        break;
      case "/dashboard/point-modifications":
        resetPointModificationPagination();
        break;
      case "/dashboard/anniversary-reward-policies":
        resetAnniversaryRewardPolicyPagination();
        break;
      default:
        break;
    }
  };

  return (
    <Sidebar collapsible="icon" className={className}>
      {/* 헤더 */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard">
              <SidebarMenuButton size="lg" asChild>
                <div>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-900 text-sidebar-primary-foreground">
                    <span className="text-center font-bold text-lg">Y</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">YPS Admin</span>
                    <span className="truncate text-xs">관리자 대시보드</span>
                  </div>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 사용자 정보 */}
      {user && (
        <SidebarGroup>
          <SidebarGroupLabel>사용자 정보</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <User2 className="h-4 w-4" />
                  <span>{user.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* 메뉴 아이템 */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item?.href?.split("/")?.length > 2
                    ? pathname.includes(item.href)
                    : pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        onClick={() => handleMenuClick(item.href)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 하단 버튼들 */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {/* <Settings className="h-4 w-4" /> */}
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 dark:hidden" />
              <Moon className="h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 hidden dark:block" />
              <span className="flex items-center justify-between w-full">
                <span>테마 변경</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>로그아웃</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
