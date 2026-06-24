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
import {
  ArrowLeft,
  QrCode,
  Save,
  Plus,
  X,
  Upload,
  Trash2,
  Loader2,
} from "lucide-react";
import { createQRCode, updateQRCode, getQRCodeDetail } from "../actions";
import { toast } from "sonner";
import { CATEGORY_OPTIONS } from "@/lib/consts";
import { uploadImageFile } from "@/app/actions";
import { STORAGE_URL } from "@/lib/api";
import Image from "next/image";
import {
  MultiLanguageText,
  QRCodeFormData,
  QRCodeUploadedImage,
  QRCodeCategory,
} from "@/lib/types";
import { useQRCodeStore } from "@/store/qrCodeStore";

// 썸네일 이미지 추가, 적립태그 추가

export default function CreateQRCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Next.js 15 권장: useSearchParams hook 사용
  const isUpdateMode = searchParams.get("isUpdate") === "true";
  const qrCodeId = searchParams.get("id");

  const jsonWebToken = useAuthStore((state) => state.token);

  const { addQRCode, updateQRCode: updateQRCodeStore } = useQRCodeStore();

  const [loading, setLoading] = useState(false); // 저장 로딩
  const [dataLoading, setDataLoading] = useState(false); // 데이터 로딩
  const [formData, setFormData] = useState<QRCodeFormData>({
    category: "",
    point: 10,
    expireMinutes: 0,
    issuedCount: 1, // 인증가능한 횟수
    hashCount: 1, // 발급할 해시 개수
    isHashReusable: false, // 해시 재활용 가능 여부
    isEnabled: true, // QR 코드 활성화 여부
  });

  const [displayMainTitleList, setDisplayMainTitleList] = useState<
    MultiLanguageText[]
  >([{ ko: "", en: "" }]);

  const [displaySubTitleList, setDisplaySubTitleList] = useState<
    MultiLanguageText[]
  >([{ ko: "", en: "" }]);

  const [displayTextList, setDisplayTextList] = useState<MultiLanguageText[]>([
    { ko: "", en: "" },
  ]);

  const [image, setImage] = useState<QRCodeUploadedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 수정 모드인 경우 기존 데이터 로드
  useEffect(() => {
    const loadExistingData = async () => {
      if (isUpdateMode && qrCodeId && jsonWebToken) {
        try {
          setDataLoading(true);
          const existingQRCode = await getQRCodeDetail({
            qrCodeId,
            jsonWebToken,
          });

          if (existingQRCode) {
            setFormData({
              category: existingQRCode.category,
              point: existingQRCode.point,
              expireMinutes: existingQRCode?.expireMinutes,
              issuedCount: existingQRCode.issuedCount,
              hashCount: existingQRCode.hashCount || 1,
              isHashReusable: Boolean(
                (existingQRCode as unknown as Record<string, unknown>)
                  .isHashReusable,
              ),
              isEnabled: Boolean(existingQRCode.isEnabled ?? true),
            });

            // 기존 메인 타이틀 로드
            if (
              existingQRCode.displayMainTitleList &&
              existingQRCode.displayMainTitleList.length > 0
            ) {
              setDisplayMainTitleList(
                existingQRCode.displayMainTitleList.map(
                  (title: MultiLanguageText) => ({
                    ko: title.ko || "",
                    en: title.en || "",
                  }),
                ),
              );
            }

            // 기존 서브 타이틀 로드
            if (
              existingQRCode.displaySubTitleList &&
              existingQRCode.displaySubTitleList.length > 0
            ) {
              setDisplaySubTitleList(
                existingQRCode.displaySubTitleList.map(
                  (title: MultiLanguageText) => ({
                    ko: title.ko || "",
                    en: title.en || "",
                  }),
                ),
              );
            }

            // 기존 설명 텍스트 로드
            if (
              existingQRCode.displayTextList &&
              existingQRCode.displayTextList.length > 0
            ) {
              setDisplayTextList(
                existingQRCode.displayTextList.map(
                  (text: MultiLanguageText) => ({
                    ko: text.ko || "",
                    en: text.en || "",
                  }),
                ),
              );
            }

            // 기존 이미지 로드
            if (
              existingQRCode.imageList &&
              existingQRCode.imageList.length > 0
            ) {
              const existingImage = existingQRCode.imageList[0];
              setImage({
                id: Date.now().toString(),
                file: null, // 이미 업로드된 파일이므로 null
                path: existingImage.imageOriginalPath,
                progress: 100,
                isUploading: false,
              });
            }
          }
        } catch (error) {
          console.error("Failed to load QR code data:", error);
          toast.error("QR 코드 데이터 로드에 실패했습니다.");
        } finally {
          setDataLoading(false);
        }
      }
    };

    loadExistingData();
  }, [isUpdateMode, qrCodeId, jsonWebToken]);

  const handleAddLanguageField = (
    list: MultiLanguageText[],
    setList: React.Dispatch<React.SetStateAction<MultiLanguageText[]>>,
  ) => {
    setList([...list, { ko: "", en: "" }]);
  };

  const handleRemoveLanguageField = (
    index: number,
    list: MultiLanguageText[],
    setList: React.Dispatch<React.SetStateAction<MultiLanguageText[]>>,
  ) => {
    if (list.length > 1) {
      const newList = list.filter((_, i) => i !== index);
      setList(newList);
    }
  };

  const handleLanguageFieldChange = (
    index: number,
    field: "ko" | "en",
    value: string,
    list: MultiLanguageText[],
    setList: React.Dispatch<React.SetStateAction<MultiLanguageText[]>>,
  ) => {
    const newList = [...list];
    newList[index][field] = value;
    setList(newList);
  };

  // 이미지 업로드 함수
  const handleImageUpload = async (file: File) => {
    if (!jsonWebToken) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    try {
      const newImage: QRCodeUploadedImage = {
        id: Date.now().toString(),
        file,
        progress: 0,
        isUploading: true,
      };

      setImage(newImage);

      try {
        const path = await uploadImageFile({
          file,
          jsonWebToken,
          dataCollectionName: "qrCodes",
        });

        setImage((prev) =>
          prev ? { ...prev, path, isUploading: false } : null,
        );
        toast.success("이미지가 업로드되었습니다.");
      } catch (error) {
        console.error("Image upload error:", error);
        setImage((prev) =>
          prev ? { ...prev, error: "업로드 실패", isUploading: false } : null,
        );
        toast.error("이미지 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("Image validation error:", error);
      toast.error("유효하지 않은 이미지 파일입니다.");
    }
  };

  // 이미지 제거 함수
  const handleImageRemove = () => {
    setImage(null);
  };

  // 드래그 앤 드롭 핸들러
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

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
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

    // 메인 타이틀 필수 검사
    const validMainTitleList = displayMainTitleList.filter(
      (item) => item.ko.trim() && item.en.trim(),
    );
    if (validMainTitleList.length === 0) {
      toast.error("메인 타이틀은 한국어와 영어 모두 입력해주세요.");
      return;
    }

    // 새로운 필드들 유효성 검사
    if (formData.hashCount < 1) {
      toast.error("해시 개수는 1 이상이어야 합니다.");
      return;
    }

    if (formData.issuedCount < 1) {
      toast.error("인증 가능 횟수는 1 이상이어야 합니다.");
      return;
    }

    if (formData.issuedCount < formData.hashCount) {
      toast.error("인증 가능 횟수는 해시 개수보다 크거나 같아야 합니다.");
      return;
    }

    // 필수 필드인 displayTextList 검증
    const validDisplayTextList = displayTextList.filter(
      (item) => item.ko.trim() || item.en.trim(),
    );
    // if (validDisplayTextList.length === 0) {
    //   toast.error("설명 텍스트를 최소 하나는 입력해주세요.");
    //   return;
    // }

    // 이미지 업로드 상태 검증
    if (image?.isUploading) {
      toast.error("이미지 업로드가 완료될 때까지 기다려주세요.");
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        category: formData.category as QRCodeCategory,
        point: formData.point,
        displayTextList: validDisplayTextList,
        expireMinutes: formData?.expireMinutes || null,
        issuedCount: formData.issuedCount,
        hashCount: formData.hashCount,
        isHashReusable: formData.isHashReusable,
        isEnabled: formData.isEnabled,
        ...(displayMainTitleList.some((item) => item.ko || item.en) && {
          displayMainTitleList: displayMainTitleList.filter(
            (item) => item.ko || item.en,
          ),
        }),
        ...(displaySubTitleList.some((item) => item.ko || item.en) && {
          displaySubTitleList: displaySubTitleList.filter(
            (item) => item.ko || item.en,
          ),
        }),
        ...(image?.path && {
          imageList: [
            {
              name: image.file?.name || "qr-image",
              imageOriginalPath: image.path,
            },
          ],
        }),
      };

      let result;
      if (isUpdateMode && qrCodeId) {
        result = await updateQRCode({
          id: qrCodeId,
          body: requestBody,
          jsonWebToken,
        });
      } else {
        result = await createQRCode({
          body: requestBody,
          jsonWebToken,
        });
      }

      if (result) {
        toast.success(
          isUpdateMode
            ? "QR 코드가 성공적으로 수정되었습니다."
            : "QR 코드가 성공적으로 생성되었습니다.",
        );

        if (isUpdateMode) {
          updateQRCodeStore(result._id, result);
        } else {
          addQRCode(result);
        }
        router.replace(`/dashboard/qr-codes/${result._id}`);
      } else {
        toast.error(
          isUpdateMode
            ? "QR 코드 수정에 실패했습니다."
            : "QR 코드 생성에 실패했습니다.",
        );
      }
    } catch (error) {
      console.error("QR code operation error:", error);
      toast.error(
        isUpdateMode
          ? "QR 코드 수정에 실패했습니다."
          : "QR 코드 생성에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderLanguageFields = (
    title: string,
    list: MultiLanguageText[],
    setList: React.Dispatch<React.SetStateAction<MultiLanguageText[]>>,
    isRequired = false,
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          {title} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddLanguageField(list, setList)}
          className="flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          추가
        </Button>
      </div>

      {list.map((item, index) => (
        <div key={index} className="flex gap-2 items-start">
          <div className="flex-1 space-y-2">
            <Input
              placeholder="한국어"
              value={item.ko}
              onChange={(e) =>
                handleLanguageFieldChange(
                  index,
                  "ko",
                  e.target.value,
                  list,
                  setList,
                )
              }
            />
            <Input
              placeholder="English"
              value={item.en}
              onChange={(e) =>
                handleLanguageFieldChange(
                  index,
                  "en",
                  e.target.value,
                  list,
                  setList,
                )
              }
            />
          </div>
          {list.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveLanguageField(index, list, setList)}
              className="mt-1"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );

  // 수정 모드에서 데이터 로딩 중일 때 로딩 화면 표시
  if (isUpdateMode && dataLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">
              QR 코드 정보를 불러오는 중입니다...
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
            {isUpdateMode ? "QR 코드 수정" : "QR 코드 생성"}
          </h1>
          <p className="text-muted-foreground">
            {isUpdateMode
              ? "기존 QR 코드를 수정합니다"
              : "새로운 QR 코드를 생성합니다"}
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
                  <Label htmlFor="category">
                    카테고리 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: QRCodeCategory) => {
                      setFormData({
                        ...formData,
                        category: value,
                        ...(value === "PLATFORM_ALBUM" ||
                        value === "CONTENTS_ALBUM" ||
                        value === "CONTENTS_GOODS"
                          ? { isHashReusable: false }
                          : {}),
                      });
                    }}
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
                    value={formData.point || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        point: val === "" ? 0 : parseInt(val) || 0,
                      });
                    }}
                    onBlur={(e) => {
                      const numVal = parseInt(e.target.value);
                      if (isNaN(numVal) || numVal < 1) {
                        setFormData({
                          ...formData,
                          point: 10,
                        });
                      }
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="expireMinutes">만료 시간 (분)</Label>
                  <Input
                    id="expireMinutes"
                    type="number"
                    min={0}
                    value={formData?.expireMinutes || ""}
                    placeholder="0"
                    disabled={isUpdateMode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        expireMinutes: val === "" ? 0 : parseInt(val) || 0,
                      });
                    }}
                    onBlur={(e) => {
                      const numVal = parseInt(e.target.value);
                      if (isNaN(numVal) || numVal < 0) {
                        setFormData({
                          ...formData,
                          expireMinutes: 0,
                        });
                      }
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    기본값: 0 (무제한)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 해시 및 인증 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>해시 및 인증 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!isUpdateMode && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hashCount">
                      발급할 해시 개수 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="hashCount"
                      type="number"
                      min="1"
                      value={formData.hashCount || ""}
                      disabled={isUpdateMode}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newHashCount =
                          val === "" ? 0 : parseInt(val) || 0;
                        setFormData({
                          ...formData,
                          hashCount: newHashCount,
                          // 해시 개수가 변경되면 인증 횟수도 최소값으로 조정
                          // 해시 재사용 불가능한 경우 issuedCount는 항상 hashCount와 동일
                          issuedCount: !formData.isHashReusable
                            ? newHashCount
                            : Math.max(formData.issuedCount, newHashCount),
                        });
                      }}
                      onBlur={(e) => {
                        const numVal = parseInt(e.target.value);
                        if (isNaN(numVal) || numVal < 1) {
                          setFormData({
                            ...formData,
                            hashCount: 1,
                            issuedCount: !formData.isHashReusable
                              ? 1
                              : Math.max(formData.issuedCount, 1),
                          });
                        }
                      }}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      생성할 해시의 개수를 설정합니다
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="issuedCount">
                    총 인증 가능 횟수 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="issuedCount"
                    min={formData.hashCount}
                    value={formData.issuedCount || ""}
                    disabled={!formData?.isHashReusable}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        issuedCount: val === "" ? 0 : parseInt(val) || 0,
                      });
                    }}
                    onBlur={(e) => {
                      const numVal = parseInt(e.target.value);
                      if (isNaN(numVal) || numVal < formData.hashCount) {
                        setFormData({
                          ...formData,
                          issuedCount: formData.hashCount,
                        });
                      }
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    해시 개수보다 크거나 같아야 합니다
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="isHashReusable">해시 중복인증 여부</Label>
                  <Select
                    value={formData.isHashReusable ? "true" : "false"}
                    disabled={
                      isUpdateMode ||
                      formData.category === "PLATFORM_ALBUM" ||
                      formData.category === "CONTENTS_ALBUM" ||
                      formData.category === "CONTENTS_GOODS"
                    }
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        isHashReusable: value === "true",
                        ...(value === "false" && {
                          issuedCount: formData.hashCount,
                        }),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">불가능</SelectItem>
                      <SelectItem value="true">가능</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.isHashReusable
                      ? "한 개의 해쉬로 여러명이 인증할 수 있어요"
                      : "한 개의 해쉬로 한명만 인증할 수 있어요"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 이미지 업로드 */}
          <Card>
            <CardHeader>
              <CardTitle>썸네일 이미지</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!image ? (
                  <div
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2">
                      {isDragging
                        ? "이미지를 놓으세요"
                        : "이미지를 업로드하세요"}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      360x360 픽셀 비율 (드래그 앤 드롭 또는 파일 선택)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("image-input")?.click()
                      }
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      이미지 업로드
                    </Button>
                    <input
                      id="image-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <div className="w-32 h-32 relative overflow-hidden">
                      <Image
                        src={
                          image.file
                            ? URL.createObjectURL(image.file)
                            : image.path
                              ? `${STORAGE_URL}/${image.path}`
                              : ""
                        }
                        alt="업로드된 이미지"
                        fill
                        className="object-cover"
                      />
                      {image.isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-white text-sm">업로드 중...</div>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleImageRemove}
                      className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    {image.error && (
                      <p className="text-sm text-red-500 mt-2">{image.error}</p>
                    )}
                    {image.path && (
                      <p className="text-sm text-green-600 mt-2">업로드 완료</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 표시 텍스트 */}
          <Card>
            <CardHeader>
              <CardTitle>표시 텍스트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderLanguageFields(
                "메인 타이틀",
                displayMainTitleList,
                setDisplayMainTitleList,
                true,
              )}
              {renderLanguageFields(
                "서브 타이틀",
                displaySubTitleList,
                setDisplaySubTitleList,
              )}
              {renderLanguageFields(
                "설명 텍스트",
                displayTextList,
                setDisplayTextList,
              )}
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
              disabled={loading || image?.isUploading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading
                ? isUpdateMode
                  ? "수정 중..."
                  : "생성 중..."
                : image?.isUploading
                  ? "이미지 업로드 중..."
                  : isUpdateMode
                    ? "QR 코드 수정"
                    : "QR 코드 생성"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
