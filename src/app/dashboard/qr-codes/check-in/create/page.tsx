"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useQRCodeStore } from "@/store/qrCodeStore";
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
import {
  ArrowLeft,
  Users,
  Save,
  Calendar,
  Edit3,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { createQRCodeCheckIn, updateQRCodeCheckIn } from "../../actions";
import { AdminSearchDialog } from "@/components/dialog/AdminSearchDialog";
import { toast } from "sonner";
import {
  QRCodeCheckInAdmin,
  QRCodeCheckInFormData,
  QRCodeCategory,
} from "@/lib/types";
import { CATEGORY_OPTIONS } from "@/lib/consts";

export default function CreateCheckInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Next.js 15 권장: useSearchParams hook 사용
  const isUpdateMode = searchParams.get("isUpdate") === "true";
  const checkInId = searchParams.get("id");
  const jsonWebToken = useAuthStore((state) => state.token);
  const { findCheckInById, updateCheckIn } = useQRCodeStore();

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(isUpdateMode);
  const [isMounted, setIsMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY = 3;
  const RETRY_DELAY = 1000; // 1초
  // 현재 날짜와 시간을 기본값으로 설정
  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getEndDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2); // 2시간 후
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<QRCodeCheckInFormData>({
    category: "",
    title: "",
    startAt: getCurrentDateTime(),
    endAt: getEndDateTime(),
    memo: "",
  });

  const [admins, setAdmins] = useState<QRCodeCheckInAdmin[]>([]);
  const [isAdminSearchOpen, setIsAdminSearchOpen] = useState(false);

  // Hydration 완료 감지
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 수정 모드일 때 데이터 로드 (hydration 완료 후)
  useEffect(() => {
    const loadData = async () => {
      if (!isUpdateMode || !checkInId || !isMounted) return;

      setDataLoading(true);

      // store에서 데이터 찾기
      const data = findCheckInById(checkInId);

      if (data) {
        // 날짜 변환: ISO 문자열을 datetime-local 형식으로 변환
        const formatDateForInput = (isoString: string) => {
          const date = new Date(isoString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setFormData({
          category: data.category as QRCodeCategory,
          title: data.title,
          startAt: formatDateForInput(data.startAt),
          endAt: formatDateForInput(data.endAt),
          memo: data.memo || "",
        });

        // 관리자 정보 설정
        const adminsList: QRCodeCheckInAdmin[] =
          data.admins?.map((admin: QRCodeCheckInAdmin) => ({
            _id: admin._id,
            name: admin.name,
            account: admin.account,
          })) || [];
        setAdmins(adminsList);

        setDataLoading(false);
        setRetryCount(0); // 성공 시 재시도 횟수 리셋
      } else {
        // 데이터가 없으면 재시도 또는 오류 처리
        if (retryCount < MAX_RETRY) {
          setRetryCount((prev) => prev + 1);

          // 지연 후 재시도
          setTimeout(
            () => {
              loadData();
            },
            RETRY_DELAY * (retryCount + 1),
          ); // 재시도할 때마다 지연시간 증가
        } else {
          // 최대 재시도 횟수 초과 시
          setDataLoading(false);
          toast.error(
            "체크인 정보를 찾을 수 없습니다. 페이지를 새로고침하거나 리스트에서 다시 시도해주세요.",
          );
        }
      }
    };

    loadData();
  }, [isUpdateMode, checkInId, isMounted, retryCount, findCheckInById]);

  const handleAdminSelect = (selectedUsers: QRCodeCheckInAdmin[]) => {
    setAdmins(selectedUsers);
    toast.success(`${selectedUsers.length}명의 관리자가 선택되었습니다.`);
  };

  const handleRemoveAdmin = (adminId: string) => {
    const updatedAdmins = admins.filter((admin) => admin._id !== adminId);
    setAdmins(updatedAdmins);
    toast.success("관리자가 제거되었습니다.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jsonWebToken) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!formData.category) {
      toast.error("카테고리를 선택해주세요.");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    if (!formData.startAt) {
      toast.error("시작 시간을 입력해주세요.");
      return;
    }

    if (!formData.endAt) {
      toast.error("종료 시간을 입력해주세요.");
      return;
    }

    if (new Date(formData.startAt) >= new Date(formData.endAt)) {
      toast.error("종료 시간은 시작 시간보다 나중이어야 합니다.");
      return;
    }

    if (admins.length === 0) {
      toast.error("최소 1명의 관리자를 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const body = {
        category: formData.category as QRCodeCategory,
        title: formData.title.trim(),
        startAt: formData.startAt,
        endAt: formData.endAt,
        adminIds: admins.map((admin) => admin._id),
        memo: formData.memo.trim() || undefined,
      };

      let result;
      if (isUpdateMode && checkInId) {
        result = await updateQRCodeCheckIn({
          checkInId: checkInId,
          body,
          jsonWebToken,
        });
      } else {
        result = await createQRCodeCheckIn({
          body,
          jsonWebToken,
        });
      }

      if (result) {
        toast.success(
          isUpdateMode
            ? "체크인이 성공적으로 수정되었습니다."
            : "체크인이 성공적으로 생성되었습니다.",
        );

        if (isUpdateMode && checkInId) {
          // 전역 상태의 체크인 데이터 업데이트
          updateCheckIn(checkInId, {
            category: body.category,
            title: body.title,
            startAt: body.startAt,
            endAt: body.endAt,
            memo: body.memo,
            admins: admins.map((admin) => ({
              _id: admin._id,
              name: admin.name,
              account: admin.account,
            })),
          });

          router.replace(`/dashboard/qr-codes/check-in/${checkInId}`);
        } else {
          router.replace("/dashboard/qr-codes/check-in");
        }
      } else {
        toast.error(
          isUpdateMode
            ? "체크인 수정에 실패했습니다."
            : "체크인 생성에 실패했습니다.",
        );
      }
    } catch (error) {
      console.error("Check-in operation error:", error);
      toast.error(
        isUpdateMode
          ? "체크인 수정에 실패했습니다."
          : "체크인 생성에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Hydration이 완료되지 않았거나 데이터 로딩 중일 때 로딩 표시
  if (!isMounted || (isUpdateMode && dataLoading)) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">
              {!isMounted
                ? "페이지를 준비하고 있습니다..."
                : `체크인 정보를 불러오는 중입니다... ${
                    retryCount > 0 ? `(${retryCount}/${MAX_RETRY})` : ""
                  }`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            form="checkin-form"
            disabled={loading || !formData.category || !formData.title}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "저장 중..." : isUpdateMode ? "수정" : "생성"}
          </Button>
        </div>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        {isUpdateMode ? (
          <Edit3 className="w-8 h-8" />
        ) : (
          <Users className="w-8 h-8" />
        )}
        <div>
          <h1 className="text-3xl font-bold">
            {isUpdateMode ? "체크인 수정" : "체크인 생성"}
          </h1>
          <p className="text-muted-foreground">
            {isUpdateMode
              ? "기존 체크인 이벤트를 수정합니다"
              : "새로운 체크인 이벤트를 생성합니다"}
          </p>
        </div>
      </div>

      <form id="checkin-form" onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: QRCodeCategory) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="체크인 이벤트 제목"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">메모</Label>
                <Textarea
                  id="memo"
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData({ ...formData, memo: e.target.value })
                  }
                  placeholder="체크인 이벤트에 대한 추가 설명 (선택사항)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 일정 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                일정 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startAt">시작 시간 *</Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    value={formData.startAt || getCurrentDateTime()}
                    onChange={(e) =>
                      setFormData({ ...formData, startAt: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endAt">종료 시간 *</Label>
                  <Input
                    id="endAt"
                    type="datetime-local"
                    value={formData.endAt || getEndDateTime()}
                    onChange={(e) =>
                      setFormData({ ...formData, endAt: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 관리자 설정 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>담당 관리자 ({admins.length}명)</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdminSearchOpen(true)}
                  className="flex items-center gap-1"
                >
                  <Search className="w-3 h-3" />
                  관리자 선택
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {admins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>선택된 관리자가 없습니다.</p>
                  <p className="text-sm">
                    관리자 선택 버튼을 클릭하여 관리자를 추가하세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-2">
                    {admins.map((admin, index) => (
                      <div
                        key={index}
                        className="bg-muted/30 px-4 py-3 rounded-lg border"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{admin.name}</p>
                            <p className="text-xs text-muted-foreground">
                              @{admin.account}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {admin._id}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAdmin(admin._id)}
                            className="ml-2 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading
                ? isUpdateMode
                  ? "수정 중..."
                  : "생성 중..."
                : isUpdateMode
                  ? "체크인 수정"
                  : "체크인 생성"}
            </Button>
          </div>
        </div>
      </form>

      {/* 관리자 검색 다이얼로그 */}
      {jsonWebToken && (
        <AdminSearchDialog
          open={isAdminSearchOpen}
          onOpenChange={setIsAdminSearchOpen}
          onConfirm={handleAdminSelect}
          jsonWebToken={jsonWebToken}
          adminIds={admins.map((admin) => admin._id)}
        />
      )}
    </div>
  );
}
