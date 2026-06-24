"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  Gift,
  Users,
  Mail,
  Bell,
  Calendar,
  Filter,
  RefreshCw,
  FileImage,
  FileText,
  File,
  Download,
  BookAlert,
  Loader2,
  User2,
} from "lucide-react";
import { getBenefitDetail } from "../actions";
import { toast } from "sonner";
import { Benefit, BenefitStatus } from "@/lib/types";
import moment from "moment";
import Image from "next/image";
import { STORAGE_URL } from "@/lib/api";

const STATUS_LABELS: Record<BenefitStatus, string> = {
  PENDING: "대기중",
  SCHEDULED: "예약됨",
  PROCESSING: "처리중",
  COMPLETED: "완료",
  CANCELED: "취소됨",
  FAILED: "실패",
};

const STATUS_VARIANTS: Record<
  BenefitStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  SCHEDULED: "secondary",
  PROCESSING: "default",
  COMPLETED: "default",
  CANCELED: "destructive",
  FAILED: "destructive",
};

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
    return <FileText className="w-4 h-4 " />;
  }

  // 기본 파일
  return <File className="w-4 h-4" />;
};

// 파일 다운로드 함수
const handleFileDownload = (path: string, filename: string) => {
  const downloadUrl = `${STORAGE_URL}/${path}`;
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 사용자 테이블 컬럼 정의
type User = {
  _id: string;
  nickname: string;
  imageList: Array<{
    name: string;
    imageOriginalPath: string;
    image64Path: string;
    image128Path: string;
    image256Path: string;
    image512Path: string;
    image1024Path: string;
    imageFilename: string;
  }>;
  createdAt: string;
};

const createUserColumns = (): ColumnDef<User>[] => [
  {
    accessorKey: "imageList",
    header: "프로필",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center justify-center">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {user.imageList && user.imageList.length > 0 ? (
              <Image
                src={`${STORAGE_URL}/${user.imageList[0].image64Path}`}
                alt={user.nickname}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <User2 className="w-5 h-5" />
            )}
          </div>
        </div>
      );
    },
    size: 80,
    enableResizing: false,
  },
  {
    accessorKey: "nickname",
    header: "닉네임",
    cell: ({ row }) => (
      <div className="text-center">
        <p className="font-medium">{row.getValue("nickname")}</p>
      </div>
    ),
    size: 120,
    enableResizing: false,
  },
  {
    accessorKey: "_id",
    header: "사용자 ID",
    cell: ({ row }) => (
      <div className="text-center">
        <p className="font-mono text-sm text-muted-foreground">
          {row.getValue("_id")}
        </p>
      </div>
    ),
    size: 200,
    enableResizing: false,
  },
  {
    accessorKey: "createdAt",
    header: "가입일",
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <Calendar className="w-4 h-4" />
        {moment(row.getValue("createdAt")).format("YYYY-MM-DD HH:mm")}
      </div>
    ),
    size: 120,
    enableResizing: false,
  },
];

export default function BenefitDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  const [benefit, setBenefit] = useState<Benefit | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jsonWebToken || !params.id) return;

    const fetchBenefit = async () => {
      setLoading(true);
      try {
        const result = await getBenefitDetail({
          benefitId: params.id,
          jsonWebToken,
        });

        if (result) {
          setBenefit(result.benefit);
        }
      } catch (error) {
        console.error("Benefit detail fetch error:", error);
        toast.error("특전 상세 정보를 가져올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchBenefit();
  }, [jsonWebToken, params.id]);

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!benefit) {
    return (
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Gift className="w-12 h-12 mb-2 opacity-50" />
          <p>특전을 찾을 수 없습니다.</p>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">특전 상세 정보</h1>
            <p className="text-muted-foreground">
              특전 정보와 대상 사용자를 확인합니다
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookAlert className="w-5 h-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">생성일</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {moment(benefit.createdAt).format("YYYY년 MM월 DD일 HH:mm")}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">대상 사용자 수</p>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4" />
                  {benefit.userIds.length}명
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">상태</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={STATUS_VARIANTS[benefit.status]}>
                    {STATUS_LABELS[benefit.status]}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 필터 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              필터 조건
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">필터 타입</p>
                <Badge variant="outline" className="mt-1">
                  {benefit.filter.type === "TOP_RANKING"
                    ? "상위 랭킹"
                    : "가입일 기준"}
                </Badge>
              </div>

              {benefit.filter.type === "TOP_RANKING" &&
                benefit.filter.topRanking && (
                  <div>
                    <p className="text-sm text-muted-foreground">상위 랭킹</p>
                    <p className="text-lg font-semibold mt-1">
                      상위 {benefit.filter.topRanking}위
                    </p>
                  </div>
                )}

              {benefit.filter.type === "USER_CREATED_AT" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefit.filter.userCreatedAtFrom && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        가입일 시작
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {moment(benefit.filter.userCreatedAtFrom).format(
                          "YYYY년 MM월 DD일 HH:mm"
                        )}
                      </p>
                    </div>
                  )}
                  {benefit.filter.userCreatedAtTo && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        가입일 종료
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {moment(benefit.filter.userCreatedAtTo).format(
                          "YYYY년 MM월 DD일 HH:mm"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 이메일 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              이메일 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">제목</p>
              <p className="text-lg font-semibold mt-1">
                {benefit.email.subject}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">내용</p>
              <div
                className="mt-1 p-4  rounded-lg border prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: benefit?.email?.content?.replace(/\n/g, "<br>"),
                }}
              />
            </div>

            {benefit?.email?.attachments &&
              benefit?.email?.attachments?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">첨부파일</p>
                  <div className="space-y-2 mt-1">
                    {benefit?.email?.attachments?.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() =>
                          handleFileDownload(attachment.path, attachment.name)
                        }
                      >
                        {getFileIcon(attachment.name)}
                        <div className="flex-1">
                          <span className="text-sm font-medium transition-colors">
                            {attachment.name}
                          </span>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* 푸시 알림 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              푸시 알림 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">제목</p>
              <p className="text-lg font-semibold mt-1">
                {benefit.pushNotification.title}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">내용</p>
              <p className="mt-1 p-4  rounded-lg border">
                {benefit.pushNotification.body}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 대상 사용자 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              대상 사용자 목록 ({benefit.users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={createUserColumns()}
              data={benefit.users}
              showColumnToggle={false}
              showPagination={true}
              pageSize={10}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
