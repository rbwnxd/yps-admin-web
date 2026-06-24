"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  X,
  Upload,
  Video,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { QRCodeContent } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import {
  postQRCodeContent,
  putQRCodeContent,
  deleteQRCodeContent,
} from "@/app/dashboard/qr-codes/actions";
import {
  uploadImageFile,
  uploadVideoFile,
  uploadAudioFile,
} from "@/app/actions";
import { STORAGE_URL } from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import moment from "moment";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";

interface ContentItem {
  _id?: string;
  titleKo: string;
  titleEn: string;
  descriptionKo: string;
  descriptionEn: string;
  type: "VIDEO" | "PHOTO" | "ALBUM";
  isPublished: boolean;
  publishedAt?: string;

  // VIDEO 타입
  thumbnailImagePath?: string;
  thumbnailImage512Path?: string;
  videoFilePath?: string;
  videoFilename?: string;
  thumbnailUploading?: boolean;
  videoUploading?: boolean;
  thumbnailProgress?: number;
  videoProgress?: number;

  // PHOTO 타입
  imagePath?: string;
  image512Path?: string;
  imageUploading?: boolean;
  imageProgress?: number;
  isBulk?: boolean;

  // ALBUM 타입
  albumCoverImagePath?: string;
  albumCoverImage512Path?: string;
  albumCoverUploading?: boolean;
  albumCoverProgress?: number;
  trackList?: Array<{
    number: number;
    isMainTitle: string;
    isTitle: number;
    titleKo: string;
    titleEn: string;
    descriptionKo: string;
    descriptionEn: string;
    artistNameKo: string;
    artistNameEn: string;
    durationSeconds: number;
    trackFilename: string;
    trackFilePath: string;
    trackUploading?: boolean;
    trackProgress?: number;
  }>;
}

interface QRCodeContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "view" | "edit";
  setDialogMode: (mode: "create" | "view" | "edit") => void;
  qrCodeId: string;
  contentType: "VIDEO" | "PHOTO" | "ALBUM";
  editingContent?: QRCodeContent | null;
  allContents?: QRCodeContent[];
  onSuccess: () => void;
}

