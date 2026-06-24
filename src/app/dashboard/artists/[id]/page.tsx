"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteArtist, getArtist } from "../actions";
import { Artist } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ArrowLeft, Edit, Trash2 } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import { STORAGE_URL } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialog";

export default function ArtistDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [currentArtist, setCurrentArtist] = useState<Artist | null>(null);

  const jsonWebToken = useAuthStore((state) => state.token);

  // 삭제 다이얼로그 상태
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState<string>("");

  useEffect(() => {
    const fetchArtist = async () => {
      const artist = await getArtist({
        id: params.id,
        jsonWebToken,
      });
      setCurrentArtist(artist);
    };

    if (!jsonWebToken || !params.id) return;

    fetchArtist();
  }, [params.id, jsonWebToken]);

  const handleDelete = (id: string) => {
    setSelectedArtistId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // 삭제 API 호출
      setIsLoading(true);
      const result = await deleteArtist({
        id: selectedArtistId,
        jsonWebToken,
      });

      if (result) {
        setCurrentArtist((val) => {
          if (val === null) return null;
          return { ...val, deletedAt: new Date().toISOString() };
        });

        toast.success("아티스트가 성공적으로 삭제되었습니다.");
      } else {
        toast.error("아티스트 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete artist error:", error);
      toast.error("아티스트 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setSelectedArtistId("");
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setSelectedArtistId("");
  };

  // 로딩 상태 처리
  if (!currentArtist) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>아티스트를 불러오는 중입니다.</p>
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

        {!currentArtist?.deletedAt && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/dashboard/artists/create?isUpdate=true&id=${params.id}`
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
        {currentArtist?._id}
      </p>
      {/* 메인 콘텐츠 카드 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {currentArtist.nameList[0]?.ko}
              </CardTitle>
              {currentArtist.nameList[0]?.en && (
                <p className="text-lg text-muted-foreground mb-4">
                  {currentArtist.nameList[0].en}
                </p>
              )}
            </div>
          </div>

          {/* 메타데이터 */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              <span>
                {`생성일: ${moment(currentArtist.createdAt).format(
                  "YYYY-MM-DD HH:mm"
                )}`}
              </span>
            </div>
            {moment(currentArtist.updatedAt).isAfter(
              currentArtist.createdAt,
              "minutes"
            ) && (
              <div className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {`수정일: ${moment(currentArtist.updatedAt).format(
                    "YYYY-MM-DD HH:mm"
                  )}`}
                </span>
              </div>
            )}
            {!!currentArtist?.deletedAt && (
              <div className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {`삭제일: ${moment(currentArtist.deletedAt).format(
                    "YYYY-MM-DD HH:mm"
                  )}`}
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* 이미지 섹션 */}
          {currentArtist?.imageList && currentArtist.imageList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">이미지</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentArtist.imageList.map((image, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={`${STORAGE_URL}/${image.image256Path}`}
                      alt={`아티스트 이미지 ${index + 1}`}
                      width={0}
                      height={0}
                      sizes="(max-width: 768px) 400vw, (max-width: 1024px) 300vw, 400vw"
                      className="w-auto h-auto object-contain"
                      style={{ maxHeight: "300px", maxWidth: "100%" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="아티스트 삭제"
        description="정말로 이 아티스트를 삭제하시겠습니까?"
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
