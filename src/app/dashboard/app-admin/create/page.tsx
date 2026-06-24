"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { AppAdminUserForm } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { createAppAdminUser } from "../actions";
import { toast } from "sonner";

export default function CreateAppAdminPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  const [form, setForm] = useState<AppAdminUserForm>({
    account: "",
    password: "",
    name: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof AppAdminUserForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!jsonWebToken) {
      toast.error("인증이 필요합니다.");
      return;
    }

    if (!form.account.trim()) {
      toast.error("계정 ID를 입력해주세요.");
      return;
    }

    if (!form.password.trim()) {
      toast.error("비밀번호를 입력해주세요.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }

    if (form.account.length < 4 || form.account.length > 20) {
      toast.error("계정 ID는 4-20자 사이여야 합니다.");
      return;
    }

    if (form.password.length < 8 || form.password.length > 20) {
      toast.error("비밀번호는 8-20자 사이여야 합니다.");
      return;
    }

    if (form.name.length < 2 || form.name.length > 20) {
      toast.error("이름은 2-20자 사이여야 합니다.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createAppAdminUser({
        body: {
          account: form.account.trim(),
          password: form.password.trim(),
          name: form.name.trim(),
        },
        jsonWebToken,
      });

      if (result) {
        toast.success("앱 관리자가 성공적으로 생성되었습니다.");
        router.replace("/dashboard/app-admin");
      }
    } catch (error) {
      console.error("Create app admin user error:", error);
      toast.error("앱 관리자 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

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
        <UserPlus className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">새 앱 관리자 생성</h1>
          <p className="text-muted-foreground">
            새로운 앱 관리자 계정을 생성합니다
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>앱 관리자 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="account" className="text-sm font-medium">
              계정 ID (4-20자) *
            </Label>
            <Input
              id="account"
              value={form.account}
              onChange={(e) => handleInputChange("account", e.target.value)}
              placeholder="admin123"
              disabled={isLoading}
              className="mt-1"
              minLength={4}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground mt-1">
              영문, 숫자 조합으로 4-20자 사이로 입력해주세요.
            </p>
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              비밀번호 (8-20자) *
            </Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="안전한 비밀번호를 입력하세요"
              disabled={isLoading}
              className="mt-1"
              minLength={8}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground mt-1">
              8-20자 사이로 입력해주세요.
            </p>
          </div>

          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              이름 (2-20자) *
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="홍길동"
              disabled={isLoading}
              className="mt-1"
              minLength={2}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground mt-1">
              2-20자 사이로 입력해주세요.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
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
              {isLoading ? "생성 중..." : "앱 관리자 생성"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