export function QRCodeContentDialog({
  open,
  onOpenChange,
  mode,
  setDialogMode,
  qrCodeId,
  contentType: initialContentType,
  editingContent,
  allContents = [],
  onSuccess,
}: QRCodeContentDialogProps) {
  const { token: jsonWebToken } = useAuthStore();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [originalContentItems, setOriginalContentItems] = useState<
    ContentItem[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [contentType, setContentType] = useState<
    "VIDEO" | "PHOTO" | "ALBUM" | "BULK_PHOTO"
  >(initialContentType);
  const isInitialLoadRef = useRef(true);
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingBulkPhoto, setIsDraggingBulkPhoto] = useState(false);
  const [isDraggingAlbumCover, setIsDraggingAlbumCover] = useState(false);
  const [isDraggingTrack, setIsDraggingTrack] = useState<number | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "default" as "destructive" | "default",
  });

  // 변경사항 여부 확인
  const hasChanges = () => {
    if (mode === "view") return false;
    return (
      JSON.stringify(contentItems) !== JSON.stringify(originalContentItems)
    );
  };

  useEffect(() => {
    if (open && mode === "create") {
      // 모든 타입의 콘텐츠 로드 (생성 모드) - TEXT 제외
      const existingItems = allContents
        .filter((c) => c.type !== "TEXT")
        .map((content) => ({
          _id: content._id,
          titleKo: content.titleI18n?.ko || "",
          titleEn: content.titleI18n?.en || "",
          descriptionKo: content.descriptionI18n?.ko || "",
          descriptionEn: content.descriptionI18n?.en || "",
          type: content.type as "VIDEO" | "PHOTO" | "ALBUM",
          isPublished: content.isPublished,
          publishedAt: content.publishedAt || undefined,
          thumbnailImagePath: content.video?.thumbnailImageOriginalPath,
          videoFilePath: content.video?.videoFilePath,
          videoFilename: content.video?.videoFilename,
          imagePath: content.photo?.imageOriginalPath,
          albumCoverImagePath: content.album?.imageOriginalPath,
          albumCoverImage512Path: content.album?.image512Path,
          trackList: content.album?.trackList?.map((track) => ({
            number: track.number,
            isMainTitle: track.isMainTitle,
            isTitle: track.isTitle,
            titleKo: track.titleI18n?.ko || "",
            titleEn: track.titleI18n?.en || "",
            descriptionKo: track.descriptionI18n?.ko || "",
            descriptionEn: track.descriptionI18n?.en || "",
            artistNameKo: track.artistNameI18n?.ko || "",
            artistNameEn: track.artistNameI18n?.en || "",
            durationSeconds: track.durationSeconds,
            trackFilename: track.trackFilename,
            trackFilePath: track.trackFilePath,
          })),
        }));

      // 새 콘텐츠를 맨 뒤에 추가
      const newContent = {
        titleKo: "",
        titleEn: "",
        descriptionKo: "",
        descriptionEn: "",
        type: (contentType === "BULK_PHOTO" ? "PHOTO" : contentType) as "VIDEO" | "PHOTO" | "ALBUM",
        isPublished: false,
        publishedAt: undefined,
      };

      const allItems = [...existingItems, newContent];
      setContentItems(allItems);
      setOriginalContentItems(existingItems); // 원본은 기존 콘텐츠만

      // 필터링된 배열 기준으로 마지막 인덱스 선택
      const filteredItems = allItems.filter(
        (item) => item.type === contentType,
      );

      setCurrentIndex(filteredItems.length - 1);
    }
  }, [open, mode, allContents, contentType]);

  useEffect(() => {
    if (open && (mode === "view" || mode === "edit")) {
      // 모든 타입의 콘텐츠 로드 - TEXT 제외
      const items = allContents
        .filter((c) => c.type !== "TEXT")
        .map((content) => ({
          _id: content._id,
          titleKo: content.titleI18n?.ko || "",
          titleEn: content.titleI18n?.en || "",
          descriptionKo: content.descriptionI18n?.ko || "",
          descriptionEn: content.descriptionI18n?.en || "",
          type: content.type as "VIDEO" | "PHOTO" | "ALBUM",
          isPublished: content.isPublished,
          publishedAt: content.publishedAt || undefined,
          thumbnailImagePath: content.video?.thumbnailImageOriginalPath,
          thumbnailImage512Path: content.video?.thumbnailImage512Path,
          videoFilePath: content.video?.videoFilePath,
          videoFilename: content.video?.videoFilename,
          imagePath: content.photo?.imageOriginalPath,
          image512Path: content.photo?.image512Path,
          albumCoverImagePath: content.album?.imageOriginalPath,
          albumCoverImage512Path: content.album?.image512Path,
          trackList: content.album?.trackList?.map((track) => ({
            number: track.number,
            isMainTitle: track.isMainTitle,
            isTitle: track.isTitle,
            titleKo: track.titleI18n?.ko || "",
            titleEn: track.titleI18n?.en || "",
            descriptionKo: track.descriptionI18n?.ko || "",
            descriptionEn: track.descriptionI18n?.en || "",
            artistNameKo: track.artistNameI18n?.ko || "",
            artistNameEn: track.artistNameI18n?.en || "",
            durationSeconds: track.durationSeconds,
            trackFilename: track.trackFilename,
            trackFilePath: track.trackFilePath,
          })),
        })) as ContentItem[];
      setContentItems(items);
      setOriginalContentItems(items); // 원본 데이터 백업

      // 필터링된 배열 기준으로 선택된 콘텐츠 인덱스 설정
      const filteredItems = items.filter((c) => c.type === contentType);
      const selectedIndex = filteredItems.findIndex(
        (c) => c._id === editingContent?._id,
      );
      setCurrentIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [open, mode, editingContent, allContents, contentType]);

  useEffect(() => {
    if (!open) {
      setContentItems([]);
      setCurrentIndex(0);
      isInitialLoadRef.current = true; // 다이얼로그 닫힐 때 초기화
    }
    setContentType(initialContentType);
  }, [open, initialContentType]);

  // contentType 변경 시 currentIndex 초기화 (초기 로드 제외)
  useEffect(() => {
    if (open) {
      if (isInitialLoadRef.current) {
        // 초기 로드 시에는 인덱스 초기화 스킵
        isInitialLoadRef.current = false;
      } else {
        // 이후 contentType 변경 시에는 인덱스를 0으로 초기화
        setCurrentIndex(0);
      }
    }
  }, [contentType, open]);

  const handleAddContent = () => {
    const newContent: ContentItem = {
      titleKo: "",
      titleEn: "",
      descriptionKo: "",
      descriptionEn: "",
      type: (contentType === "BULK_PHOTO" ? "PHOTO" : contentType) as "VIDEO" | "PHOTO" | "ALBUM",
      isPublished: false,
      publishedAt: undefined,
    };

    // 새 오브젬이 추가된 배열 계산
    const updatedItems = [...contentItems, newContent];
    setContentItems(updatedItems);

    // 필터링된 배열 기준으로 마지막 인덱스 설정
    const currentTypeItems = updatedItems.filter(
      (item) => item.type === contentType,
    );
    setCurrentIndex(currentTypeItems.length - 1); // 새로 추가된 항목의 인덱스
  };

  const handleRemoveContent = (actualIndex: number) => {
    const content = contentItems[actualIndex];
    const isEmpty =
      !content.titleKo &&
      !content.titleEn &&
      !content.descriptionKo &&
      !content.descriptionEn &&
      !content.thumbnailImagePath &&
      !content.videoFilePath &&
      !content.imagePath &&
      !content.albumCoverImagePath &&
      (!content.trackList || content.trackList.length === 0);

    if (!isEmpty) {
      setConfirmDialog({
        open: true,
        title: "콘텐츠 삭제",
        description: `정말 ${
          content.titleKo || content.titleEn || `콘텐츠 ${actualIndex + 1}`
        } 콘텐츠를 삭제하시겠습니까?`,
        onConfirm: () => {
          setContentItems((prev) =>
            prev.filter((_, i) => i !== actualIndex || actualIndex === -1),
          );
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        },
        variant: "destructive",
      });
      return;
    }

    setContentItems((prev) =>
      prev.filter((_, i) => i !== actualIndex || actualIndex === -1),
    );

    // 필터링된 배열 기준으로 currentIndex 조정
    const filteredItems = contentItems.filter(
      (item) => item.type === contentType,
    );
    if (currentIndex >= filteredItems.length - 1) {
      setCurrentIndex(Math.max(0, filteredItems.length - 2));
    }
  };

  const handleCloseWithConfirm = () => {
    if ((mode === "create" || mode === "edit") && hasChanges()) {
      setConfirmDialog({
        open: true,
        title: "변경사항 확인",
        description: "변경사항이 저장되지 않았습니다. 정말 닫으시겠습니까?",
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          onOpenChange(false);
        },
        variant: "destructive",
      });
      return;
    }
    onOpenChange(false);
  };

  const handleUpdateContent = <K extends keyof ContentItem>(
    index: number,
    field: K,
    value: ContentItem[K],
  ) => {
    setContentItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  // 필터링된 인덱스를 사용하는 래퍼 함수
  const handleUpdateCurrentContent = <K extends keyof ContentItem>(
    field: K,
    value: ContentItem[K],
  ) => {
    const actualIndex = getActualIndex(currentIndex);
    if (actualIndex !== -1) {
      handleUpdateContent(actualIndex, field, value);
    }
  };

  const uploadThumbnailFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("10MB 이하의 파일만 업로드 가능합니다.");
      return;
    }

    const actualIndex = getActualIndex(currentIndex);
    if (actualIndex === -1) return;

    try {
      handleUpdateContent(actualIndex, "thumbnailUploading", true);
      handleUpdateContent(actualIndex, "thumbnailProgress", 0);
      const path = await uploadImageFile({
        file,
        jsonWebToken,
        dataCollectionName: "qrCodeContents",
        onProgress: (progress: number) => {
          handleUpdateContent(actualIndex, "thumbnailProgress", progress);
        },
      });
      if (path) {
        handleUpdateContent(actualIndex, "thumbnailImagePath", path);
        toast.success("썸네일 이미지가 업로드되었습니다.");
      }
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      handleUpdateContent(actualIndex, "thumbnailUploading", false);
      handleUpdateContent(actualIndex, "thumbnailProgress", 0);
    }
  };

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadThumbnailFile(file);
  };

  const handleThumbnailDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingThumbnail(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadThumbnailFile(file);
  };

  const uploadVideoFileHandler = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("동영상 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 4000 * 1024 * 1024) {
      toast.error("4000MB 이하의 파일만 업로드 가능합니다.");
      return;
    }

    const actualIndex = getActualIndex(currentIndex);
    if (actualIndex === -1) return;

    try {
      handleUpdateContent(actualIndex, "videoUploading", true);
      handleUpdateContent(actualIndex, "videoProgress", 0);
      const path = await uploadVideoFile({
        file,
        jsonWebToken,
        dataCollectionName: "qrCodeContents",
        onProgress: (progress: number) => {
          handleUpdateContent(actualIndex, "videoProgress", progress);
        },
      });
      if (path) {
        handleUpdateContent(actualIndex, "videoFilePath", path);
        handleUpdateContent(actualIndex, "videoFilename", file.name);
        toast.success("동영상이 업로드되었습니다.");
      }
    } catch {
      toast.error("동영상 업로드에 실패했습니다.");
    } finally {
      handleUpdateContent(actualIndex, "videoUploading", false);
      handleUpdateContent(actualIndex, "videoProgress", 0);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadVideoFileHandler(file);
  };

  const handleVideoDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingVideo(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadVideoFileHandler(file);
  };

  const uploadImageFileHandler = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("100MB 이하의 파일만 업로드 가능합니다.");
      return;
    }

    const actualIndex = getActualIndex(currentIndex);
    if (actualIndex === -1) return;

    try {
      handleUpdateContent(actualIndex, "imageUploading", true);
      handleUpdateContent(actualIndex, "imageProgress", 0);
      const path = await uploadImageFile({
        file,
        jsonWebToken,
        dataCollectionName: "qrCodeContents",
        onProgress: (progress: number) => {
          handleUpdateContent(actualIndex, "imageProgress", progress);
        },
      });
      if (path) {
        handleUpdateContent(actualIndex, "imagePath", path);
        toast.success("사진이 업로드되었습니다.");
      }
    } catch {
      toast.error("사진 업로드에 실패했습니다.");
    } finally {
      handleUpdateContent(actualIndex, "imageUploading", false);
      handleUpdateContent(actualIndex, "imageProgress", 0);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImageFileHandler(file);
  };

  const handleImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadImageFileHandler(file);
  };

  const uploadBulkPhotos = async (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: 이미지 파일만 업로드 가능합니다.`);
        return false;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name}: 100MB 이하의 파일만 업로드 가능합니다.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const baseIndex = contentItems.length;

    const newItems: ContentItem[] = validFiles.map(() => ({
      titleKo: "",
      titleEn: "",
      descriptionKo: "",
      descriptionEn: "",
      type: "PHOTO" as const,
      isPublished: true,
      isBulk: true,
      imageUploading: true,
      imageProgress: 0,
    }));

    setContentItems((prev: ContentItem[]) => [...prev, ...newItems]);

    let successCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const idx = baseIndex + i;
      try {
        const path = await uploadImageFile({
          file,
          jsonWebToken,
          dataCollectionName: "qrCodeContents",
          onProgress: (progress: number) => {
            setContentItems((prev: ContentItem[]) =>
              prev.map((item: ContentItem, j: number) =>
                j === idx ? { ...item, imageProgress: progress } : item,
              ),
            );
          },
        });
        if (path) {
          setContentItems((prev: ContentItem[]) =>
            prev.map((item: ContentItem, j: number) =>
              j === idx
                ? {
                    ...item,
                    imagePath: path,
                    imageUploading: false,
                    imageProgress: 0,
                  }
                : item,
            ),
          );
          successCount++;
        }
      } catch {
        toast.error(`${file.name} 업로드에 실패했습니다.`);
        setContentItems((prev: ContentItem[]) =>
          prev.map((item: ContentItem, j: number) =>
            j === idx
              ? { ...item, imageUploading: false, imageProgress: 0 }
              : item,
          ),
        );
      }
    }

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? "사진이 업로드되었습니다."
          : `${successCount}장의 사진이 업로드되었습니다.`,
      );
    }
  };

  const handleBulkPhotoFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files ? Array.from<File>(e.target.files) : [];
    if (files.length === 0) return;
    await uploadBulkPhotos(files);
    e.target.value = "";
  };

  const handleBulkPhotoDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingBulkPhoto(false);
    const files = Array.from<File>(e.dataTransfer.files);
    if (files.length === 0) return;
    await uploadBulkPhotos(files);
  };


  const handleRemoveThumbnail = () => {
    const actualIndex = getActualIndex(currentIndex);
    if (actualIndex === -1) return;

    setConfirmDialog({
      open: true,
      title: "썸네일 삭제",
      description: "썸네일 이미지를 삭제하시겠습니까?",
      onConfirm: () => {
        handleUpdateContent(actualIndex, "thumbnailImagePath", undefined);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
      variant: "destructive",
    });
  };

  const handleRemoveVideo = () => {
    const actualIndex = getActualIndex(currentIndex);
    if (actualIndex === -1) return;

    setConfirmDialog({
      open: true,
      title: "동영상 삭제",
      description: "동영상을 삭제하시겠습니까?",
      onConfirm: () => {
        handleUpdateContent(actualIndex, "videoFilePath", undefined);
        handleUpdateContent(actualIndex, "videoFilename", undefined);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
      variant: "destructive",
    });
  };

  const handleRemoveImage = () => {
    const actualIndex = getActualIndex(currentIndex);
    if (actualIndex === -1) return;

    setConfirmDialog({
      open: true,
      title: "사진 삭제",
      description: "사진을 삭제하시겠습니까?",
      onConfirm: () => {
        handleUpdateContent(actualIndex, "imagePath", undefined);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
      variant: "destructive",
    });
  };

  const uploadAlbumCoverFileHandler = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("10MB 이하의 파일만 업로드 가능합니다.");
      return;
    }

    const actualIndex = getActualIndex(currentIndex);
    if (actualIndex === -1) return;

    try {
      // 업로드 시작 상태로 설정
      setContentItems((prev) => {
        const updated = [...prev];
        if (updated[actualIndex]) {
          updated[actualIndex] = {
            ...updated[actualIndex],
            albumCoverUploading: true,
            albumCoverProgress: 0,
          };
        }
        return updated;
      });

      const path = await uploadImageFile({
        file,
        jsonWebToken,
        dataCollectionName: "qrCodeContents",
        onProgress: (progress) => {
          setContentItems((prev) => {
            const updated = [...prev];
            if (updated[actualIndex]) {
              updated[actualIndex] = {
                ...updated[actualIndex],
                albumCoverProgress: progress,
              };
            }
            return updated;
          });
        },
      });
      if (path) {
        setContentItems((prev) => {
          const updated = [...prev];
          if (updated[actualIndex]) {
            updated[actualIndex] = {
              ...updated[actualIndex],
              albumCoverImagePath: path,
              albumCoverUploading: false,
              albumCoverProgress: 0,
            };
          }
          return updated;
        });
        toast.success("앨범 커버 이미지가 업로드되었습니다.");
      }
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
      setContentItems((prev) => {
        const updated = [...prev];
        if (updated[actualIndex]) {
          updated[actualIndex] = {
            ...updated[actualIndex],
            albumCoverUploading: false,
            albumCoverProgress: 0,
          };
        }
        return updated;
      });
    }
  };

  const handleAlbumCoverUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAlbumCoverFileHandler(file);
  };

  const handleAlbumCoverDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAlbumCover(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadAlbumCoverFileHandler(file);
  };

  const handleTrackDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    trackIndex: number,
  ) => {
    e.preventDefault();
    setIsDraggingTrack(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await handleAudioUpload(trackIndex, file);
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(url);
        resolve(Math.round(audio.duration));
      });

      audio.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        reject(new Error("오디오 파일을 로드할 수 없습니다."));
      });

      audio.src = url;
    });
  };

  const handleAudioUpload = async (trackIndex: number, file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("오디오 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error("500MB 이하의 파일만 업로드 가능합니다.");
      return;
    }

    const actualIndex = getActualIndex(currentIndex);
    if (actualIndex === -1) return;

    const currentContent = contentItems[actualIndex];
    if (!currentContent.trackList) return;

    try {
      // 트랙 업로드 상태 업데이트
      const newTrackList = [...currentContent.trackList];
      newTrackList[trackIndex] = {
        ...newTrackList[trackIndex],
        trackUploading: true,
        trackProgress: 0,
      };
      handleUpdateContent(actualIndex, "trackList", newTrackList);

      const path = await uploadAudioFile({
        file,
        jsonWebToken,
        dataCollectionName: "qrCodeContents",
        onProgress: (progress: number) => {
          setContentItems((prev) => {
            const updated = [...prev];
            if (updated[actualIndex]?.trackList) {
              const updatedTrackList = [...updated[actualIndex].trackList];
              updatedTrackList[trackIndex] = {
                ...updatedTrackList[trackIndex],
                trackProgress: progress,
              };
              updated[actualIndex] = {
                ...updated[actualIndex],
                trackList: updatedTrackList,
              };
            }
            return updated;
          });
        },
      });

      if (path) {
        const finalTrackList = [...(contentItems[actualIndex].trackList || [])];

        // 재생시간 자동 추출 (파일 업로드 시 항상 추출)
        let audioDuration = 0;
        try {
          audioDuration = await getAudioDuration(file);
          toast.success(
            `트랙 ${trackIndex + 1} 오디오가 업로드되었습니다. (재생시간: ${audioDuration}초)`,
          );
        } catch (error) {
          console.error("Failed to extract audio duration:", error);
          // 실패 시 기존 값 유지
          audioDuration = finalTrackList[trackIndex].durationSeconds || 0;
          toast.success(`트랙 ${trackIndex + 1} 오디오가 업로드되었습니다.`);
        }

        finalTrackList[trackIndex] = {
          ...finalTrackList[trackIndex],
          trackFilename: file.name,
          trackFilePath: path,
          durationSeconds: audioDuration,
          trackUploading: false,
          trackProgress: 0,
        };
        handleUpdateContent(actualIndex, "trackList", finalTrackList);
      }
    } catch (error) {
      console.error("Audio upload error:", error);
      toast.error("오디오 업로드에 실패했습니다.");

      const errorTrackList = [...(contentItems[actualIndex].trackList || [])];
      errorTrackList[trackIndex] = {
        ...errorTrackList[trackIndex],
        trackUploading: false,
        trackProgress: 0,
      };
      handleUpdateContent(actualIndex, "trackList", errorTrackList);
    }
  };

  const handleSave = async () => {
    if (!jsonWebToken) {
      toast.error("인증 정보가 없습니다.");
      return;
    }

    // contentItems.length가 0이면 모든 콘텐츠 삭제
    if (contentItems.length === 0) {
      setSaving(true);
      try {
        // 원본에 있던 모든 콘텐츠 삭제
        for (const originalContent of originalContentItems) {
          if (originalContent._id) {
            await deleteQRCodeContent({
              qrCodeId,
              qrCodeContentId: originalContent._id,
              jsonWebToken,
            });
          }
        }

        toast.success("콘텐츠가 업데이트되었습니다.");
        onSuccess();
        onOpenChange(false);
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("콘텐츠 업데이트 중 오류가 발생했습니다.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // 유효성 검사 (타입별로 필터링하여 검사)
    const videoContents = contentItems.filter((item) => item.type === "VIDEO");
    const photoContents = contentItems.filter((item) => item.type === "PHOTO");

    // VIDEO 콘텐츠 유효성 검사
    for (let i = 0; i < videoContents.length; i++) {
      const content = videoContents[i];
      const contentLabel =
        content.titleKo || content.titleEn
          ? `클립의 '${content.titleKo || content.titleEn}' 콘텐츠`
          : `${i + 1}번째 클립`;

      if (!content.titleKo && !content.titleEn) {
        toast.error(`${i + 1}번째 클립의 제목을 입력해주세요.`);
        return;
      }
      if (!content.thumbnailImagePath) {
        toast.error(`${contentLabel}의 썸네일 이미지를 업로드해주세요.`);
        return;
      }
      if (!content.videoFilePath) {
        toast.error(`${contentLabel}의 동영상을 업로드해주세요.`);
        return;
      }
    }

    // PHOTO 콘텐츠 유효성 검사
    if (photoContents.some((c) => c.imageUploading)) {
      toast.error("사진 업로드가 완료될 때까지 기다려주세요.");
      return;
    }
    // 단일 사진(non-bulk)은 imagePath 필수 - BULK_PHOTO 모드에서는 체크 생략
    if (contentType !== "BULK_PHOTO") {
      const singlePhotoContents = photoContents.filter((c) => !c.isBulk);
      for (let i = 0; i < singlePhotoContents.length; i++) {
        if (!singlePhotoContents[i].imagePath) {
          toast.error(`${i + 1}번째 사진의 이미지를 업로드해주세요.`);
          return;
        }
      }
    }

    // ALBUM 콘텐츠 유효성 검사
    const albumContents = contentItems.filter((item) => item.type === "ALBUM");
    for (let i = 0; i < albumContents.length; i++) {
      const content = albumContents[i];
      const contentLabel =
        content.titleKo || content.titleEn
          ? `앨범의 '${content.titleKo || content.titleEn}' 콘텐츠`
          : `${i + 1}번째 앨범`;

      if (!content.titleKo && !content.titleEn) {
        toast.error(`${i + 1}번째 앨범의 제목을 입력해주세요.`);
        return;
      }
      if (!content.albumCoverImagePath) {
        toast.error(`${contentLabel}의 앨범 커버 이미지를 업로드해주세요.`);
        return;
      }
      if (!content.trackList || content.trackList.length === 0) {
        toast.error(`${contentLabel}의 트랙을 최소 1개 이상 추가해주세요.`);
        return;
      }
      // 각 트랙 유효성 검사
      for (let j = 0; j < content.trackList.length; j++) {
        const track = content.trackList[j];
        if (!track.titleKo && !track.titleEn) {
          toast.error(`${contentLabel}의 트랙 ${j + 1}번 제목을 입력해주세요.`);
          return;
        }
        if (!track.trackFilePath) {
          toast.error(
            `${contentLabel}의 트랙 ${j + 1}번 오디오 파일을 업로드해주세요.`,
          );
          return;
        }
      }
    }

    setSaving(true);
    try {
      // 1. 삭제된 콘텐츠 찾기 및 삭제
      const deletedContents = originalContentItems.filter(
        (original) =>
          !contentItems.find((current) => current._id === original._id),
      );

      for (const content of deletedContents) {
        if (content._id) {
          await deleteQRCodeContent({
            qrCodeId,
            qrCodeContentId: content._id,
            jsonWebToken,
          });
        }
      }

      // 2. 생성 및 수정 처리
      for (const content of contentItems) {
        if (content._id) {
          // 기존 콘텐츠 수정
          const originalContent = originalContentItems.find(
            (c) => c._id === content._id,
          );

          if (originalContent) {
            // 변경 사항이 있는지 확인
            const hasChanges =
              JSON.stringify(content) !== JSON.stringify(originalContent);

            // 변경 사항이 있을 때만 업데이트
            if (hasChanges) {
              const updateBody: {
                titleI18n: { ko: string; en: string };
                descriptionI18n: { ko: string; en: string };
                isPublished: boolean;
                publishedAt?: string;
                video?: {
                  thumbnailImageOriginalPath: string;
                  videoFilePath: string;
                  videoFilename: string;
                };
                photo?: {
                  imageOriginalPath: string;
                };
                album?: {
                  imageOriginalPath: string;
                  trackList: Array<{
                    number: number;
                    isMainTitle: string;
                    isTitle: number;
                    titleI18n?: { ko?: string; en?: string };
                    descriptionI18n?: { ko?: string; en?: string };
                    artistNameI18n?: { ko?: string; en?: string };
                    durationSeconds: number;
                    trackFilename: string;
                    trackFilePath: string;
                  }>;
                };
              } = {
                titleI18n: {
                  ko: content.titleKo,
                  en: content.titleEn,
                },
                descriptionI18n: {
                  ko: content.descriptionKo,
                  en: content.descriptionEn,
                },
                isPublished: content.isPublished,
                publishedAt: content.publishedAt,
              };

              if (
                content.type === "VIDEO" &&
                content.thumbnailImagePath &&
                content.videoFilePath &&
                content.videoFilename
              ) {
                updateBody.video = {
                  thumbnailImageOriginalPath: content.thumbnailImagePath,
                  videoFilePath: content.videoFilePath,
                  videoFilename: content.videoFilename,
                };
              } else if (content.type === "PHOTO" && content.imagePath) {
                updateBody.photo = {
                  imageOriginalPath: content.imagePath,
                };
              } else if (
                content.type === "ALBUM" &&
                content.albumCoverImagePath &&
                content.trackList
              ) {
                updateBody.album = {
                  imageOriginalPath: content.albumCoverImagePath,
                  trackList: content.trackList.map((track) => ({
                    number: track.number,
                    isMainTitle: track.isMainTitle,
                    isTitle: track.isTitle,
                    titleI18n: {
                      ko: track.titleKo,
                      en: track.titleEn,
                    },
                    descriptionI18n: {
                      ko: track.descriptionKo,
                      en: track.descriptionEn,
                    },
                    artistNameI18n: {
                      ko: track.artistNameKo,
                      en: track.artistNameEn,
                    },
                    durationSeconds: track.durationSeconds,
                    trackFilename: track.trackFilename,
                    trackFilePath: track.trackFilePath,
                  })),
                };
              }

              await putQRCodeContent({
                qrCodeId,
                qrCodeContentId: content._id,
                body: updateBody,
                jsonWebToken,
              });
            }
          }
        } else {
          // imagePath 없는 PHOTO 항목(업로드 실패 등) 건너뜀
          if (content.type === "PHOTO" && !content.imagePath) continue;

          // 새 콘텐츠 생성
          const createBody: {
            titleI18n: { ko: string; en: string };
            descriptionI18n: { ko: string; en: string };
            type: "VIDEO" | "PHOTO" | "ALBUM";
            isPublished: boolean;
            publishedAt?: string;
            video?: {
              thumbnailImageOriginalPath: string;
              videoFilePath: string;
              videoFilename: string;
            };
            photo?: {
              imageOriginalPath: string;
            };
            album?: {
              imageOriginalPath: string;
              trackList: Array<{
                number: number;
                isMainTitle: string;
                isTitle: number;
                titleI18n?: { ko?: string; en?: string };
                descriptionI18n?: { ko?: string; en?: string };
                artistNameI18n?: { ko?: string; en?: string };
                durationSeconds: number;
                trackFilename: string;
                trackFilePath: string;
              }>;
            };
          } = {
            titleI18n: {
              ko: content.titleKo,
              en: content.titleEn,
            },
            descriptionI18n: {
              ko: content.descriptionKo,
              en: content.descriptionEn,
            },
            type: content.type as "VIDEO" | "PHOTO" | "ALBUM",
            isPublished: content.isPublished,
            publishedAt: content.publishedAt,
          };

          if (
            content.type === "VIDEO" &&
            content.thumbnailImagePath &&
            content.videoFilePath &&
            content.videoFilename
          ) {
            createBody.video = {
              thumbnailImageOriginalPath: content.thumbnailImagePath,
              videoFilePath: content.videoFilePath,
              videoFilename: content.videoFilename,
            };
          } else if (content.type === "PHOTO" && content.imagePath) {
            createBody.photo = {
              imageOriginalPath: content.imagePath,
            };
          } else if (
            content.type === "ALBUM" &&
            content.albumCoverImagePath &&
            content.trackList
          ) {
            createBody.album = {
              imageOriginalPath: content.albumCoverImagePath,
              trackList: content.trackList.map((track) => ({
                number: track.number,
                isMainTitle: track.isMainTitle,
                isTitle: track.isTitle,
                titleI18n: {
                  ko: track.titleKo,
                  en: track.titleEn,
                },
                descriptionI18n: {
                  ko: track.descriptionKo,
                  en: track.descriptionEn,
                },
                artistNameI18n: {
                  ko: track.artistNameKo,
                  en: track.artistNameEn,
                },
                durationSeconds: track.durationSeconds,
                trackFilename: track.trackFilename,
                trackFilePath: track.trackFilePath,
              })),
            };
          }

          await postQRCodeContent({
            qrCodeId,
            body: createBody,
            jsonWebToken,
          });
        }
      }

      toast.success("콘텐츠가 업데이트되었습니다.");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("콘텐츠 업데이트 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = async () => {
    if (!contentItems[0]._id || !jsonWebToken) return;

    setConfirmDialog({
      open: true,
      title: "콘텐츠 삭제",
      description: "정말 이 콘텐츠를 삭제하시겠습니까?",
      onConfirm: async () => {
        setSaving(true);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await deleteQRCodeContent({
            qrCodeId,
            qrCodeContentId: contentItems[0]._id!,
            jsonWebToken,
          });

          toast.success("콘텐츠가 삭제되었습니다.");
          onSuccess();
          onOpenChange(false);
        } catch {
          toast.error("콘텐츠 삭제에 실패했습니다.");
        } finally {
          setSaving(false);
        }
      },
      variant: "destructive",
    });
  };

  // 현재 타입의 콘텐츠만 필터링
  const filteredContentItems = contentItems.filter(
    (item) => item.type === contentType,
  );
  const currentContent = filteredContentItems[currentIndex];

  // 필터링된 인덱스를 전체 배열 인덱스로 변환하는 헬퍼 함수
  const getActualIndex = (filteredIndex: number): number => {
    if (filteredIndex < 0 || filteredIndex >= filteredContentItems.length)
      return -1;
    const targetItem = filteredContentItems[filteredIndex];
    return contentItems.findIndex((item) => item === targetItem);
  };

  // 현재 선택된 콘텐츠의 실제 인덱스
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const actualCurrentIndex = getActualIndex(currentIndex);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            // 닫기 시도 시 확인
            handleCloseWithConfirm();
          } else {
            onOpenChange(open);
          }
        }}
      >
        <DialogContent
          className="max-w-[95vw] w-full lg:max-w-6xl max-h-[90vh] overflow-y-auto mx-4"
          onInteractOutside={(e) => {
            if (mode !== "view") {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button
                variant={contentType === "VIDEO" ? "default" : "outline"}
                onClick={() => setContentType("VIDEO")}
                className="w-fit"
              >
                {`클립 ${
                  mode === "create" ? "추가" : mode === "edit" ? "수정" : ""
                }`}
              </Button>
              <Button
                variant={contentType === "PHOTO" ? "default" : "outline"}
                onClick={() => setContentType("PHOTO")}
                className="w-fit"
              >
                {`사진 ${
                  mode === "create" ? "추가" : mode === "edit" ? "수정" : ""
                }`}
              </Button>
              <Button
                variant={contentType === "BULK_PHOTO" ? "default" : "outline"}
                onClick={() => setContentType("BULK_PHOTO")}
                className="w-fit"
              >
                사진 여러장 추가
              </Button>
              <Button
                variant={contentType === "ALBUM" ? "default" : "outline"}
                onClick={() => setContentType("ALBUM")}
                className="w-fit"
              >
                {`앨범 ${
                  mode === "create" ? "추가" : mode === "edit" ? "수정" : ""
                }`}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 콘텐츠 탭 - BULK_PHOTO 모드 제외 */}
            {contentType !== "BULK_PHOTO" && (
            <div className="flex items-center gap-2 flex-wrap">
              {filteredContentItems.map((content, index) => (
                <div key={index} className="relative">
                  <Button
                    variant={currentIndex === index ? "default" : "outline"}
                    onClick={() => setCurrentIndex(index)}
                    className={mode !== "view" ? "pr-8" : ""}
                  >
                    {content.titleKo ||
                      content.titleEn ||
                      `콘텐츠 ${index + 1}`}
                  </Button>
                  {mode !== "view" && filteredContentItems.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // 전체 배열에서의 실제 인덱스 찾기
                        const actualIndex = contentItems.findIndex(
                          (item) => item === content,
                        );
                        handleRemoveContent(actualIndex);
                      }}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2",
                        currentIndex === index ? "text-black" : "text-white",
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {mode !== "view" && (
                <Button
                  variant="outline"
                  onClick={handleAddContent}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  콘텐츠 추가
                </Button>
              )}
            </div>
            )}

            {/* 콘텐츠 입력 폼 - BULK_PHOTO 모드 제외 */}
            {contentType !== "BULK_PHOTO" && (!currentContent ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">콘텐츠가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 제목 */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>제목 (한국어)</Label>
                    <Input
                      value={currentContent.titleKo}
                      onChange={(e) =>
                        handleUpdateCurrentContent("titleKo", e.target.value)
                      }
                      placeholder="한국어 제목 입력"
                      readOnly={mode === "view"}
                      className={
                        mode === "view" ? "cursor-default opacity-100" : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>제목 (영어)</Label>
                    <Input
                      value={currentContent.titleEn}
                      onChange={(e) =>
                        handleUpdateCurrentContent("titleEn", e.target.value)
                      }
                      placeholder="영어 제목 입력"
                      readOnly={mode === "view"}
                      className={
                        mode === "view" ? "cursor-default opacity-100" : ""
                      }
                    />
                  </div>
                </div>

                {/* VIDEO 타입 */}
                {currentContent.type === "VIDEO" && (
                  <>
                    {/* 썸네일 이미지 */}
                    <div className="space-y-2">
                      <Label>썸네일 이미지</Label>
                      {mode === "view" ? (
                        /* view 모드: 읽기 전용 */
                        currentContent.thumbnailImagePath ? (
                          <div
                            className="flex items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setImagePreviewUrl(
                                `${STORAGE_URL}/${currentContent.thumbnailImagePath}`,
                              );
                              setImagePreviewOpen(true);
                            }}
                          >
                            <div className="relative aspect-video bg-muted rounded-md overflow-hidden max-h-60 w-full">
                              <Image
                                src={`${STORAGE_URL}/${
                                  currentContent.thumbnailImage512Path ||
                                  currentContent.thumbnailImagePath ||
                                  ""
                                }`}
                                alt="썸네일"
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-6">
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                              <Upload className="h-12 w-12 mb-4" />
                              <p className="text-sm">썸네일 이미지 없음</p>
                            </div>
                          </div>
                        )
                      ) : (
                        /* create/edit 모드: 업로드 가능 */
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                            isDraggingThumbnail
                              ? "border-primary bg-primary/10"
                              : ""
                          }`}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            setIsDraggingThumbnail(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDraggingThumbnail(false);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={handleThumbnailDrop}
                        >
                          {currentContent.thumbnailUploading &&
                          currentContent.thumbnailProgress !== undefined ? (
                            <div className="space-y-4">
                              <div className="flex flex-col items-center justify-center py-8">
                                <Upload className="h-12 w-12 text-primary mb-4 animate-pulse" />
                                <p className="text-sm font-medium mb-2">
                                  썸네일 업로드 중...{" "}
                                  {currentContent.thumbnailProgress}%
                                </p>
                                <Progress
                                  value={currentContent.thumbnailProgress}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          ) : currentContent.thumbnailImagePath ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center">
                                <div className="relative aspect-video bg-muted rounded-md overflow-hidden max-h-60 w-full">
                                  <Image
                                    src={`${STORAGE_URL}/${currentContent.thumbnailImagePath}`}
                                    alt="썸네일"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    document
                                      .getElementById("thumbnail-upload")
                                      ?.click()
                                  }
                                  className="flex-1"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  썸네일 재업로드
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleRemoveThumbnail}
                                  className="flex-1"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  삭제
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="flex flex-col items-center justify-center py-8 cursor-pointer"
                              onClick={() =>
                                document
                                  .getElementById("thumbnail-upload")
                                  ?.click()
                              }
                            >
                              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                              <p className="text-sm font-medium mb-1">
                                클릭 또는 드래그하여 썸네일 이미지 업로드
                              </p>
                              <p className="text-xs text-muted-foreground">
                                JPG, PNG (10MB 이하)
                              </p>
                            </div>
                          )}
                          <input
                            id="thumbnail-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleThumbnailUpload}
                            disabled={currentContent.thumbnailUploading}
                          />
                        </div>
                      )}
                    </div>

                    {/* 동영상 */}
                    <div className="space-y-2">
                      <Label>동영상</Label>
                      {mode === "view" ? (
                        /* view 모드: 읽기 전용 */
                        currentContent.videoFilePath ? (
                          <div className="border-2 border-dashed rounded-lg p-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-center">
                                <div className="aspect-video bg-black rounded-md overflow-hidden max-h-90 w-full">
                                  <video
                                    controls
                                    className="w-full h-full"
                                    src={`${STORAGE_URL}/${currentContent.videoFilePath}`}
                                  />
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground text-center">
                                {currentContent.videoFilename}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-6">
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                              <Video className="h-12 w-12 mb-4" />
                              <p className="text-sm">동영상 없음</p>
                            </div>
                          </div>
                        )
                      ) : (
                        /* create/edit 모드: 업로드 가능 */
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                            isDraggingVideo
                              ? "border-primary bg-primary/10"
                              : ""
                          }`}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            setIsDraggingVideo(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDraggingVideo(false);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={handleVideoDrop}
                        >
                          {currentContent.videoUploading &&
                          currentContent.videoProgress !== undefined ? (
                            <div className="space-y-4">
                              <div className="flex flex-col items-center justify-center py-8">
                                <Video className="h-12 w-12 text-primary mb-4 animate-pulse" />
                                <p className="text-sm font-medium mb-2">
                                  동영상 업로드 중...{" "}
                                  {currentContent.videoProgress}%
                                </p>
                                <Progress
                                  value={currentContent.videoProgress}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          ) : currentContent.videoFilePath ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center">
                                <div className="aspect-video bg-black rounded-md overflow-hidden max-h-90 w-full">
                                  <video
                                    controls
                                    className="w-full h-full"
                                    src={`${STORAGE_URL}/${currentContent.videoFilePath}`}
                                  />
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground text-center">
                                {currentContent.videoFilename}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    document
                                      .getElementById("video-upload")
                                      ?.click()
                                  }
                                  className="flex-1"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  동영상 재업로드
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleRemoveVideo}
                                  className="flex-1"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  삭제
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="flex flex-col items-center justify-center py-8 cursor-pointer"
                              onClick={() =>
                                document.getElementById("video-upload")?.click()
                              }
                            >
                              <Video className="h-12 w-12 text-muted-foreground mb-4" />
                              <p className="text-sm font-medium mb-1">
                                클릭 또는 드래그하여 동영상 업로드
                              </p>
                              <p className="text-xs text-muted-foreground">
                                동영상 파일 (4000MB 이하)
                              </p>
                            </div>
                          )}
                          <input
                            id="video-upload"
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={handleVideoUpload}
                            disabled={currentContent.videoUploading}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* PHOTO 타입 */}
                {currentContent.type === "PHOTO" && (
                  <div className="space-y-2">
                    <Label>사진</Label>
                    {mode === "view" ? (
                      /* view 모드: 읽기 전용 */
                      currentContent.imagePath ? (
                        <div
                          className="flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors rounded-lg p-2"
                          onClick={() => {
                            setImagePreviewUrl(
                              `${STORAGE_URL}/${currentContent.imagePath}`,
                            );
                            setImagePreviewOpen(true);
                          }}
                        >
                          <div className="relative aspect-video bg-muted rounded-md overflow-hidden max-h-100 w-full">
                            <Image
                              src={`${STORAGE_URL}/${
                                currentContent.image512Path ||
                                currentContent.imagePath ||
                                ""
                              }`}
                              alt="사진"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-6">
                          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <ImageIcon className="h-12 w-12 mb-4" />
                            <p className="text-sm">사진 없음</p>
                          </div>
                        </div>
                      )
                    ) : (
                      /* create/edit 모드: 업로드 가능 */
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                          isDraggingImage ? "border-primary bg-primary/10" : ""
                        }`}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setIsDraggingImage(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingImage(false);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={handleImageDrop}
                      >
                        {currentContent.imageUploading &&
                        currentContent.imageProgress !== undefined ? (
                          <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center py-8">
                              <ImageIcon className="h-12 w-12 text-primary mb-4 animate-pulse" />
                              <p className="text-sm font-medium mb-2">
                                사진 업로드 중... {currentContent.imageProgress}
                                %
                              </p>
                              <Progress
                                value={currentContent.imageProgress}
                                className="w-full"
                              />
                            </div>
                          </div>
                        ) : currentContent.imagePath ? (
                          <div className="space-y-4">
                            <div className="relative aspect-video bg-muted rounded-md overflow-hidden max-h-100 w-full">
                              <Image
                                src={`${STORAGE_URL}/${currentContent.imagePath}`}
                                alt="사진"
                                fill
                                className="object-contain"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() =>
                                  document
                                    .getElementById("image-upload")
                                    ?.click()
                                }
                                className="flex-1"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                사진 재업로드
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleRemoveImage}
                                className="flex-1"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex flex-col items-center justify-center py-8 cursor-pointer"
                            onClick={() =>
                              document.getElementById("image-upload")?.click()
                            }
                          >
                            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-sm font-medium mb-1">
                              클릭 또는 드래그하여 사진 업로드
                            </p>
                            <p className="text-xs text-muted-foreground">
                              JPG, PNG (100MB 이하)
                            </p>
                          </div>
                        )}
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={currentContent.imageUploading}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ALBUM 타입 */}
                {currentContent.type === "ALBUM" && (
                  <>
                    <div className="space-y-2">
                      <Label>앨범 커버 이미지</Label>
                      {mode === "view" ? (
                        currentContent.albumCoverImagePath ? (
                          <div
                            className="flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors rounded-lg p-2"
                            onClick={() => {
                              setImagePreviewUrl(
                                `${STORAGE_URL}/${currentContent.albumCoverImagePath}`,
                              );
                              setImagePreviewOpen(true);
                            }}
                          >
                            <div className="relative aspect-square bg-muted rounded-md overflow-hidden max-h-80 w-full max-w-sm">
                              <Image
                                src={`${STORAGE_URL}/${
                                  currentContent.albumCoverImage512Path ||
                                  currentContent.albumCoverImagePath ||
                                  ""
                                }`}
                                alt="앨범 커버"
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-6">
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                              <ImageIcon className="h-12 w-12 mb-4" />
                              <p className="text-sm">앨범 커버 없음</p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                            isDraggingAlbumCover
                              ? "border-primary bg-primary/10"
                              : ""
                          }`}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            setIsDraggingAlbumCover(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDraggingAlbumCover(false);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={handleAlbumCoverDrop}
                        >
                          {currentContent.albumCoverUploading &&
                          currentContent.albumCoverProgress !== undefined ? (
                            <div className="space-y-4">
                              <div className="flex flex-col items-center justify-center py-8">
                                <ImageIcon className="h-12 w-12 text-primary mb-4 animate-pulse" />
                                <p className="text-sm font-medium mb-2">
                                  앨범 커버 업로드 중...{" "}
                                  {currentContent.albumCoverProgress}%
                                </p>
                                <Progress
                                  value={currentContent.albumCoverProgress}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          ) : currentContent.albumCoverImagePath ? (
                            <div className="space-y-4">
                              <div className="relative aspect-square bg-muted rounded-md overflow-hidden max-h-80 w-full max-w-sm mx-auto">
                                <Image
                                  src={`${STORAGE_URL}/${currentContent.albumCoverImagePath}`}
                                  alt="앨범 커버"
                                  fill
                                  className="object-contain"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    document
                                      .getElementById("album-cover-upload")
                                      ?.click()
                                  }
                                  className="flex-1"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  커버 재업로드
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    handleUpdateCurrentContent(
                                      "albumCoverImagePath",
                                      undefined,
                                    )
                                  }
                                  className="flex-1"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  삭제
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="flex flex-col items-center justify-center py-8 cursor-pointer"
                              onClick={() =>
                                document
                                  .getElementById("album-cover-upload")
                                  ?.click()
                              }
                            >
                              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                              <p className="text-sm font-medium mb-1">
                                클릭하여 앨범 커버 업로드
                              </p>
                              <p className="text-xs text-muted-foreground">
                                또는 드래그앤드롭 (JPG, PNG, 10MB 이하)
                              </p>
                            </div>
                          )}
                          <input
                            id="album-cover-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAlbumCoverUpload}
                          />
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                          트랙 리스트
                        </Label>
                        {mode !== "view" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const actualIndex = getActualIndex(currentIndex);
                              if (actualIndex === -1) return;

                              const newTrack = {
                                number:
                                  (currentContent.trackList?.length || 0) + 1,
                                isMainTitle: "",
                                isTitle: 0,
                                titleKo: "",
                                titleEn: "",
                                descriptionKo: "",
                                descriptionEn: "",
                                artistNameKo: "",
                                artistNameEn: "",
                                durationSeconds: 0,
                                trackFilename: "",
                                trackFilePath: "",
                              };

                              handleUpdateContent(actualIndex, "trackList", [
                                ...(currentContent.trackList || []),
                                newTrack,
                              ]);
                            }}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            트랙 추가
                          </Button>
                        )}
                      </div>

                      {!currentContent.trackList ||
                      currentContent.trackList.length === 0 ? (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                          <p>트랙이 없습니다. 트랙을 추가해주세요.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {currentContent.trackList.map((track, trackIndex) => (
                            <Card key={trackIndex} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-end">
                                  {mode !== "view" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const actualIndex =
                                          getActualIndex(currentIndex);
                                        if (actualIndex === -1) return;

                                        const newTrackList =
                                          currentContent.trackList?.filter(
                                            (_, i) => i !== trackIndex,
                                          ) || [];

                                        // 트랙 번호 재정렬
                                        newTrackList.forEach((t, i) => {
                                          t.number = i + 1;
                                        });

                                        handleUpdateContent(
                                          actualIndex,
                                          "trackList",
                                          newTrackList,
                                        );
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">트랙 번호</Label>
                                  <Input
                                    type="number"
                                    value={track.number}
                                    onChange={(e) => {
                                      const actualIndex =
                                        getActualIndex(currentIndex);
                                      if (actualIndex === -1) return;

                                      const newTrackList = [
                                        ...(currentContent.trackList || []),
                                      ];
                                      newTrackList[trackIndex] = {
                                        ...track,
                                        number: parseInt(e.target.value) || 1,
                                      };

                                      handleUpdateContent(
                                        actualIndex,
                                        "trackList",
                                        newTrackList,
                                      );
                                    }}
                                    placeholder="트랙 번호"
                                    readOnly={mode === "view"}
                                    className="text-sm"
                                    min="1"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">
                                      제목 (한국어)
                                    </Label>
                                    <Input
                                      value={track.titleKo}
                                      onChange={(e) => {
                                        const actualIndex =
                                          getActualIndex(currentIndex);
                                        if (actualIndex === -1) return;

                                        const newTrackList = [
                                          ...(currentContent.trackList || []),
                                        ];
                                        newTrackList[trackIndex] = {
                                          ...track,
                                          titleKo: e.target.value,
                                        };

                                        handleUpdateContent(
                                          actualIndex,
                                          "trackList",
                                          newTrackList,
                                        );
                                      }}
                                      placeholder="트랙 제목 (한국어)"
                                      readOnly={mode === "view"}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">
                                      제목 (영어)
                                    </Label>
                                    <Input
                                      value={track.titleEn}
                                      onChange={(e) => {
                                        const actualIndex =
                                          getActualIndex(currentIndex);
                                        if (actualIndex === -1) return;

                                        const newTrackList = [
                                          ...(currentContent.trackList || []),
                                        ];
                                        newTrackList[trackIndex] = {
                                          ...track,
                                          titleEn: e.target.value,
                                        };

                                        handleUpdateContent(
                                          actualIndex,
                                          "trackList",
                                          newTrackList,
                                        );
                                      }}
                                      placeholder="트랙 제목 (영어)"
                                      readOnly={mode === "view"}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs">
                                        아티스트 (한국어)
                                      </Label>
                                      {mode !== "view" &&
                                        track.artistNameKo &&
                                        currentContent.trackList &&
                                        currentContent.trackList.some(
                                          (t) => !t.artistNameKo,
                                        ) && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs px-2"
                                            onClick={() => {
                                              const actualIndex =
                                                getActualIndex(currentIndex);
                                              if (actualIndex === -1) return;

                                              const newTrackList =
                                                currentContent.trackList?.map(
                                                  (t) => ({
                                                    ...t,
                                                    artistNameKo:
                                                      t.artistNameKo ||
                                                      track.artistNameKo,
                                                  }),
                                                ) || [];

                                              handleUpdateContent(
                                                actualIndex,
                                                "trackList",
                                                newTrackList,
                                              );
                                            }}
                                          >
                                            빈 칸 채우기
                                          </Button>
                                        )}
                                    </div>
                                    <Input
                                      value={track.artistNameKo}
                                      onChange={(e) => {
                                        const actualIndex =
                                          getActualIndex(currentIndex);
                                        if (actualIndex === -1) return;

                                        const newTrackList = [
                                          ...(currentContent.trackList || []),
                                        ];
                                        newTrackList[trackIndex] = {
                                          ...track,
                                          artistNameKo: e.target.value,
                                        };

                                        handleUpdateContent(
                                          actualIndex,
                                          "trackList",
                                          newTrackList,
                                        );
                                      }}
                                      placeholder="아티스트 이름 (한국어)"
                                      readOnly={mode === "view"}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs">
                                        아티스트 (영어)
                                      </Label>
                                      {mode !== "view" &&
                                        track.artistNameEn &&
                                        currentContent.trackList &&
                                        currentContent.trackList.some(
                                          (t) => !t.artistNameEn,
                                        ) && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs px-2"
                                            onClick={() => {
                                              const actualIndex =
                                                getActualIndex(currentIndex);
                                              if (actualIndex === -1) return;

                                              const newTrackList =
                                                currentContent.trackList?.map(
                                                  (t) => ({
                                                    ...t,
                                                    artistNameEn:
                                                      t.artistNameEn ||
                                                      track.artistNameEn,
                                                  }),
                                                ) || [];

                                              handleUpdateContent(
                                                actualIndex,
                                                "trackList",
                                                newTrackList,
                                              );
                                            }}
                                          >
                                            빈 칸 채우기
                                          </Button>
                                        )}
                                    </div>
                                    <Input
                                      value={track.artistNameEn}
                                      onChange={(e) => {
                                        const actualIndex =
                                          getActualIndex(currentIndex);
                                        if (actualIndex === -1) return;

                                        const newTrackList = [
                                          ...(currentContent.trackList || []),
                                        ];
                                        newTrackList[trackIndex] = {
                                          ...track,
                                          artistNameEn: e.target.value,
                                        };

                                        handleUpdateContent(
                                          actualIndex,
                                          "trackList",
                                          newTrackList,
                                        );
                                      }}
                                      placeholder="아티스트 이름 (영어)"
                                      readOnly={mode === "view"}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">
                                    재생시간 (초)
                                  </Label>
                                  <Input
                                    type="number"
                                    value={track.durationSeconds}
                                    onChange={(e) => {
                                      const actualIndex =
                                        getActualIndex(currentIndex);
                                      if (actualIndex === -1) return;

                                      const newTrackList = [
                                        ...(currentContent.trackList || []),
                                      ];
                                      newTrackList[trackIndex] = {
                                        ...track,
                                        durationSeconds:
                                          parseInt(e.target.value) || 0,
                                      };

                                      handleUpdateContent(
                                        actualIndex,
                                        "trackList",
                                        newTrackList,
                                      );
                                    }}
                                    placeholder="재생시간 (초)"
                                    readOnly={mode === "view"}
                                    className="text-sm"
                                  />
                                </div>

                                {track.trackFilePath && (
                                  <div className="space-y-1">
                                    <Label className="text-xs">미리듣기</Label>
                                    <audio
                                      controls
                                      className="w-full h-10"
                                      src={`${STORAGE_URL}/${track.trackFilePath}`}
                                      preload="metadata"
                                    >
                                      브라우저가 오디오 재생을 지원하지
                                      않습니다.
                                    </audio>
                                  </div>
                                )}

                                <div className="flex gap-4">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`isTitle-${trackIndex}`}
                                      checked={track.isTitle === 1}
                                      onCheckedChange={(checked) => {
                                        const actualIndex =
                                          getActualIndex(currentIndex);
                                        if (actualIndex === -1) return;

                                        const newTrackList = [
                                          ...(currentContent.trackList || []),
                                        ];
                                        newTrackList[trackIndex] = {
                                          ...track,
                                          isTitle: checked ? 1 : 0,
                                        };

                                        handleUpdateContent(
                                          actualIndex,
                                          "trackList",
                                          newTrackList,
                                        );
                                      }}
                                      disabled={mode === "view"}
                                    />
                                    <Label
                                      htmlFor={`isTitle-${trackIndex}`}
                                      className="text-xs cursor-pointer"
                                    >
                                      타이틀곡
                                    </Label>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`isMainTitle-${trackIndex}`}
                                      checked={track.isMainTitle === "Y"}
                                      onCheckedChange={(checked) => {
                                        const actualIndex =
                                          getActualIndex(currentIndex);
                                        if (actualIndex === -1) return;

                                        const newTrackList = [
                                          ...(currentContent.trackList || []),
                                        ];
                                        newTrackList[trackIndex] = {
                                          ...track,
                                          isMainTitle: checked ? "Y" : "",
                                        };

                                        handleUpdateContent(
                                          actualIndex,
                                          "trackList",
                                          newTrackList,
                                        );
                                      }}
                                      disabled={mode === "view"}
                                    />
                                    <Label
                                      htmlFor={`isMainTitle-${trackIndex}`}
                                      className="text-xs cursor-pointer"
                                    >
                                      메인 타이틀곡
                                    </Label>
                                  </div>
                                </div>

                                {mode !== "view" && (
                                  <div className="space-y-1">
                                    <Label className="text-xs">
                                      오디오 파일
                                    </Label>
                                    {track.trackUploading &&
                                    track.trackProgress !== undefined ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Upload className="h-4 w-4 text-primary animate-pulse" />
                                          <span className="text-sm">
                                            업로드 중... {track.trackProgress}%
                                          </span>
                                        </div>
                                        <Progress
                                          value={track.trackProgress}
                                          className="h-2"
                                        />
                                      </div>
                                    ) : (
                                      <>
                                        <div
                                          className={`border-2 border-dashed rounded-lg p-3 transition-colors ${
                                            isDraggingTrack === trackIndex
                                              ? "border-primary bg-primary/10"
                                              : "border-border"
                                          }`}
                                          onDragEnter={(e) => {
                                            e.preventDefault();
                                            setIsDraggingTrack(trackIndex);
                                          }}
                                          onDragLeave={(e) => {
                                            e.preventDefault();
                                            setIsDraggingTrack(null);
                                          }}
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                          }}
                                          onDrop={(e) =>
                                            handleTrackDrop(e, trackIndex)
                                          }
                                        >
                                          <div className="flex gap-2">
                                            <Input
                                              value={
                                                track.trackFilename ||
                                                "파일 선택 안됨"
                                              }
                                              readOnly
                                              className="text-sm"
                                            />
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                document
                                                  .getElementById(
                                                    `audio-upload-${trackIndex}`,
                                                  )
                                                  ?.click();
                                              }}
                                            >
                                              <Upload className="h-4 w-4 mr-1" />
                                              {track.trackFilename
                                                ? "재업로드"
                                                : "업로드"}
                                            </Button>
                                          </div>
                                          <input
                                            id={`audio-upload-${trackIndex}`}
                                            type="file"
                                            accept="audio/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                handleAudioUpload(
                                                  trackIndex,
                                                  file,
                                                );
                                              }
                                            }}
                                          />
                                          <p className="text-xs text-muted-foreground mt-2">
                                            클릭 또는 드래그하여 오디오 업로드
                                            (MP3, WAV, M4A, 500MB 이하)
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 설명 */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>설명 (한국어)</Label>
                    <Textarea
                      value={currentContent.descriptionKo}
                      onChange={(e) =>
                        handleUpdateCurrentContent(
                          "descriptionKo",
                          e.target.value,
                        )
                      }
                      placeholder="한국어 설명 입력"
                      rows={4}
                      readOnly={mode === "view"}
                      className={
                        mode === "view" ? "cursor-default opacity-100" : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>설명 (영어)</Label>
                    <Textarea
                      value={currentContent.descriptionEn}
                      onChange={(e) =>
                        handleUpdateCurrentContent(
                          "descriptionEn",
                          e.target.value,
                        )
                      }
                      placeholder="영어 설명 입력"
                      rows={4}
                      readOnly={mode === "view"}
                      className={
                        mode === "view" ? "cursor-default opacity-100" : ""
                      }
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                {/* 공개 여부 */}
                <div className="flex items-center gap-4">
                  <Label className="text-base">공개 여부</Label>
                  <Switch
                    checked={currentContent.isPublished}
                    onCheckedChange={(checked) =>
                      handleUpdateCurrentContent("isPublished", checked)
                    }
                    disabled={mode === "view"}
                  />
                </div>

                {/* 공개 일시 */}
                {currentContent?.isPublished && (
                  <div className="space-y-2">
                    <Label>공개 일시</Label>
                    <Input
                      type="datetime-local"
                      value={
                        currentContent.publishedAt
                          ? moment(currentContent.publishedAt).format(
                              "YYYY-MM-DDTHH:mm",
                            )
                          : ""
                      }
                      onChange={(e) => {
                        handleUpdateCurrentContent(
                          "publishedAt",
                          e.target.value
                            ? moment(e.target.value).toISOString()
                            : undefined,
                        );
                      }}
                      placeholder="공개 일시 선택"
                      className={
                        mode === "view"
                          ? "w-fit cursor-default opacity-100"
                          : "w-fit"
                      }
                      readOnly={mode === "view"}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* 여러 장 사진 업로드 섹션 (BULK_PHOTO 모드) */}
            {contentType === "BULK_PHOTO" && (
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center justify-between">
                  <Label className="text-base">여러 장 사진 업로드</Label>
                  {contentItems.filter((i) => i.type === "PHOTO" && i.imagePath).length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {contentItems.filter((i) => i.type === "PHOTO" && i.imagePath).length}장
                    </span>
                  )}
                </div>

                {mode !== "view" && (
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer ${
                      isDraggingBulkPhoto ? "border-primary bg-primary/10" : ""
                    }`}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setIsDraggingBulkPhoto(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingBulkPhoto(false);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleBulkPhotoDrop}
                    onClick={() =>
                      document.getElementById("bulk-photo-upload")?.click()
                    }
                  >
                    <div className="flex flex-col items-center justify-center py-3">
                      <Plus className="h-7 w-7 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">
                        클릭 또는 드래그하여 사진 여러 장 추가
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG (100MB 이하, 여러 장 동시 선택 가능)
                      </p>
                    </div>
                    <input
                      id="bulk-photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleBulkPhotoFileSelect}
                    />
                  </div>
                )}

                {contentItems.filter((i) => i.type === "PHOTO" && (i.imagePath || i.imageUploading)).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {contentItems
                      .map((item, actualIdx) => ({ item, actualIdx }))
                      .filter(({ item }) => item.type === "PHOTO" && (item.imagePath || item.imageUploading))
                      .map(({ item, actualIdx }, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square bg-muted rounded-md overflow-hidden border"
                        >
                          {item.imageUploading ? (
                            <div className="flex flex-col items-center justify-center h-full p-2">
                              <ImageIcon className="h-5 w-5 text-primary animate-pulse mb-1" />
                              <Progress
                                value={item.imageProgress ?? 0}
                                className="w-full"
                              />
                              <p className="text-xs mt-0.5 text-muted-foreground">
                                {item.imageProgress ?? 0}%
                              </p>
                            </div>
                          ) : item.imagePath ? (
                            <>
                              <Image
                                src={`${STORAGE_URL}/${item.image512Path || item.imagePath}`}
                                alt={`사진 ${idx + 1}`}
                                fill
                                className="object-cover cursor-pointer"
                                onClick={() => {
                                  setImagePreviewUrl(
                                    `${STORAGE_URL}/${item.imagePath}`,
                                  );
                                  setImagePreviewOpen(true);
                                }}
                              />
                              {mode !== "view" && (
                                <button
                                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/90 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveContent(actualIdx);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </>
                          ) : null}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* 버튼 */}
            {mode === "view" ? (
              <div className="flex justify-between">
                <div />
                <div className="flex gap-2">
                  <Button onClick={() => setDialogMode("edit")}>
                    수정하기
                  </Button>
                  <Button variant="outline" onClick={handleCloseWithConfirm}>
                    닫기
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                {/* <div>
                {mode === "edit" && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={saving}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </Button>
                )}
              </div> */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (mode === "edit") {
                        // 변경사항 확인
                        if (hasChanges()) {
                          setConfirmDialog({
                            open: true,
                            title: "변경사항 취소",
                            description:
                              "변경사항을 취소하고 이전 상태로 돌아가시겠습니까?",
                            onConfirm: () => {
                              // 원본 데이터로 복원
                              setContentItems([...originalContentItems]);
                              setDialogMode("view");
                              setConfirmDialog((prev) => ({
                                ...prev,
                                open: false,
                              }));
                            },
                            variant: "destructive",
                          });
                          return;
                        }
                        // 원본 데이터로 복원
                        setContentItems([...originalContentItems]);
                        setDialogMode("view");
                      } else {
                        handleCloseWithConfirm();
                      }
                    }}
                    disabled={saving}
                  >
                    취소
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 이미지 프리뷰 다이얼로그 */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogTitle />
        <DialogContent
          id="preview"
          showCloseButton={true}
          className="sm:max-w-[95vw] w-fit h-[auto] max-h-[95vh] p-0 border-none shadow-none flex justify-center items-center"
        >
          <div className="flex items-center justify-center w-full h-full">
            {imagePreviewUrl && (
              <Image
                src={imagePreviewUrl}
                alt="이미지 확대 보기"
                width={2000}
                height={2000}
                className="w-auto h-auto object-contain"
                style={{
                  maxWidth: "95vw",
                  maxHeight: "95vh",
                  width: "auto",
                  height: "auto",
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 확인 다이얼로그 */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </>
  );
}
