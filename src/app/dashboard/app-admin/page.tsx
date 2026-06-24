"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { AppAdminUser } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Users,
  Plus,
  Edit,
  UserMinus,
  Trash2,
  Loader2,
  MoreHorizontal,
  UserPlus,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getAppAdminUsers,
  deleteAppAdminUser,
  disableAppAdminUser,
  enableAppAdminUser,
} from "./actions";
import { toast } from "sonner";
import moment from "moment";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AppAdminPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  const [appAdminUsers, setAppAdminUsers] = useState<AppAdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [includeDisabled, setIncludeDisabled] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // 삭제 확인 다이얼로그 상태
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    isLoading: boolean;
  }>({
    open: false,
    userId: "",
    userName: "",
    isLoading: false,
  });

  // 비활성화 확인 다이얼로그 상태
  const [disableDialog, setDisableDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    isLoading: boolean;
  }>({
    open: false,
    userId: "",
    userName: "",
    isLoading: false,
  });

  // 활성화 확인 다이얼로그 상태
  const [enableDialog, setEnableDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    isLoading: boolean;
  }>({
    open: false,
    userId: "",
    userName: "",
    isLoading: false,
  });

  const itemsPerPage = 10;

  useEffect(() => {
    if (!jsonWebToken) return;

    const fetchAppAdminUsers = async () => {
      setIsLoading(true);
      try {
        const result = await getAppAdminUsers({
          params: {
            __skip: (currentPage - 1) * itemsPerPage,
            __limit: itemsPerPage,
            __includeDisabled: includeDisabled,
            __includeDeleted: includeDeleted,
          },
          jsonWebToken,
        });

        if (result) {
          setAppAdminUsers(result.appAdminUsers || []);
          setTotalCount(result.count || 0);
        }
      } catch (error) {
        console.error("App admin users fetch error:", error);
        toast.error("앱 관리자 목록을 가져올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppAdminUsers();
  }, [
    jsonWebToken,
    currentPage,
    itemsPerPage,
    includeDisabled,
    includeDeleted,
  ]);

  const handleDisableUser = async () => {
    if (!jsonWebToken || !disableDialog.userId) return;

    setDisableDialog((prev) => ({ ...prev, isLoading: true }));

    try {
      await disableAppAdminUser({
        appAdminUserId: disableDialog.userId,
        jsonWebToken,
      });

      toast.success("앱 관리자가 비활성화되었습니다.");
      // 목록 새로고침
      setAppAdminUsers((prev) =>
        prev.map((user) =>
          user._id === disableDialog.userId
            ? { ...user, isEnabled: false }
            : user
        )
      );

      // 다이얼로그 닫기
      setDisableDialog({
        open: false,
        userId: "",
        userName: "",
        isLoading: false,
      });
    } catch (error) {
      console.error("Disable user error:", error);
      toast.error("사용자 비활성화에 실패했습니다.");
      setDisableDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleEnableUser = async () => {
    if (!jsonWebToken || !enableDialog.userId) return;

    setEnableDialog((prev) => ({ ...prev, isLoading: true }));

    try {
      await enableAppAdminUser({
        appAdminUserId: enableDialog.userId,
        jsonWebToken,
      });

      toast.success("앱 관리자가 활성화되었습니다.");
      // 목록 새로고침
      setAppAdminUsers((prev) =>
        prev.map((user) =>
          user._id === enableDialog.userId ? { ...user, isEnabled: true } : user
        )
      );

      // 다이얼로그 닫기
      setEnableDialog({
        open: false,
        userId: "",
        userName: "",
        isLoading: false,
      });
    } catch (error) {
      console.error("Enable user error:", error);
      toast.error("사용자 활성화에 실패했습니다.");
      setEnableDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteUser = async () => {
    if (!jsonWebToken || !deleteDialog.userId) return;

    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));

    try {
      await deleteAppAdminUser({
        appAdminUserId: deleteDialog.userId,
        jsonWebToken,
      });

      toast.success("앱 관리자가 삭제되었습니다.");
      // 목록 새로고침
      setAppAdminUsers((prev) =>
        prev.map((user) =>
          user._id === deleteDialog.userId
            ? { ...user, deletedAt: new Date().toISOString() }
            : user
        )
      );

      // 다이얼로그 닫기
      setDeleteDialog({
        open: false,
        userId: "",
        userName: "",
        isLoading: false,
      });
    } catch (error) {
      console.error("Delete user error:", error);
      toast.error("사용자 삭제에 실패했습니다.");
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const openDeleteDialog = (userId: string, userName: string) => {
    setDeleteDialog({
      open: true,
      userId,
      userName,
      isLoading: false,
    });
  };

  const openDisableDialog = (userId: string, userName: string) => {
    setDisableDialog({
      open: true,
      userId,
      userName,
      isLoading: false,
    });
  };

  const openEnableDialog = (userId: string, userName: string) => {
    setEnableDialog({
      open: true,
      userId,
      userName,
      isLoading: false,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="container mx-auto">
      <div className="flex md:flex-row flex-col md:items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">앱 관리자 관리</h1>
            <p className="text-muted-foreground">
              앱 관리자 계정을 생성하고 관리합니다
            </p>
          </div>
        </div>

        <Button
          onClick={() => router.push("/dashboard/app-admin/create")}
          className="flex items-center gap-2 md:mt-0 mt-4"
        >
          <Plus className="w-4 h-4" />새 앱 관리자 생성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>앱 관리자 목록 ({totalCount})</CardTitle>
          <div className="flex flex-col lg:flex-row w-full items-end justify-end mt-2 gap-4">
            <div className="space-y-2">
              <div key={"includeDeleted"} className="flex items-center gap-2">
                <Label
                  htmlFor={"includeDeleted"}
                  className="text-sm font-normal"
                >
                  {"삭제 유저 포함"}
                </Label>
                <Switch
                  id={"includeDeleted"}
                  checked={includeDeleted}
                  onCheckedChange={(checked: boolean) =>
                    setIncludeDeleted(checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div
                key={"includeUnpublished"}
                className="flex items-center gap-2"
              >
                <Label
                  htmlFor={"includeUnpublished"}
                  className="text-sm font-normal"
                >
                  {"비활성화 유저 포함"}
                </Label>
                <Switch
                  id={"includeDisabled"}
                  checked={includeDisabled}
                  onCheckedChange={(checked: boolean) =>
                    setIncludeDisabled(checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p>로딩 중...</p>
              </div>
            </div>
          ) : appAdminUsers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Users className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">
                  등록된 앱 관리자가 없습니다
                </p>
                <p className="text-sm text-muted-foreground">
                  새 앱 관리자를 생성해보세요.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {appAdminUsers.map((user) => (
                <div
                  key={user._id}
                  className={`border rounded-lg p-4 hover:bg-muted/30 transition-colors ${
                    !user.deletedAt ? "cursor-pointer" : "cursor-default"
                  }`}
                  onClick={() =>
                    !user.deletedAt &&
                    router.push(`/dashboard/app-admin/${user._id}`)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <Badge
                          variant={user.isEnabled ? "default" : "secondary"}
                        >
                          {user.isEnabled ? "활성화" : "비활성화"}
                        </Badge>
                        {user.deletedAt && (
                          <Badge variant="destructive">삭제됨</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        ID: {user._id}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        계정: {user.account}
                      </p>

                      <div className="flex flex-col md:flex-row gap-1 md:gap-4 text-xs text-muted-foreground">
                        <span>
                          생성일:{" "}
                          {moment(user.createdAt).format("YYYY-MM-DD HH:mm")}
                        </span>
                        <span>
                          수정일:{" "}
                          {moment(user.updatedAt).format("YYYY-MM-DD HH:mm")}
                        </span>
                        {user.deletedAt && (
                          <span>
                            삭제일:{" "}
                            {moment(user.deletedAt).format("YYYY-MM-DD HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>

                    {!user.deletedAt && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="sr-only">메뉴 열기</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/app-admin/${user._id}/edit`
                              );
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            수정
                          </DropdownMenuItem>

                          {user.isEnabled && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openDisableDialog(user._id, user.name);
                              }}
                              className="text-orange-600"
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              비활성화
                            </DropdownMenuItem>
                          )}
                          {!user.isEnabled && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openEnableDialog(user._id, user.name);
                              }}
                              className="text-green-600"
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              활성화
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(user._id, user.name);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage <= 1}
                      className="h-9 w-9"
                      title="첫 페이지"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="h-9 w-9"
                      title="이전 페이지"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNumber =
                      Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                      i;
                    if (pageNumber > totalPages) return null;

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="h-9 w-9"
                      title="다음 페이지"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage >= totalPages}
                      className="h-9 w-9"
                      title="마지막 페이지"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({
              open: false,
              userId: "",
              userName: "",
              isLoading: false,
            });
          }
        }}
        title="앱 관리자 삭제"
        description={`정말로 "${deleteDialog.userName}" 앱 관리자를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        variant="destructive"
        onConfirm={handleDeleteUser}
        isLoading={deleteDialog.isLoading}
      />

      {/* 비활성화 확인 다이얼로그 */}
      <ConfirmDialog
        open={disableDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDisableDialog({
              open: false,
              userId: "",
              userName: "",
              isLoading: false,
            });
          }
        }}
        title="앱 관리자 비활성화"
        description={`"${disableDialog.userName}" 앱 관리자를 비활성화하시겠습니까?\n비활성화된 관리자는 로그인할 수 없습니다.`}
        confirmText="비활성화"
        cancelText="취소"
        variant="destructive"
        onConfirm={handleDisableUser}
        isLoading={disableDialog.isLoading}
      />

      {/* 활성화 확인 다이얼로그 */}
      <ConfirmDialog
        open={enableDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setEnableDialog({
              open: false,
              userId: "",
              userName: "",
              isLoading: false,
            });
          }
        }}
        title="앱 관리자 활성화"
        description={`"${enableDialog.userName}" 앱 관리자를 활성화하시겠습니까?`}
        confirmText="활성화"
        cancelText="취소"
        variant="default"
        onConfirm={handleEnableUser}
        isLoading={enableDialog.isLoading}
      />
    </div>
  );
}
