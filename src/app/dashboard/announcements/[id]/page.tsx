"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteAnnouncement, getAnnouncement } from "../actions";
import { Announcement } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, ArrowLeft, Edit, Trash2 } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import { STORAGE_URL } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialog";

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [currentAnnouncement, setCurrentAnnouncement] =
    useState<Announcement | null>(null);

  const jsonWebToken = useAuthStore((state) => state.token);

  // 삭제 다이얼로그 상태
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] =
    useState<string>("");

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const announcement = await getAnnouncement({
        id: params.id,
        jsonWebToken,
      });
      setCurrentAnnouncement(announcement);
    };

    if (!jsonWebToken || !params.id) return;

    fetchAnnouncement();
  }, [params.id, jsonWebToken]);

  const handleDelete = (id: string) => {
    setSelectedAnnouncementId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // 삭제 API 호출
      setIsLoading(true);
      const result = await deleteAnnouncement({
        id: selectedAnnouncementId,
        jsonWebToken,
      });

      if (result) {
        setCurrentAnnouncement((val) => {
          if (val === null) return null;
          return { ...val, deletedAt: new Date().toISOString() };
        });

        toast.success("공지사항이 성공적으로 삭제되었습니다.");
      } else {
        toast.error("공지사항 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete announcement error:", error);
      toast.error("공지사항 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setSelectedAnnouncementId("");
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setSelectedAnnouncementId("");
  };

  // 상태 계산 함수들
  const getAnnouncementStatus = () => {
    if (!currentAnnouncement) return null;

    if (currentAnnouncement.deletedAt) {
      return { label: "삭제됨", variant: "destructive" as const };
    }

    if (moment().isBefore(moment(currentAnnouncement.publishedAt))) {
      return { label: "게시 예정", variant: "secondary" as const };
    }

    return { label: "게시됨", variant: "default" as const };
  };

  const status = getAnnouncementStatus();

  // 로딩 상태 처리
  if (!currentAnnouncement) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>공지사항을 불러오는 중입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
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

        {!currentAnnouncement?.deletedAt && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/dashboard/announcements/create?isUpdate=true&id=${params.id}`
                )
              }
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              수정하기
            </Button>

            <Button
              variant="destructive"
              onClick={() => handleDelete(params.id)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              삭제하기
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4 pl-2">
        {currentAnnouncement?._id}
      </p>
      {/* 메인 콘텐츠 카드 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {currentAnnouncement.titleList[0]?.ko}
              </CardTitle>
              {currentAnnouncement.titleList[0]?.en && (
                <p className="text-lg text-muted-foreground mb-4">
                  {currentAnnouncement.titleList[0].en}
                </p>
              )}
            </div>
            {status && (
              <Badge variant={status.variant} className="ml-4">
                {status.label}
              </Badge>
            )}
          </div>

          {/* 메타데이터 */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              <span>
                {`공지일: ${moment(
                  currentAnnouncement.publishedAt ||
                    currentAnnouncement.createdAt
                ).format("YYYY-MM-DD HH:mm")}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              <span>
                {`작성일: ${moment(currentAnnouncement.createdAt).format(
                  "YYYY-MM-DD HH:mm"
                )}`}
              </span>
            </div>
            {moment(currentAnnouncement.updatedAt).isAfter(
              currentAnnouncement.createdAt,
              "minutes"
            ) && (
              <div className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {`수정일: ${moment(currentAnnouncement.updatedAt).format(
                    "YYYY-MM-DD HH:mm"
                  )}`}
                </span>
              </div>
            )}
            {!!currentAnnouncement?.deletedAt && (
              <div className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {`삭제일: ${moment(currentAnnouncement.deletedAt).format(
                    "YYYY-MM-DD HH:mm"
                  )}`}
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* 이미지 섹션 */}
          {currentAnnouncement.imageList &&
            currentAnnouncement.imageList.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">첨부 이미지</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentAnnouncement.imageList.map((image, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={`${STORAGE_URL}/${image.image256Path}`}
                        alt={`공지사항 이미지 ${index + 1}`}
                        width={0}
                        height={0}
                        sizes="(max-width: 768px) 400vw, (max-width: 1024px) 300vw, 400vw"
                        className="w-auto h-auto object-contain rounded"
                        style={{ maxHeight: "200px", maxWidth: "100%" }}
                        onError={(e) => {}}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* 본문 내용 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">내용</h3>
            <div className="prose max-w-none">
              <div className="mb-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  한국어
                </h4>
                <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 rounded-lg border">
                  {currentAnnouncement?.contentList?.[0]?.ko}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  English
                </h4>
                <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 rounded-lg border">
                  {currentAnnouncement?.contentList?.[0]?.en}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="공지사항 삭제"
        description="정말로 이 공지사항을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isLoading}
        variant="destructive"
      />
    </div>
  );
}
