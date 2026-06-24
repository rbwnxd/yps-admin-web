"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, QrCode, Save, Loader2 } from "lucide-react";
import {
  getAnniversaryRewardPolicy,
  updateAnniversaryRewardPolicy,
  createAnniversaryRewardPolicy,
} from "../actions";
import { toast } from "sonner";
import { AnniversaryRewardPolicyFormData } from "@/lib/types";

// 썸네일 이미지 추가, 적립태그 추가

export default function CreateAnniversaryRewardPolicyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Next.js 15 권장: useSearchParams hook 사용
  const isUpdateMode = searchParams.get("isUpdate") === "true";
  const policyId = searchParams.get("id");

  const jsonWebToken = useAuthStore((state) => state.token);

  const [loading, setLoading] = useState(false); // 저장 로딩
  const [dataLoading, setDataLoading] = useState(false); // 데이터 로딩
  const [formData, setFormData] = useState<AnniversaryRewardPolicyFormData>({
    year: 0,
    pointAmount: 10,
    isEnabled: true,
  });

  // 수정 모드인 경우 기존 데이터 로드
  useEffect(() => {
    const loadExistingData = async () => {
      if (isUpdateMode && policyId && jsonWebToken) {
        try {
          setDataLoading(true);
          const existingPolicy = await getAnniversaryRewardPolicy({
            policyId,
            jsonWebToken,
          });

          if (existingPolicy) {
            setFormData({
              year: existingPolicy.year,
              pointAmount: existingPolicy.pointAmount,
              isEnabled: Boolean(
                (existingPolicy as unknown as Record<string, unknown>).isEnabled
              ),
            });
          }
        } catch (error) {
          console.error("Failed to load QR code data:", error);
          toast.error("데이터 로드에 실패했습니다.");
        } finally {
          setDataLoading(false);
        }
      }
    };

    loadExistingData();
  }, [isUpdateMode, policyId, jsonWebToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jsonWebToken) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    // 새로운 필드들 유효성 검사
    // if (formData.year < 1) {
    //   toast.error("연차는 1 이상이어야 합니다.");
    //   return;
    // }

    setLoading(true);

    try {
      const requestBody = {
        year: formData.year,
        pointAmount: formData.pointAmount,
        isEnabled: formData.isEnabled,
      };

      let result;
      if (isUpdateMode && policyId) {
        result = await updateAnniversaryRewardPolicy({
          policyId,
          body: requestBody,
          jsonWebToken,
        });
      } else {
        result = await createAnniversaryRewardPolicy({
          body: requestBody,
          jsonWebToken,
        });
      }

      if (result) {
        toast.success(
          isUpdateMode
            ? "가입 기념일 리워드 정책이 성공적으로 수정되었습니다."
            : "가입 기념일 리워드 정책이 성공적으로 생성되었습니다."
        );
        router.replace(`/dashboard/anniversary-reward-policies/${result._id}`);
      } else {
        toast.error(
          isUpdateMode ? "수정에 실패했습니다." : "생성에 실패했습니다."
        );
      }
    } catch (error) {
      console.error("QR code operation error:", error);
      toast.error(
        isUpdateMode ? "수정에 실패했습니다." : "생성에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  // 수정 모드에서 데이터 로딩 중일 때 로딩 화면 표시
  if (isUpdateMode && dataLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">
              가입 기념일 리워드 정책 정보를 불러오는 중입니다...
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
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <QrCode className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">
            {isUpdateMode
              ? "가입 기념일 리워드 정책 수정"
              : "가입 기념일 리워드 정책 생성"}
          </h1>
          <p className="text-muted-foreground">
            {isUpdateMode
              ? "기존 가입 기념일 리워드 정책을 수정합니다"
              : "새로운 가입 기념일 리워드 정책을 생성합니다"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="year">
                    연차 (0인 경우 가입즉시){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    min={0}
                    value={formData.year}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        year: val === "" ? 0 : parseInt(val) || 0,
                      });
                    }}
                    onBlur={(e) => {
                      const numVal = parseInt(e.target.value);
                      if (isNaN(numVal)) {
                        setFormData({
                          ...formData,
                          year: 0,
                        });
                      }
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="isEnabled">
                    활성화 상태 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.isEnabled ? "true" : "false"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        isEnabled: value === "true",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="활성화 상태 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">활성화</SelectItem>
                      <SelectItem value="false">비활성화</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="point">
                    포인트 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="point"
                    type="number"
                    min="1"
                    value={formData.pointAmount || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        pointAmount: val === "" ? 0 : parseInt(val) || 0,
                      });
                    }}
                    onBlur={(e) => {
                      const numVal = parseInt(e.target.value);
                      if (isNaN(numVal) || numVal < 1) {
                        setFormData({
                          ...formData,
                          pointAmount: 10,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
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
                ? "정책 수정"
                : "정책 생성"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
