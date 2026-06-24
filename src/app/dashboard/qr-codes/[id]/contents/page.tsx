"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Video, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getQRCodeDetail, getQRCodeContents } from "../../actions";
import { QRCode, QRCodeContent } from "@/lib/types";
import { STORAGE_URL } from "@/lib/api";
import moment from "moment";
import Image from "next/image";
import { toast } from "sonner";
import { QRCodeContentDialog } from "@/components/dialog/QRCodeContentDialog";

export default function QRCodeContentsPage() {
  const router = useRouter();
  const params = useParams();
  const { token: jsonWebToken } = useAuthStore();

  const [currentQRCode, setCurrentQRCode] = useState<QRCode | null>(null);
  const [videoContents, setVideoContents] = useState<QRCodeContent[]>([]);
  const [photoContents, setPhotoContents] = useState<QRCodeContent[]>([]);
  const [albumContents, setAlbumContents] = useState<QRCodeContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"video" | "photo" | "album">(
    "video",
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "view" | "edit">(
    "create",
  );
  const [editingContent, setEditingContent] = useState<QRCodeContent | null>(
    null,
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id || typeof params.id !== "string") return;

      setLoading(true);
      try {
        const loadQRCodeDetail = async () => {
          if (!jsonWebToken || !params.id || typeof params.id !== "string")
            return;
          try {
            const data = await getQRCodeDetail({
              qrCodeId: params.id,
              jsonWebToken,
            });
            if (data?.data) {
              setCurrentQRCode(data.data);
            }
          } catch (error) {
            console.error("Failed to load QR code:", error);
            toast.error("QR 코드 정보를 불러오는데 실패했습니다.");
          }
        };

        const loadContents = async () => {
          if (!params.id || typeof params.id !== "string" || !jsonWebToken)
            return;
          setLoading(true);
          try {
            const result = await getQRCodeContents({
              qrCodeId: params.id,
              params: {
                __skip: 0,
                __limit: 1000,
                __sortBy: "createdAt",
                __sort: "1",
              },
              jsonWebToken,
            });

            if (result?.qrCodeContentList) {
              const videos = result.qrCodeContentList.filter(
                (content: QRCodeContent) => content.type === "VIDEO",
              );
              const photos = result.qrCodeContentList.filter(
                (content: QRCodeContent) => content.type === "PHOTO",
              );
              const albums = result.qrCodeContentList.filter(
                (content: QRCodeContent) => content.type === "ALBUM",
              );
              setVideoContents(videos);
              setPhotoContents(photos);
              setAlbumContents(albums);
            }
          } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("데이터를 불러오는데 실패했습니다.");
          } finally {
            setLoading(false);
          }
        };

        await loadQRCodeDetail();
        await loadContents();
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id && jsonWebToken) {
      fetchData();
    }
  }, [params.id, jsonWebToken]);

  const handleCreateContent = (type: "video" | "photo" | "album") => {
    setDialogMode("create");
    setEditingContent(null);
    setActiveTab(type);
    setDialogOpen(true);
  };

  const handleViewContent = (content: QRCodeContent) => {
    setDialogMode("view");
    setEditingContent(content);
    setDialogOpen(true);
  };

  const handleRefresh = async () => {
    if (!params.id || typeof params.id !== "string" || !jsonWebToken) return;

    const result = await getQRCodeContents({
      qrCodeId: params.id,
      params: {
        __skip: 0,
        __limit: 1000,
        __sortBy: "createdAt",
        __sort: "1",
      },
      jsonWebToken,
    });

    if (result?.qrCodeContentList) {
      const videos = result.qrCodeContentList.filter(
        (content: QRCodeContent) => content.type === "VIDEO",
      );
      const photos = result.qrCodeContentList.filter(
        (content: QRCodeContent) => content.type === "PHOTO",
      );
      const albums = result.qrCodeContentList.filter(
        (content: QRCodeContent) => content.type === "ALBUM",
      );
      setVideoContents(videos);
      setPhotoContents(photos);
      setAlbumContents(albums);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Button>
      </div>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">콘텐츠 관리</h2>
        <p className="text-muted-foreground">
          {currentQRCode?.displayMainTitleList?.[0]?.ko || "-"}
        </p>
      </div>

      {/* 탭 */}
      <Card>
        <CardHeader>
          <CardTitle>콘텐츠 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(v as "video" | "photo" | "album")
            }
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="video" className="gap-2">
                  <Video className="h-4 w-4" />
                  클립 ({videoContents.length})
                </TabsTrigger>
                <TabsTrigger value="photo" className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  사진 ({photoContents.length})
                </TabsTrigger>
                <TabsTrigger value="album" className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  앨범 ({albumContents.length})
                </TabsTrigger>
              </TabsList>
              <Button
                onClick={() => handleCreateContent(activeTab)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {activeTab === "video"
                  ? "클립 추가"
                  : activeTab === "photo"
                    ? "사진 추가"
                    : "앨범 추가"}
              </Button>
            </div>

            <TabsContent value="video" className="space-y-4">
              {videoContents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  등록된 클립이 없습니다.
                </div>
              ) : (
                <div className="flex flex-row flex-wrap gap-4">
                  {videoContents.map((content) => (
                    <Card
                      key={content._id}
                      className="cursor-pointer hover:shadow-lg transition-shadow py-0 w-full md:w-80"
                      onClick={() => handleViewContent(content)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-video bg-muted overflow-hidden mb-3">
                          {content.video?.thumbnailImage512Path ||
                          content.video?.thumbnailImageOriginalPath ? (
                            <Image
                              src={`${STORAGE_URL}/${
                                content.video?.thumbnailImage512Path ||
                                content.video.thumbnailImageOriginalPath
                              }`}
                              alt={content.titleI18n?.ko || "썸네일"}
                              width={400}
                              height={225}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="font-semibold line-clamp-1">
                            {content.titleI18n?.ko ||
                              content.titleI18n?.en ||
                              "-"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                content.isPublished ? "default" : "secondary"
                              }
                            >
                              {content.isPublished ? "공개" : "비공개"}
                            </Badge>
                          </div>
                          {!!content?.publishedAt && (
                            <div className="text-xs text-muted-foreground">
                              공개일 :{" "}
                              {moment(content.publishedAt).format(
                                "YYYY-MM-DD HH:mm",
                              )}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            생성일 :{" "}
                            {moment(content.createdAt).format(
                              "YYYY-MM-DD HH:mm",
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            수정일 :{" "}
                            {moment(content.updatedAt).format(
                              "YYYY-MM-DD HH:mm",
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="photo" className="space-y-4">
              {photoContents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  등록된 사진이 없습니다.
                </div>
              ) : (
                <div className="flex flex-row flex-wrap gap-4">
                  {photoContents.map((content) => (
                    <Card
                      key={content._id}
                      className="cursor-pointer hover:shadow-lg transition-shadow py-0 w-full md:w-80"
                      onClick={() => handleViewContent(content)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-square bg-muted overflow-hidden mb-3">
                          {content.photo?.image512Path ||
                          content.photo?.imageOriginalPath ? (
                            <Image
                              src={`${STORAGE_URL}/${
                                content.photo?.image512Path ||
                                content.photo.imageOriginalPath
                              }`}
                              alt={content.titleI18n?.ko || "사진"}
                              width={400}
                              height={400}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="font-semibold line-clamp-1">
                            {content.titleI18n?.ko ||
                              content.titleI18n?.en ||
                              "-"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                content.isPublished ? "default" : "secondary"
                              }
                            >
                              {content.isPublished ? "공개" : "비공개"}
                            </Badge>
                          </div>
                          {!!content?.publishedAt && (
                            <div className="text-xs text-muted-foreground">
                              공개일 :{" "}
                              {moment(content.publishedAt).format(
                                "YYYY-MM-DD HH:mm",
                              )}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            생성일 :{" "}
                            {moment(content.createdAt).format(
                              "YYYY-MM-DD HH:mm",
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            수정일 :{" "}
                            {moment(content.updatedAt).format(
                              "YYYY-MM-DD HH:mm",
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="album" className="space-y-4">
              {albumContents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  등록된 앨범이 없습니다.
                </div>
              ) : (
                <div className="flex flex-row flex-wrap gap-4">
                  {albumContents.map((content) => (
                    <Card
                      key={content._id}
                      className="cursor-pointer hover:shadow-lg transition-shadow py-0 w-full md:w-80"
                      onClick={() => handleViewContent(content)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-square bg-muted overflow-hidden mb-3">
                          {content.album?.image512Path ||
                          content.album?.imageOriginalPath ? (
                            <Image
                              src={`${STORAGE_URL}/${
                                content.album?.image512Path ||
                                content.album.imageOriginalPath
                              }`}
                              alt={content.titleI18n?.ko || "앨범"}
                              width={400}
                              height={400}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="font-semibold line-clamp-1">
                            {content.titleI18n?.ko ||
                              content.titleI18n?.en ||
                              "-"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                content.isPublished ? "default" : "secondary"
                              }
                            >
                              {content.isPublished ? "공개" : "비공개"}
                            </Badge>
                            {content.album?.trackList && (
                              <Badge variant="outline">
                                {content.album.trackList.length}곡
                              </Badge>
                            )}
                          </div>
                          {!!content?.publishedAt && (
                            <div className="text-xs text-muted-foreground">
                              공개일 :{" "}
                              {moment(content.publishedAt).format(
                                "YYYY-MM-DD HH:mm",
                              )}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            생성일 :{" "}
                            {moment(content.createdAt).format(
                              "YYYY-MM-DD HH:mm",
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            수정일 :{" "}
                            {moment(content.updatedAt).format(
                              "YYYY-MM-DD HH:mm",
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 콘텐츠 생성/수정 다이얼로그 */}
      {params.id && typeof params.id === "string" && (
        <QRCodeContentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          setDialogMode={setDialogMode}
          qrCodeId={params.id}
          contentType={
            activeTab === "video"
              ? "VIDEO"
              : activeTab === "photo"
                ? "PHOTO"
                : "ALBUM"
          }
          editingContent={editingContent}
          allContents={[...videoContents, ...photoContents, ...albumContents]}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
