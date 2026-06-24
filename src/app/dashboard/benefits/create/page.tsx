"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Gift,
  Users,
  Mail,
  Bell,
  Send,
  Upload,
  X,
  File,
  FileImage,
  FileText,
  BookAlert,
} from "lucide-react";
import { createBenefit } from "../actions";
import { uploadImageFile } from "@/app/actions";
import { toast } from "sonner";
import { CreateBenefitForm, BenefitFilterType } from "@/lib/types";

export default function CreateBenefitPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  const [loading, setLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // 파일 확장자에 따른 아이콘 반환 함수
  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();

    // 이미지 파일
    if (
      ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico"].includes(
        extension || ""
      )
    ) {
      return <FileImage className="w-4 h-4" />;
    }

    // 문서 파일
    if (
      [
        "pdf",
        "doc",
        "docx",
        "txt",
        "rtf",
        "odt",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "hwp",
      ].includes(extension || "")
    ) {
      return <FileText className="w-4 h-4" />;
    }

    // 기본 파일
    return <File className="w-4 h-4" />;
  };

  const [formData, setFormData] = useState<CreateBenefitForm>({
    title: "",
    filter: {
      type: "TOP_RANKING",
      topRanking: 100,
    },
    email: {
      subject: "",
      content: "",
      attachments: [],
    },
    pushNotification: {
      title: "",
      body: "",
    },
  });

  // 이미지 파일 확장자 체크
  const isImageFile = (filename: string): boolean => {
    const extension = filename.split(".").pop()?.toLowerCase();
    return [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "webp",
      "svg",
      "ico",
      "tiff",
      "tif",
    ].includes(extension || "");
  };

  // 파일 크기 체크 (5MB 제한)
  const isValidFileSize = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    return file.size <= maxSize;
  };

  // 파일 크기를 읽기 쉬운 형태로 변환
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 범용 파일 업로드 함수
  const uploadFile = async (file: File) => {
    if (!jsonWebToken) {
      toast.error("인증 토큰이 없습니다.");
      return null;
    }

    // 파일 유효성 검사
    if (!isImageFile(file.name)) {
      toast.error(`이미지 파일만 업로드 가능합니다. (${file.name})`);
      return null;
    }

    if (!isValidFileSize(file)) {
      toast.error(
        `파일 크기가 5MB를 초과합니다. (${file.name}: ${formatFileSize(
          file.size
        )})`
      );
      return null;
    }

    try {
      setFileUploading(true);

      // 통합 이미지 업로드 함수 사용
      const uploadedKey = await uploadImageFile({
        file,
        jsonWebToken,
        dataCollectionName: "benefits",
        onProgress: (progress) => {
          // 진행률 로그 (필요시 UI에 표시 가능)
          console.log(`Upload progress: ${progress}%`);
        },
      });

      return {
        name: file.name,
        path: `/${uploadedKey}`, // 업로드된 파일의 key (경로)
      };
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(`파일 업로드 실패: ${file.name}`);
      return null;
    } finally {
      setFileUploading(false);
    }
  };

  // 파일 선택 처리
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const uploadPromises = Array.from(files).map((file) => uploadFile(file));
    const results = await Promise.all(uploadPromises);

    const successfulUploads = results.filter((result) => result !== null);

    if (successfulUploads.length > 0) {
      setFormData((prev) => ({
        ...prev,
        email: {
          ...prev.email,
          attachments: [
            ...(prev.email.attachments || []),
            ...successfulUploads,
          ],
        },
      }));

      toast.success(`${successfulUploads.length}개 파일이 업로드되었습니다.`);
    }
  };

  // 파일 탐색기 열기 (이미지만)
  const handleFileAdd = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*"; // 이미지 파일만 허용
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      handleFileSelect(target.files);
    };
    input.click();
  };

  // 드래그 이벤트 처리
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // 파일 제거 함수
  const handleFileRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        attachments: (prev.email.attachments || []).filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  const handleFilterTypeChange = (type: BenefitFilterType) => {
    setFormData((prev) => ({
      ...prev,
      filter: {
        type,
        ...(type === "TOP_RANKING" ? { topRanking: 100 } : {}),
        ...(type === "USER_CREATED_AT"
          ? {
              userCreatedAtFrom: "",
              userCreatedAtTo: "",
            }
          : {}),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jsonWebToken) {
      toast.error("인증 토큰이 없습니다.");
      return;
    }

    // 필수 필드 검증
    if (!formData.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    if (!formData.email.subject.trim()) {
      toast.error("이메일 제목을 입력해주세요.");
      return;
    }

    if (!formData.email.content.trim()) {
      toast.error("이메일 내용을 입력해주세요.");
      return;
    }

    if (!formData.pushNotification.title.trim()) {
      toast.error("푸시 알림 제목을 입력해주세요.");
      return;
    }

    if (!formData.pushNotification.body.trim()) {
      toast.error("푸시 알림 내용을 입력해주세요.");
      return;
    }

    // 필터 검증
    if (formData.filter.type === "TOP_RANKING" && !formData.filter.topRanking) {
      toast.error("상위 랭킹 수를 입력해주세요.");
      return;
    }

    if (formData.filter.type === "USER_CREATED_AT") {
      if (
        !formData.filter.userCreatedAtFrom ||
        !formData.filter.userCreatedAtTo
      ) {
        toast.error("사용자 생성일 범위를 입력해주세요.");
        return;
      }
    }

    setLoading(true);
    try {
      const result = await createBenefit({
        body: {
          ...formData,
          email: {
            ...formData.email,
            subject: formData.email.subject.trim(),
            content: formData.email.content.trim(),
          },
          pushNotification: {
            title: formData.pushNotification.title.trim(),
            body: formData.pushNotification.body.trim(),
          },
        },
        jsonWebToken,
      });

      if (result) {
        toast.success("특전이 성공적으로 생성되어 발송 대기 중입니다.");
        router.push("/dashboard/benefits");
      }
    } catch (error) {
      console.error("Benefit create error:", error);
      toast.error("특전 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">특전 생성</h1>
            <p className="text-muted-foreground">
              필터 조건에 따라 사용자를 선별하여 특전을 발송합니다
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 필터 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              대상 사용자 필터
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">필터 타입</Label>
              <Select
                value={formData.filter.type}
                onValueChange={handleFilterTypeChange}
                disabled={loading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOP_RANKING">상위 랭킹</SelectItem>
                  <SelectItem value="USER_CREATED_AT">가입일 기준</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.filter.type === "TOP_RANKING" && (
              <div>
                <Label className="text-sm font-medium">상위 랭킹 수</Label>
                <Input
                  min="1"
                  value={formData.filter.topRanking || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      filter: {
                        ...prev.filter,
                        topRanking: val === "" ? 0 : parseInt(val) || 0,
                      },
                    }));
                  }}
                  onBlur={(e) => {
                    const numVal = parseInt(e.target.value);
                    if (isNaN(numVal) || numVal < 1) {
                      setFormData((prev) => ({
                        ...prev,
                        filter: {
                          ...prev.filter,
                          topRanking: 100,
                        },
                      }));
                    }
                  }}
                  placeholder="예: 100"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            )}

            {formData.filter.type === "USER_CREATED_AT" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">가입일 시작</Label>
                  <Input
                    type="datetime-local"
                    value={formData.filter.userCreatedAtFrom || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        filter: {
                          ...prev.filter,
                          userCreatedAtFrom: e.target.value,
                        },
                      }))
                    }
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">가입일 종료</Label>
                  <Input
                    type="datetime-local"
                    value={formData.filter.userCreatedAtTo || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        filter: {
                          ...prev.filter,
                          userCreatedAtTo: e.target.value,
                        },
                      }))
                    }
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookAlert className="w-5 h-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emailSubject" className="text-sm font-medium">
                특전 제목 *
              </Label>
              <Input
                id="emailSubject"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="특전 제목"
                disabled={loading}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
        {/* 이메일 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              이메일 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emailSubject" className="text-sm font-medium">
                이메일 제목 *
              </Label>
              <Input
                id="emailSubject"
                value={formData.email.subject}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: {
                      ...prev.email,
                      subject: e.target.value,
                    },
                  }))
                }
                placeholder="특별 혜택 안내"
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="emailContent" className="text-sm font-medium">
                이메일 내용 (HTML 지원) *
              </Label>
              <Textarea
                id="emailContent"
                value={formData.email.content}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: {
                      ...prev.email,
                      content: e.target.value,
                    },
                  }))
                }
                placeholder="안녕하세요! 특별한 혜택을 준비했습니다."
                rows={8}
                disabled={loading}
                className="mt-1 resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  이미지 첨부{" "}
                  <span className="text-xs text-muted-foreground">
                    (최대 5MB)
                  </span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFileAdd}
                  disabled={loading || fileUploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {fileUploading ? "업로드 중..." : "이미지 선택"}
                </Button>
              </div>

              {/* 드래그앤드롭 영역 */}
              <div
                className={`mt-2 border-2 border-dashed rounded-lg transition-colors relative ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                } ${fileUploading ? "opacity-50" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {formData.email.attachments &&
                formData.email.attachments.length > 0 ? (
                  <div className="p-4">
                    <div className="space-y-2">
                      {formData.email.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                        >
                          {getFileIcon(attachment.name)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {attachment.name}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileRemove(index)}
                            disabled={loading || fileUploading}
                            className="hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* 추가 이미지 드롭 영역 */}
                    <div
                      className="mt-4 p-6 text-center text-muted-foreground border-t border-dashed cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={handleFileAdd}
                    >
                      <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        더 많은 이미지를 추가하려면 클릭하거나 드래그하세요
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-8 text-center text-muted-foreground cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={handleFileAdd}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      {dragActive
                        ? "이미지를 여기에 놓으세요"
                        : "이미지를 업로드하세요"}
                    </p>
                    <p className="text-sm">
                      클릭해서 이미지를 선택하거나, 이미지를 여기로 드래그하세요
                    </p>
                    <p className="text-xs mt-2 opacity-75">
                      JPG, PNG, GIF 등 이미지 파일만 업로드 가능 (최대 5MB)
                    </p>
                  </div>
                )}

                {fileUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Upload className="w-5 h-5 animate-bounce" />
                      <span className="font-medium">파일 업로드 중...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 푸시 알림 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              푸시 알림 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pushTitle" className="text-sm font-medium">
                푸시 알림 제목 *
              </Label>
              <Input
                id="pushTitle"
                value={formData.pushNotification.title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pushNotification: {
                      ...prev.pushNotification,
                      title: e.target.value,
                    },
                  }))
                }
                placeholder="특전 혜택 도착!"
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pushBody" className="text-sm font-medium">
                푸시 알림 내용 *
              </Label>
              <Textarea
                id="pushBody"
                value={formData.pushNotification.body}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pushNotification: {
                      ...prev.pushNotification,
                      body: e.target.value,
                    },
                  }))
                }
                placeholder="새로운 특전이 도착했습니다. 지금 확인해보세요!"
                rows={4}
                disabled={loading}
                className="mt-1 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? "생성 중..." : "특전 생성 및 발송"}
          </Button>
        </div>
      </form>
    </div>
  );
}
