"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { AppAdminUser, AppAdminUserUpdateForm } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Shield, ArrowLeft, Edit, Save } from "lucide-react";
import { getAppAdminUser, updateAppAdminUser } from "../../actions";
import { toast } from "sonner";

const AVAILABLE_PERMISSIONS = ["CANCEL_QR_CODE_VERIFICATION"];

export default function EditAppAdminUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  const [appAdminUser, setAppAdminUser] = useState<AppAdminUser | null>(null);
  const [form, setForm] = useState<AppAdminUserUpdateForm>({
    password: "",
    permissions: [],
    name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!jsonWebToken || !params.id) return;

    const fetchAppAdminUser = async () => {
      setIsFetching(true);
      try {
        const result = await getAppAdminUser({
          appAdminUserId: params.id,
          jsonWebToken,
        });

        if (result) {
          setAppAdminUser(result.appAdminUser);
          setForm({
            password: "",
            permissions: result.appAdminUser.permissions || [],
            name: result.appAdminUser.name,
          });
        }
      } catch (error) {
        console.error("App admin user fetch error:", error);
        toast.error("앱 관리자 정보를 가져올 수 없습니다.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchAppAdminUser();
  }, [jsonWebToken, params.id]);

  const handleInputChange = (
    field: keyof AppAdminUserUpdateForm,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissions: checked
        ? [...(prev.permissions || []), permission]
        : (prev.permissions || []).filter((p) => p !== permission),
    }));
  };

  const handleSubmit = async () => {
    if (!jsonWebToken || !appAdminUser) {
      toast.error("인증이 필요합니다.");
      return;
    }

    if (form.name && (form.name.length < 2 || form.name.length > 20)) {
      toast.error("이름은 2-20자 사이여야 합니다.");
      return;
    }

    if (
      form.password &&
      (form.password.length < 8 || form.password.length > 20)
    ) {
      toast.error("비밀번호는 8-20자 사이여야 합니다.");
      return;
    }

    // 변경된 필드만 전송
    const updateData: AppAdminUserUpdateForm = {};

    if (form.password && form.password.trim()) {
      updateData.password = form.password.trim();
    }

    if (form.name && form.name.trim() !== appAdminUser.name) {
      updateData.name = form.name.trim();
    }

    if (form.permissions) {
      updateData.permissions = form.permissions;
    }

    // 변경사항이 없으면 알림
    if (Object.keys(updateData).length === 0) {
      toast.info("변경된 사항이 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateAppAdminUser({
        appAdminUserId: appAdminUser._id,
        body: updateData,
        jsonWebToken,
      });

      if (result) {
        toast.success("앱 관리자 정보가 성공적으로 수정되었습니다.");
        router.push(`/dashboard/app-admin/${appAdminUser._id}`);
      }
    } catch (error) {
      console.error("Update app admin user error:", error);
      toast.error("앱 관리자 정보 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
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
            <Shield className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              앱 관리자를 찾을 수 없습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl">
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
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Edit className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">앱 관리자 수정</h1>
          <p className="text-muted-foreground">
            {appAdminUser.name}({appAdminUser.account}) 정보를 수정합니다
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="account" className="text-sm font-medium">
                계정 ID
              </Label>
              <Input
                id="account"
                value={appAdminUser.account}
                disabled
                className="mt-1 bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                계정 ID는 변경할 수 없습니다.
              </p>
            </div>

            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                이름 (2-20자)
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="이름을 입력하세요"
                disabled={isLoading}
                className="mt-1"
                minLength={2}
                maxLength={20}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                새 비밀번호 (8-20자, 선택사항)
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="새 비밀번호를 입력하세요 (변경시에만)"
                disabled={isLoading}
                className="mt-1"
                minLength={8}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground mt-1">
                비밀번호를 변경하지 않으려면 비워두세요.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 권한 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>권한 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">
                사용 가능한 권한
              </Label>
              <div className="space-y-2">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div
                    key={permission}
                    className="flex items-center justify-between"
                  >
                    <Label htmlFor={permission} className="text-sm font-normal">
                      {permission}
                    </Label>
                    <Switch
                      id={permission}
                      checked={(form.permissions || []).includes(permission)}
                      onCheckedChange={(checked: boolean) =>
                        handlePermissionChange(permission, checked)
                      }
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>
              {AVAILABLE_PERMISSIONS.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  현재 설정 가능한 권한이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? "저장 중..." : "변경사항 저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
