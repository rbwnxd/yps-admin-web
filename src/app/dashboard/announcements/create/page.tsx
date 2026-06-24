"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Save, X, Upload, Trash2, Eye, Loader2 } from "lucide-react";
import moment from "moment";
import { postAnnouncement, putAnnouncement, getAnnouncement } from "../actions";
import { uploadImageFile } from "@/app/actions";
import { STORAGE_URL } from "@/lib/api";
import Image from "next/image";
import { toast } from "sonner";
import { Announcement, UploadedImage, AnnouncementFormData } from "@/lib/types";

export default function AnnouncementCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Next.js 15 권장: useSearchParams hook 사용
  const isUpdateMode = searchParams.get("isUpdate") === "true";
  const announcementId = searchParams.get("id");

  const jsonWebToken = useAuthStore((state) => state.token);

  const [formData, setFormData] = useState<AnnouncementFormData>({
    titleKo: "",
    titleEn: "",
    contentKo: "",
    contentEn: "",
    publishedAt: "",
  });

  const [isLoading, setIsLoading] = useState(false); // 저장 로딩
  const [dataLoading, setDataLoading] = useState(false); // 데이터 로딩
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // 수정 모드인 경우 기존 데이터 로드
  useEffect(() => {
    if (isUpdateMode && announcementId && jsonWebToken) {
      const fetchAnnouncementData = async () => {
        setDataLoading(true);
        try {
          const announcementData: Announcement | null = await getAnnouncement({
            id: announcementId,
            jsonWebToken,
          });

          if (announcementData) {
            setFormData({
              titleKo: announcementData.titleList[0]?.ko || "",
              titleEn: announcementData.titleList[0]?.en || "",
              contentKo: announcementData.contentList[0]?.ko || "",
              contentEn: announcementData.contentList[0]?.en || "",
              publishedAt: moment(announcementData.publishedAt).format(
                "YYYY-MM-DDTHH:mm"
              ),
            });

            // 기존 이미지들을 UploadedImage 형태로 변환
            setImages(
              announcementData.imageList.map((image, index: number) => ({
                id: Date.now().toString() + index + Math.random().toString(36),
                file: null, // 이미 업로드된 파일이므로 null
                progress: 100, // 완료된 상태
                isUploading: false,
                path: image.imageOriginalPath, // 기존 이미지 경로
                preview: `${STORAGE_URL}/${image.image256Path}`, // 미리보기용 URL
              }))
            );
          } else {
            toast.error("공지사항 정보를 찾을 수 없습니다.");
          }
        } catch (error) {
          console.error("Failed to fetch announcement data:", error);
          toast.error("공지사항 정보를 불러오는데 실패했습니다.");
        } finally {
          setDataLoading(false);
        }
      };

      fetchAnnouncementData();
    }
  }, [isUpdateMode, announcementId, jsonWebToken]);
  const handleInputChange = (
    field: keyof AnnouncementFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 이미지 업로드 관련 함수들
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(async (file) => {
      if (file.type.startsWith("image/")) {
        const newImage: UploadedImage = {
          id: Date.now().toString() + Math.random().toString(36),
          file,
          progress: 0,
          isUploading: true,
        };

        // 상태 업데이트와 동시에 업로드 시작
        setImages((prev) => [...prev, newImage]);

        // 직접 업로드 실행
        await uploadImageDirect(newImage);
      }
    });
  };

  const uploadImageDirect = async (imageData: UploadedImage) => {
    if (!jsonWebToken || !imageData.file) return;

    try {
      const path = await uploadImageFile({
        file: imageData.file,
        jsonWebToken,
        dataCollectionName: "announcements",
        onProgress: (progress) => {
          setImages((prev) =>
            prev.map((img) =>
              img.id === imageData.id ? { ...img, progress } : img
            )
          );
        },
      });

      setImages((prev) =>
        prev.map((img) =>
          img.id === imageData.id
            ? { ...img, path, isUploading: false, progress: 100 }
            : img
        )
      );
    } catch (error) {
      console.error("Image upload error:", error);
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageData.id
            ? {
                ...img,
                isUploading: false,
                error: "업로드 실패",
              }
            : img
        )
      );
    }
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonWebToken) return;

    setIsLoading(true);

    try {
      const requestData = {
        titleList: [
          {
            ko: formData.titleKo,
            en: formData.titleEn,
          },
        ] as [{ ko: string; en: string }],
        contentList: [
          {
            ko: formData.contentKo,
            en: formData.contentEn,
          },
        ] as [{ ko: string; en: string }],
        publishedAt: moment(formData.publishedAt).toISOString(),
        imageList: images
          .filter((img) => img.path)
          .map((img) => {
            return {
              name: img?.file?.name || "img",
              imageOriginalPath: img.path!,
            };
          }) as { name: string; imageOriginalPath: string }[],
      };

      let result;
      if (isUpdateMode && announcementId) {
        result = await putAnnouncement({
          id: announcementId,
          body: requestData,
          jsonWebToken,
        });
      } else {
        result = await postAnnouncement({
          body: requestData,
          jsonWebToken,
        });
      }

      if (result) {
        router.replace("/dashboard/announcements");
      }
    } catch (error) {
      console.error("공지사항 저장 오류:", error);
      toast.error("공지사항 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
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
              공지사항 정보를 불러오는 중입니다...
            </p>
          </div>
        </div>
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
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (announcementId && isUpdateMode) {
                router.back();
              } else {
                router.replace("/dashboard/announcements");
              }
            }}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            취소
          </Button>
          <Button
            type="submit"
            form="announcement-form"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      {/* 메인 폼 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isUpdateMode ? "공지사항 수정" : "공지사항 작성"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form id="announcement-form" onSubmit={handleSubmit}>
            {/* 제목 섹션 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">제목</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="titleKo" className="text-sm font-medium">
                    한국어 제목 *
                  </Label>
                  <Input
                    id="titleKo"
                    value={formData.titleKo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("titleKo", e.target.value)
                    }
                    placeholder="한국어 제목을 입력하세요"
                    required
                    disabled={isLoading}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="titleEn" className="text-sm font-medium">
                    영어 제목
                  </Label>
                  <Input
                    id="titleEn"
                    value={formData.titleEn}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("titleEn", e.target.value)
                    }
                    placeholder="Enter English title"
                    disabled={isLoading}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* 내용 섹션 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">내용</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contentKo" className="text-sm font-medium">
                    한국어 내용 *
                  </Label>
                  <Textarea
                    id="contentKo"
                    value={formData.contentKo}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleInputChange("contentKo", e.target.value)
                    }
                    placeholder="한국어 내용을 입력하세요"
                    required
                    disabled={isLoading}
                    className="mt-1 min-h-50 overflow-y-auto"
                  />
                </div>
                <div>
                  <Label htmlFor="contentEn" className="text-sm font-medium">
                    영어 내용
                  </Label>
                  <Textarea
                    id="contentEn"
                    value={formData.contentEn}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleInputChange("contentEn", e.target.value)
                    }
                    placeholder="Enter English content"
                    disabled={isLoading}
                    className="mt-1 min-h-50 overflow-y-auto"
                  />
                </div>
              </div>
            </div>

            {/* 공지일 및 외부링크 섹션 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">추가 정보</h3>
              <div className="flex flex-col md:flex-row gap-4 md:items-end">
                <div className="flex-shrink-0">
                  <Label htmlFor="publishedAt" className="text-sm font-medium">
                    공지일
                  </Label>
                  <Input
                    id="publishedAt"
                    type="datetime-local"
                    value={formData.publishedAt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("publishedAt", e.target.value)
                    }
                    disabled={isLoading}
                    className="mt-1 w-fit"
                  />
                </div>
              </div>
            </div>

            {/* 이미지 업로드 섹션 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">첨부 이미지</h3>

              {/* 파일 업로드 영역 */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">
                  이미지를 드래그하여 업로드하거나
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file-input")?.click()}
                  disabled={isLoading}
                >
                  파일 선택
                </Button>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  disabled={isLoading}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-2">
                  JPG, PNG, GIF 파일 지원 (최대 10MB)
                </p>
              </div>

              {/* 업로드된 이미지 목록 */}
              {images.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">업로드된 이미지</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        {/* 이미지 미리보기 */}
                        <div className="flex justify-center">
                          <div className="relative rounded overflow-hidden">
                            <Image
                              src={
                                image.file
                                  ? URL.createObjectURL(image.file)
                                  : image.preview || ""
                              }
                              alt={image?.file?.name || ""}
                              width={0}
                              height={0}
                              sizes="(max-width: 768px) 400vw, (max-width: 1024px) 300vw, 400vw"
                              className="w-full h-auto max-h-[200px] md:max-h-[300px] lg:max-h-[400px] object-contain rounded"
                            />
                          </div>
                        </div>

                        {/* 파일 정보 */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium truncate">
                            {image?.file?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {((image?.file?.size || 0) / 1024 / 1024).toFixed(
                              2
                            )}{" "}
                            MB
                          </p>
                        </div>

                        {/* 업로드 상태 */}
                        {image.isUploading && (
                          <div className="space-y-2">
                            <Progress value={image.progress} className="h-2" />
                            <p className="text-xs text-center">
                              업로드 중... {image.progress}%
                            </p>
                          </div>
                        )}

                        {image.error && (
                          <p className="text-xs text-red-500 text-center">
                            {image.error}
                          </p>
                        )}

                        {image.path && (
                          <div className="flex items-center justify-center">
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              업로드 완료
                            </span>
                          </div>
                        )}

                        {/* 액션 버튼 */}
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeImage(image.id)}
                            disabled={isLoading}
                            className="w-full"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            제거
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
