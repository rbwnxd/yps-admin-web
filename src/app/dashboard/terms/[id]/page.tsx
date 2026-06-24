"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { getTermsById, deleteTerms, activateTerms } from "../actions";
import { Terms, TermsType } from "@/lib/types";
import { toast } from "sonner";
import moment from "moment";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";

const TERMS_TYPE_LABELS: Record<TermsType, string> = {
  PRIVACY_POLICY: "개인정보 처리방침",
  TERMS_OF_SERVICE: "서비스 이용약관",
};

export default function TermsDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jsonWebToken = useAuthStore((state) => state.token);

  const [terms, setTerms] = useState<Terms | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activateDialog, setActivateDialog] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    const fetchTerms = async () => {
      if (!jsonWebToken || !params.id) return;

      setIsLoading(true);
      try {
        const data = await getTermsById({
          termsId: params.id,
          jsonWebToken,
        });

        if (data) {
          setTerms(data);
        } else {
          toast.error("약관 정보를 찾을 수 없습니다.");
          router.push("/dashboard/terms");
        }
      } catch (error) {
        console.error("약관 조회 실패:", error);
        toast.error("약관 정보를 불러오는데 실패했습니다.");
        router.push("/dashboard/terms");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, [jsonWebToken, params.id, router]);

  const handleDelete = async () => {
    if (!jsonWebToken || !params.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteTerms({
        termsId: params.id,
        jsonWebToken,
      });

      if (result) {
        toast.success("약관이 삭제되었습니다.");
        router.push("/dashboard/terms");
      } else {
        toast.error("약관 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("약관 삭제 실패:", error);
      toast.error(
        error instanceof Error ? error.message : "약관 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialog(false);
    }
  };

  const handleActivate = async () => {
    if (!jsonWebToken || !params.id) return;

    setIsActivating(true);
    try {
      const result = await activateTerms({
        termsId: params.id,
        jsonWebToken,
      });

      if (result) {
        toast.success("약관이 활성화되었습니다.");
        setTerms(result);
        setActivateDialog(false);
      } else {
        toast.error("약관 활성화에 실패했습니다.");
      }
    } catch (error) {
      console.error("약관 활성화 실패:", error);
      toast.error(
        error instanceof Error ? error.message : "약관 활성화에 실패했습니다."
      );
    } finally {
      setIsActivating(false);
      setActivateDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!terms) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/terms")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-2xl font-bold">약관 상세</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {!terms.isActive && (
            <Button
              onClick={() => setActivateDialog(true)}
              disabled={isActivating}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              활성화
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>약관 정보</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">{TERMS_TYPE_LABELS[terms.type]}</Badge>
              <Badge variant="secondary">v{terms.version}</Badge>
              {terms.isActive && (
                <Badge variant="default" className="bg-green-600">
                  활성화
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 제목 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              제목
            </Label>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">한국어</p>
                <p className="text-lg font-semibold">
                  {terms?.titleList?.[0]?.ko}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">English</p>
                <p className="text-lg font-semibold">
                  {terms?.titleList?.[0]?.en}
                </p>
              </div>
            </div>
          </div>

          {/* 타입 및 버전 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                약관 타입
              </Label>
              <p className="font-medium">{TERMS_TYPE_LABELS[terms.type]}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                버전
              </Label>
              <p className="font-medium">{terms.version}</p>
            </div>
          </div>

          {/* 내용 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              내용
            </Label>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  한국어
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {terms?.contentList?.[0]?.ko}
                  </pre>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  English
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {terms?.contentList?.[0]?.en}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* 날짜 정보 */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                생성일
              </Label>
              <p className="text-sm">
                {moment(terms.createdAt).format("YYYY-MM-DD HH:mm:ss")}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                수정일
              </Label>
              <p className="text-sm">
                {moment(terms.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
              </p>
            </div>
            {!!terms.deletedAt && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  삭제일
                </Label>
                <p className="text-sm">
                  {moment(terms.deletedAt).format("YYYY-MM-DD HH:mm:ss")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="약관 삭제"
        description={`"${terms?.titleList?.[0]?.ko}" 약관을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        isLoading={isDeleting}
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* 활성화 확인 다이얼로그 */}
      <ConfirmDialog
        open={activateDialog}
        onOpenChange={setActivateDialog}
        title="약관 활성화"
        description={`"${terms?.titleList?.[0]?.ko}" 약관을 활성화하시겠습니까? 기존 활성화된 동일 타입의 약관은 자동으로 비활성화됩니다.`}
        confirmText="활성화"
        cancelText="취소"
        isLoading={isActivating}
        onConfirm={handleActivate}
      />
    </div>
  );
}
