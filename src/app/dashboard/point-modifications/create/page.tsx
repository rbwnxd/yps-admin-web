"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePointModificationStore } from "@/store/pointModificationStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Coins, Users, Calendar } from "lucide-react";
import { createPointModification } from "../actions";
import { UserSearchDialog } from "@/components/dialog/UserSearchDialog";
import { toast } from "sonner";
import { User } from "@/lib/types";

export default function CreatePointModificationPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);
  const addPointModification = usePointModificationStore(
    (state) => state.addPointModification
  );

  const [formData, setFormData] = useState({
    type: "GRANT" as "GRANT" | "REVOKE",
    title: "",
    amount: 10,
    description: "",
    scheduledAt: "",
  });

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 현재 날짜와 시간을 기본값으로 설정
  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUserSelect = (users: User[]) => {
    setSelectedUsers(users);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((user) => user._id !== userId));
  };

  const handleSubmit = async () => {
    if (!jsonWebToken) {
      toast.error("인증이 필요합니다.");
      return;
    }

    // 유효성 검사
    if (!formData.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("올바른 포인트 금액을 입력해주세요.");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("설명을 입력해주세요.");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("대상 사용자를 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const result = await createPointModification({
        body: {
          type: formData.type,
          title: formData.title.trim(),
          amount: Number(formData.amount),
          description: formData.description.trim(),
          targetUserIds: selectedUsers.map((user) => user._id),
          scheduledAt: formData.scheduledAt || null,
        },
        jsonWebToken,
      });

      if (result) {
        toast.success("포인트 작업이 성공적으로 생성되었습니다.");

        // 전역 상태에 새로운 작업 추가
        if (result.adminPointModification) {
          addPointModification(result.adminPointModification);
        }

        router.replace("/dashboard/point-modifications");
      }
    } catch (error) {
      console.error("포인트 작업 생성 오류:", error);
      toast.error("포인트 작업 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

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
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Coins className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">새 포인트 작업</h1>
          <p className="text-muted-foreground">
            사용자에게 포인트를 지급하거나 차감합니다
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type" className="text-sm font-medium">
                  작업 유형 *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "GRANT" | "REVOKE") =>
                    handleInputChange("type", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GRANT">포인트 지급</SelectItem>
                    <SelectItem value="REVOKE">포인트 차감</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount" className="text-sm font-medium">
                  포인트 금액 *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="포인트 금액"
                  value={formData.amount || ""}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  onBlur={(e) => {
                    const numVal = parseInt(e.target.value);
                    if (isNaN(numVal) || numVal < 1) {
                      handleInputChange("amount", "10");
                    }
                  }}
                  className="mt-1"
                  min="1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title" className="text-sm font-medium">
                제목 *
              </Label>
              <Input
                id="title"
                placeholder="월간 보너스 포인트"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                설명 *
              </Label>
              <Textarea
                id="description"
                placeholder="포인트 지급/차감에 대한 상세 설명을 입력하세요"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="scheduledAt" className="text-sm font-medium">
                예약 실행 시간 (선택사항)
              </Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) =>
                  handleInputChange("scheduledAt", e.target.value)
                }
                className="mt-1 w-fit"
                min={getCurrentDateTime()}
              />
              <p className="text-xs text-muted-foreground mt-1">
                비어두면 즉시 실행됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 대상 사용자 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              대상 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUserSearchOpen(true)}
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                사용자 선택
              </Button>

              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    선택된 사용자 ({selectedUsers.length}명)
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <span className="text-sm">
                          {user?.profile?.nickname} ({user?.email})
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUser(user._id)}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "생성 중..." : "포인트 작업 생성"}
          </Button>
        </div>
      </div>

      {/* 사용자 검색 다이얼로그 */}
      <UserSearchDialog
        open={isUserSearchOpen}
        onOpenChange={setIsUserSearchOpen}
        onUserSelect={handleUserSelect}
        selectedUsers={selectedUsers}
        multiple={true}
      />
    </div>
  );
}
