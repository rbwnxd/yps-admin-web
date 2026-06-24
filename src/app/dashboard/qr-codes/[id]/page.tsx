"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useQRCodeStore } from "@/store/qrCodeStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  QrCode,
  Hash,
  Calendar,
  Loader2,
  FileText,
  Edit,
  Trash2,
} from "lucide-react";
import { getQRCodeDetail, deleteQRCode } from "../actions";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { toast } from "sonner";
import moment from "moment";
import { getCategoryLabel } from "@/lib/consts";
import { STORAGE_URL } from "@/lib/api";
import Image from "next/image";
import { QRCode } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function QRCodeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);
  const removeQRCode = useQRCodeStore((state) => state.removeQRCode);

  const [qrCode, setQrCode] = useState<QRCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!jsonWebToken || !params.id) return;

    const fetchQRCodeDetail = async () => {
      setLoading(true);
      try {
        const result = await getQRCodeDetail({
          qrCodeId: params.id,
          jsonWebToken,
        });

        if (result) {
          setQrCode(result);
        } else {
          toast.error("QR 코드를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("QR code fetch error:", error);
        toast.error("QR 코드 정보를 가져올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchQRCodeDetail();
  }, [jsonWebToken, params.id]);

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
            <p className="text-lg font-medium text-muted-foreground">
              QR 코드 정보를 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <QrCode className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              QR 코드를 찾을 수 없습니다
            </p>
            <Button onClick={() => router.back()}>돌아가기</Button>
          </div>
        </div>
      </div>
    );
  }

  const isExpired =
    !!qrCode?.expiresAt && !moment().isBefore(moment(qrCode?.expiresAt));

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
          {/* 콘텐츠 관리 버튼 - PLATFORM_ALBUM, CONTENTS_ALBUM, CONTENTS_GOODS만 */}
          {(qrCode.category === "PLATFORM_ALBUM" ||
            qrCode.category === "CONTENTS_ALBUM" ||
            qrCode.category === "CONTENTS_GOODS") && (
            <Button
              variant="outline"
              onClick={() => {
                router.push(`/dashboard/qr-codes/${qrCode._id}/contents`);
              }}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              콘텐츠 관리
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              console.log("ws", qrCode?._id);
              router.push(`/dashboard/qr-codes/${qrCode._id}/hashes`);
            }}
            className="flex items-center gap-2"
          >
            <Hash className="w-4 h-4" />
            해시 관리
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={isExpired ? "cursor-not-allowed" : undefined}>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/dashboard/qr-codes/create?isUpdate=true&id=${qrCode._id}`,
                    )
                  }
                  className="flex items-center gap-2"
                  disabled={isExpired}
                >
                  <Edit className="w-4 h-4" />
                  수정
                </Button>
              </span>
            </TooltipTrigger>
            {isExpired && (
              <TooltipContent>
                만료된 qrCode는 수정할 수 없습니다
              </TooltipContent>
            )}
          </Tooltip>
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
        <QrCode className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">{"QR 코드 상세 정보"}</h1>
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
                제목
              </Label>
              <div className="mt-1">
                <p className="text-lg font-semibold mt-1">
                  {qrCode.displayMainTitleList[0]?.ko}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  카테고리
                </Label>
                <div className="mt-1">
                  <Badge variant="default">
                    {getCategoryLabel(qrCode.category)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  상태
                </Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      !isExpired
                        ? qrCode?.isEnabled
                          ? "default"
                          : "secondary"
                        : "destructive"
                    }
                    className={qrCode?.isEnabled ? "bg-green-400" : ""}
                  >
                    {!isExpired
                      ? qrCode?.isEnabled
                        ? "활성화"
                        : "비활성화"
                      : "만료"}
                  </Badge>
                  {qrCode.deletedAt && (
                    <Badge variant="destructive" className="ml-2">
                      삭제됨
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  타입
                </Label>
                <p className="text-lg font-semibold mt-1">
                  {qrCode.type === "STATIC" ? "정적" : "체크인"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  포인트
                </Label>
                <p className="text-lg font-semibold mt-1">{qrCode.point}P</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  만료 시간
                </Label>
                <p className="text-lg font-semibold mt-1">
                  {qrCode.expireMinutes
                    ? `${qrCode.expireMinutes}분`
                    : "무제한"}
                </p>
              </div>

              {qrCode?.type === "CHECK_IN" && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    생성 유저
                  </Label>
                  <p className="text-lg font-semibold mt-1">
                    {qrCode?.user?.nickname} {qrCode?.user?._id}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              사용 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  총 인증 가능 횟수
                </Label>
                <p className="text-2xl font-bold  mt-1">
                  {qrCode.issuedCount}회
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  인증된 횟수
                </Label>
                <p className="text-2xl font-bold mt-1">
                  {qrCode.verifiedCount || 0}회
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  해시 중복인증 여부
                </Label>
                <div className="mt-1">
                  <Badge
                    variant={qrCode.isHashReusable ? "default" : "secondary"}
                  >
                    {qrCode.isHashReusable ? "가능" : "불가"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 비율 표시 바 */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>인증 완료율</span>
                <span>
                  {qrCode.issuedCount > 0
                    ? Math.round(
                        (qrCode.verifiedCount / qrCode.issuedCount) * 100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width:
                      qrCode.issuedCount > 0
                        ? `${Math.min(
                            (qrCode.verifiedCount / qrCode.issuedCount) * 100,
                            100,
                          )}%`
                        : "0%",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>인증: {qrCode.verifiedCount}회</span>
                <span>가능: {qrCode.issuedCount}회</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 썸네일 이미지 */}
        {qrCode?.imageList && qrCode?.imageList?.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                썸네일 이미지
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrCode.imageList.map((image, index) => (
                <div
                  key={index}
                  className="flex flex-col lg:flex-row gap-4 p-4 border rounded-lg"
                >
                  {/* 이미지 미리보기 */}
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 relative overflow-hidden bg-gray-50">
                      <Image
                        src={`${STORAGE_URL}/${
                          image?.image256Path || image?.imageOriginalPath
                        }`}
                        alt={"QR-code-thumb"}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                썸네일 이미지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>등록된 썸네일 이미지가 없습니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 표시 텍스트 */}
        <Card>
          <CardHeader>
            <CardTitle>표시 텍스트</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrCode.displayMainTitleList.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  메인 타이틀
                </Label>
                <div className="space-y-1 mt-2">
                  {qrCode.displayMainTitleList.map((title, index) => (
                    <div key={index} className="flex flex-col gap-2 pl-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        KO
                      </Label>
                      <div className="text-sm p-2 bg-muted/30 rounded">
                        <div>{title.ko || "N/A"}</div>
                      </div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        EN
                      </Label>
                      <div className="text-sm p-2 bg-muted/30 rounded">
                        <div>{title.en || "N/A"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {qrCode.displaySubTitleList.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  서브 타이틀
                </Label>
                <div className="space-y-1 mt-2">
                  {qrCode.displaySubTitleList.map((subtitle, index) => (
                    <div key={index} className="flex flex-col gap-2 pl-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        KO
                      </Label>
                      <div className="text-sm p-2 bg-muted/30 rounded">
                        <div>{subtitle.ko || "N/A"}</div>
                      </div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        EN
                      </Label>
                      <div className="text-sm p-2 bg-muted/30 rounded">
                        <div>{subtitle.en || "N/A"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {qrCode.displayTextList.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  설명 텍스트
                </Label>
                <div className="space-y-1 mt-2">
                  {qrCode.displayTextList.map((text, index) => (
                    <div key={index} className="flex flex-col gap-2 pl-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        KO
                      </Label>
                      <div className="text-sm p-2 bg-muted/30 rounded">
                        <div>{text.ko || "N/A"}</div>
                      </div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        EN
                      </Label>
                      <div className="text-sm p-2 bg-muted/30 rounded">
                        <div>{text.en || "N/A"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  {moment(qrCode.createdAt).format("YYYY년 MM월 DD일 HH:mm")}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  수정일
                </Label>
                <p className="font-medium mt-1">
                  {moment(qrCode.updatedAt).format("YYYY년 MM월 DD일 HH:mm")}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  만료일
                </Label>
                <p className="font-medium mt-1">
                  {qrCode?.expiresAt
                    ? moment(qrCode.expiresAt).format("YYYY년 MM월 DD일 HH:mm")
                    : "무제한"}
                </p>
              </div>

              {qrCode.deletedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    삭제일
                  </Label>
                  <p className="font-medium text-red-600 mt-1">
                    {moment(qrCode.deletedAt).format("YYYY년 MM월 DD일 HH:mm")}
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
        title="QR 코드 삭제"
        description="이 QR 코드를 정말 삭제하시겠습니까?"
        variant="destructive"
        onConfirm={async () => {
          if (!qrCode?._id || !jsonWebToken) return;

          setIsDeleting(true);
          try {
            await deleteQRCode({
              id: qrCode._id,
              jsonWebToken,
            });
            removeQRCode(qrCode._id);
            toast.success("QR 코드가 성공적으로 삭제되었습니다.");
            router.replace("/dashboard/qr-codes");
          } catch (error) {
            console.error("QR 코드 삭제 실패:", error);
            toast.error("QR 코드 삭제에 실패했습니다.");
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
