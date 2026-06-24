"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  FileText,
  Edit,
  Trash2,
  CalendarHeart,
} from "lucide-react";
import {
  getAnniversaryRewardPolicy,
  deleteAnniversaryRewardPolicy,
} from "../actions";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { toast } from "sonner";
import moment from "moment";
import { AnniversaryRewardPolicy } from "@/lib/types";

export default function AnniversaryRewardPolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  const [policy, setPolicy] = useState<AnniversaryRewardPolicy | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!jsonWebToken || !params.id) return;

    const fetchPolicyDetail = async () => {
      setLoading(true);
      try {
        const result = await getAnniversaryRewardPolicy({
          policyId: params.id,
          jsonWebToken,
        });

        if (result) {
          setPolicy(result);
        } else {
          toast.error("데이터를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error(error);
        toast.error("데이터를 가져올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicyDetail();
  }, [jsonWebToken, params.id]);

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
            <p className="text-lg font-medium text-muted-foreground">
              데이터를 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <CalendarHeart className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              데이터를 찾을 수 없습니다
            </p>
            <Button onClick={() => router.back()}>돌아가기</Button>
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
              router.push(
                `/dashboard/anniversary-reward-policies/create?isUpdate=true&id=${policy._id}`
              )
            }
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            수정
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </Button>
        </div>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <CalendarHeart className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">{"리워드 정책 상세 정보"}</h1>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                id
              </Label>
              <div className="mt-1">
                <p className="text-lg font-semibold mt-1">{policy._id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  연차
                </Label>
                <p className="text-lg font-semibold mt-1">
                  {policy.year}년{policy?.year === 0 ? "(가입기념)" : ""}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  포인트
                </Label>
                <p className="text-lg font-semibold mt-1">
                  {policy.pointAmount}P
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  상태
                </Label>
                <div className="mt-1">
                  <Badge
                    variant={policy?.isEnabled ? "default" : "secondary"}
                    className={policy?.isEnabled ? "bg-green-400" : ""}
                  >
                    {policy?.isEnabled ? "활성화" : "비활성화"}
                  </Badge>
                  {policy.deletedAt && (
                    <Badge variant="destructive" className="ml-2">
                      삭제됨
                    </Badge>
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
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  생성일
                </Label>
                <p className="font-medium mt-1">
                  {moment(policy.createdAt).format("YYYY년 MM월 DD일 HH:mm")}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  수정일
                </Label>
                <p className="font-medium mt-1">
                  {moment(policy.updatedAt).format("YYYY년 MM월 DD일 HH:mm")}
                </p>
              </div>

              {policy.deletedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    삭제일
                  </Label>
                  <p className="font-medium text-red-600 mt-1">
                    {moment(policy.deletedAt).format("YYYY년 MM월 DD일 HH:mm")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="가입 기념일 리워드 삭제"
        description="이 가입 기념일 리워드를 정말 삭제하시겠습니까?"
        variant="destructive"
        onConfirm={async () => {
          if (!policy?._id || !jsonWebToken) return;

          setIsDeleting(true);
          try {
            await deleteAnniversaryRewardPolicy({
              policyId: policy._id,
              jsonWebToken,
            });
            toast.success("가입 기념일 리워드가 성공적으로 삭제되었습니다.");
            router.replace("/dashboard/anniversary-reward-policies");
          } catch (error) {
            console.error("가입 기념일 리워드 삭제 실패:", error);
            toast.error("가입 기념일 리워드 삭제에 실패했습니다.");
          } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
          }
        }}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
        }}
        confirmText={isDeleting ? "삭제 중..." : "삭제"}
      />
    </div>
  );
}
