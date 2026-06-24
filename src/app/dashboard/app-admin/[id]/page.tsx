"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { AppAdminUser } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  User,
  ArrowLeft,
  Edit,
  UserMinus,
  Trash2,
  Shield,
  Copy,
  Calendar,
} from "lucide-react";
import {
  getAppAdminUser,
  deleteAppAdminUser,
  disableAppAdminUser,
  enableAppAdminUser,
} from "../actions";
import { toast } from "sonner";
import moment from "moment";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";

export default function AppAdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  const [appAdminUser, setAppAdminUser] = useState<AppAdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 삭제 확인 다이얼로그 상태
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    isLoading: false,
  });

  // 비활성화 확인 다이얼로그 상태
  const [disableDialog, setDisableDialog] = useState({
    open: false,
    isLoading: false,
  });

  // 활성화 확인 다이얼로그 상태
  const [enableDialog, setEnableDialog] = useState({
    open: false,
    isLoading: false,
  });

  useEffect(() => {
    if (!jsonWebToken || !params.id) return;

    const fetchAppAdminUser = async () => {
      setIsLoading(true);
      try {
        const result = await getAppAdminUser({
          appAdminUserId: params.id,
          jsonWebToken,
        });

        if (result) {
          setAppAdminUser(result.appAdminUser);
        }
      } catch (error) {
        console.error("App admin user fetch error:", error);
        toast.error("앱 관리자 정보를 가져올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppAdminUser();
  }, [jsonWebToken, params.id]);

  const handleDisableUser = async () => {
    if (!jsonWebToken || !appAdminUser) return;

    setDisableDialog((prev) => ({ ...prev, isLoading: true }));

    try {
      await disableAppAdminUser({
        appAdminUserId: appAdminUser._id,
        jsonWebToken,
      });

      toast.success("앱 관리자가 비활성화되었습니다.");
      setAppAdminUser({ ...appAdminUser, isEnabled: false });

      // 다이얼로그 닫기
      setDisableDialog({
        open: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Disable user error:", error);
      toast.error("사용자 비활성화에 실패했습니다.");
      setDisableDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleEnableUser = async () => {
    if (!jsonWebToken || !appAdminUser) return;

    setEnableDialog((prev) => ({ ...prev, isLoading: true }));

    try {
      await enableAppAdminUser({
        appAdminUserId: appAdminUser._id,
        jsonWebToken,
      });

      toast.success("앱 관리자가 활성화되었습니다.");
      setAppAdminUser({ ...appAdminUser, isEnabled: true });

      // 다이얼로그 닫기
      setEnableDialog({
        open: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Enable user error:", error);
      toast.error("사용자 활성화에 실패했습니다.");
      setEnableDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteUser = async () => {
    if (!jsonWebToken || !appAdminUser) return;

    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));

    try {
      await deleteAppAdminUser({
        appAdminUserId: appAdminUser._id,
        jsonWebToken,
      });

      toast.success("앱 관리자가 삭제되었습니다.");
      router.push("/dashboard/app-admin");
    } catch (error) {
      console.error("Delete user error:", error);
      toast.error("사용자 삭제에 실패했습니다.");
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const openDeleteDialog = () => {
    setDeleteDialog({
      open: true,
      isLoading: false,
    });
  };

  const openDisableDialog = () => {
    setDisableDialog({
      open: true,
      isLoading: false,
    });
  };

  const openEnableDialog = () => {
    setEnableDialog({
      open: true,
      isLoading: false,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p>로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!appAdminUser) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <User className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              앱 관리자를 찾을 수 없습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/app-admin/${appAdminUser._id}/edit`)
            }
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            수정
          </Button>

          {appAdminUser.isEnabled && !appAdminUser.deletedAt && (
            <Button
              variant="outline"
              onClick={openDisableDialog}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
            >
              <UserMinus className="w-4 h-4" />
              비활성화
            </Button>
          )}
          {!appAdminUser.isEnabled && !appAdminUser.deletedAt && (
            <Button
              variant="outline"
              onClick={openEnableDialog}
              className="flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <UserMinus className="w-4 h-4" />
              활성화
            </Button>
          )}

          {!appAdminUser.deletedAt && (
            <Button
              variant="destructive"
              onClick={openDeleteDialog}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </Button>
          )}
        </div>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">{appAdminUser.name}</h1>
          <p className="text-muted-foreground">앱 관리자 상세 정보</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                ID
              </Label>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{appAdminUser._id}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(appAdminUser._id);
                    toast.success("ID가 클립보드에 복사되었습니다.");
                  }}
                  className="h-6 w-6 p-0 cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  이름
                </Label>
                <p className="text-lg font-semibold">{appAdminUser.name}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  계정 ID
                </Label>
                <p className="text-lg font-semibold">{appAdminUser.account}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  상태
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={appAdminUser.isEnabled ? "default" : "secondary"}
                  >
                    {appAdminUser.isEnabled ? "활성화" : "비활성화"}
                  </Badge>
                  {appAdminUser.deletedAt && (
                    <Badge variant="destructive">삭제됨</Badge>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  권한
                </Label>
                <div className="flex flex-wrap gap-1">
                  {appAdminUser.permissions &&
                  appAdminUser.permissions.length > 0 ? (
                    appAdminUser.permissions.map((permission) => (
                      <Badge key={permission} variant="outline">
                        {permission}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">권한 없음</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 날짜 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              날짜 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  생성일
                </Label>
                <p className="font-medium">
                  {moment(appAdminUser.createdAt).format(
                    "YYYY년 MM월 DD일 HH:mm"
                  )}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  수정일
                </Label>
                <p className="font-medium">
                  {moment(appAdminUser.updatedAt).format(
                    "YYYY년 MM월 DD일 HH:mm"
                  )}
                </p>
              </div>

              {appAdminUser.deletedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    삭제일
                  </Label>
                  <p className="font-medium text-red-600">
                    {moment(appAdminUser.deletedAt).format(
                      "YYYY년 MM월 DD일 HH:mm"
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({
              open: false,
              isLoading: false,
            });
          }
        }}
        title="앱 관리자 삭제"
        description={`정말로 "${appAdminUser?.name}" 앱 관리자를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`}
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
              isLoading: false,
            });
          }
        }}
        title="앱 관리자 비활성화"
        description={`"${appAdminUser?.name}" 앱 관리자를 비활성화하시겠습니까?\n비활성화된 관리자는 로그인할 수 없습니다.`}
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
              isLoading: false,
            });
          }
        }}
        title="앱 관리자 활성화"
        description={`"${appAdminUser?.name}" 앱 관리자를 활성화하시겠습니까?`}
        confirmText="활성화"
        cancelText="취소"
        onConfirm={handleEnableUser}
        isLoading={enableDialog.isLoading}
      />
    </div>
  );
}
