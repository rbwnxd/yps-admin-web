"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Coins,
  Loader2,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  User2,
} from "lucide-react";
import { getPointModificationDetail } from "../actions";
import { toast } from "sonner";
import moment from "moment";
import { STORAGE_URL } from "@/lib/api";
import { PointModification } from "@/lib/types";

export default function PointModificationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  const [pointModification, setPointModification] =
    useState<PointModification | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jsonWebToken || !params.id) return;

    const fetchPointModificationDetail = async () => {
      setLoading(true);
      try {
        const result = await getPointModificationDetail({
          pointModificationId: params.id,
          jsonWebToken,
        });

        if (result?.pointModification) {
          setPointModification(result.pointModification);
        } else {
          toast.error("포인트 작업 정보를 찾을 수 없습니다.");
          router.replace("/dashboard/point-modifications");
        }
      } catch (error) {
        console.error("포인트 작업 상세 조회 오류:", error);
        toast.error("포인트 작업 정보 조회에 실패했습니다.");
        router.replace("/dashboard/point-modifications");
      } finally {
        setLoading(false);
      }
    };

    fetchPointModificationDetail();
  }, [jsonWebToken, params.id, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            완료
          </Badge>
        );
      case "SCHEDULED":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            예약됨
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            대기중
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "GRANT") {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <TrendingUp className="w-3 h-3 mr-1" />
          포인트 지급
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <TrendingDown className="w-3 h-3 mr-1" />
          포인트 차감
        </Badge>
      );
    }
  };

  if (!jsonWebToken) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Coins className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              로그인이 필요합니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!pointModification) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Coins className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              포인트 작업을 찾을 수 없습니다
            </p>
            <Button onClick={() => router.back()}>돌아가기</Button>
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
        <Coins className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">포인트 작업 상세</h1>
          <p className="text-muted-foreground">{pointModification.title}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              작업 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(pointModification.type)}
                    {getStatusBadge(pointModification.status)}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      제목
                    </Label>
                    <h2 className="text-xl font-semibold mt-1">
                      {pointModification.title}
                    </h2>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      설명
                    </Label>
                    <p className="mt-1 text-muted-foreground">
                      {pointModification.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        포인트
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-2xl font-bold`}>
                          {pointModification.type === "GRANT" ? "+" : "-"}
                          {pointModification.amount.toLocaleString()}P
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        대상 사용자 수
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold ">
                          {pointModification?.targetUsers?.length?.toLocaleString() ||
                            0}
                          명
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        처리된 사용자 수
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold ">
                          {pointModification?.processedUsers?.length?.toLocaleString() ||
                            0}
                          명
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 실행 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              실행 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  생성일
                </Label>
                <p className="font-medium mt-1">
                  {moment(pointModification.createdAt).format(
                    "YYYY년 MM월 DD일 HH:mm"
                  )}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  최근 수정일
                </Label>
                <p className="font-medium mt-1">
                  {moment(pointModification.updatedAt).format(
                    "YYYY년 MM월 DD일 HH:mm"
                  )}
                </p>
              </div>

              {pointModification.scheduledAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    예약 실행 시간
                  </Label>
                  <p className="font-medium text-blue-600 mt-1">
                    {moment(pointModification.scheduledAt).format(
                      "YYYY년 MM월 DD일 HH:mm"
                    )}
                  </p>
                </div>
              )}

              {pointModification.processedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    처리 시간
                  </Label>
                  <p className="font-medium mt-1">
                    {moment(pointModification.processedAt).format(
                      "YYYY년 MM월 DD일 HH:mm"
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 대상 사용자 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              대상 사용자 (
              {pointModification?.targetUsers?.length?.toLocaleString() || 0}명)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pointModification?.targetUsers?.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/users/${user._id}`)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        user.imageList?.[0]?.image256Path
                          ? `${STORAGE_URL}/${user.imageList[0].image256Path}`
                          : undefined
                      }
                      alt={user.nickname}
                    />
                    <AvatarFallback>
                      <User2 className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.nickname}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pointModification?.processedUsers?.some(
                      (processedUser) => processedUser._id === user._id
                    ) && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">→</div>
                  </div>
                </div>
              ))}
            </div>

            {!pointModification?.targetUsers?.length && (
              <div className="flex flex-col items-center justify-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  대상 사용자가 없습니다
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
