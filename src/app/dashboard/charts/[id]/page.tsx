"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import moment from "moment";
import { useAuthStore } from "@/store/authStore";
import { useChartStore } from "@/store/chartStore";
import { ChartItem, AdminChartRankingItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Trophy,
  User,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  getChartRanking,
  deleteSeasonChart,
  updateSeasonChartActivation,
} from "../actions";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { STORAGE_URL } from "@/lib/api";

export default function ChartDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  // Chart Store에서 차트 정보 가져오기
  const { findChartById } = useChartStore();

  // Persist 스토어 하이드레이션
  useEffect(() => {
    useChartStore.persist.rehydrate();
  }, []);

  const [rankings, setRankings] = useState<AdminChartRankingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 시즌 차트 관리 상태
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingActivation, setIsUpdatingActivation] = useState(false);

  // 랭킹 데이터 가져오기
  const fetchRankings = useCallback(
    async (skip = 0, reset = false) => {
      if (!jsonWebToken || !params.id) {
        toast.error("인증 토큰이나 차트 ID가 없습니다.");
        return;
      }

      setIsFetching(true);
      try {
        const result = await getChartRanking({
          chartId: params.id,
          params: {
            __skip: skip,
            __limit: 20,
          },
          jsonWebToken,
        });

        if (result) {
          const newRankings = result.rankings || [];
          if (reset) {
            setRankings(newRankings);
          } else {
            setRankings((prev) => [...prev, ...newRankings]);
          }
          setTotalCount(result.count || 0);
          setHasMore(newRankings.length === 20);
        }
      } catch (error) {
        console.error("Chart ranking fetch error:", error);
        toast.error("차트 랭킹을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsFetching(false);
      }
    },
    [jsonWebToken, params.id]
  );

  useEffect(() => {
    fetchRankings(0, true);
    setCurrentPage(0);
  }, [fetchRankings]);

  const loadMore = () => {
    if (!isFetching && hasMore) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchRankings(newPage * 20, false);
    }
  };

  const getChartTypeLabel = (type: string) => {
    const typeLabels = {
      DAILY_ACCUMULATED: "데일리 누적",
      ALL_TIME_ACCUMULATED: "올타임 누적",
      SEASON: "시즌 차트",
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const getChartTypeVariant = (type: string) => {
    const variants = {
      DAILY_ACCUMULATED: "default" as const,
      ALL_TIME_ACCUMULATED: "secondary" as const,
      SEASON: "outline" as const,
    };
    return variants[type as keyof typeof variants] || "default";
  };

  // Chart Store에서 차트 정보 가져오기
  const chartInfo = findChartById(params.id);

  // 차트 정보가 없으면 기본값 사용 (차트 목록을 먼저 방문하지 않은 경우)
  const defaultChartInfo: ChartItem = {
    _id: params.id,
    nameList: [{ ko: "차트 랭킹", en: "Chart Ranking" }],
    descriptionList: [
      { ko: "사용자 랭킹 정보", en: "User ranking information" },
    ],
    type: "ALL_TIME_ACCUMULATED",
    isActivated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const currentChartInfo = chartInfo || defaultChartInfo;

  // 시즌 차트인지 확인
  const isSeasonChart = currentChartInfo.type === "SEASON";

  // 시즌 차트 삭제 핸들러
  const handleDeleteSeasonChart = async () => {
    if (!jsonWebToken || !params.id) return;

    setIsDeleting(true);
    try {
      await deleteSeasonChart({
        chartId: params.id,
        jsonWebToken,
      });
      toast.success("시즌 차트가 삭제되었습니다.");
      setIsDeleteDialogOpen(false);
      router.push("/dashboard/charts");
    } catch (error) {
      console.error("시즌 차트 삭제 실패:", error);
      toast.error("시즌 차트 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 시즌 차트 활성화 상태 변경 핸들러
  const handleToggleActivation = async (newActivated: boolean) => {
    if (!jsonWebToken || !params.id) return;

    setIsUpdatingActivation(true);
    try {
      const result = await updateSeasonChartActivation({
        chartId: params.id,
        isActivated: newActivated,
        jsonWebToken,
      });
      if (result?.chart) {
        // 차트 스토어 업데이트
        const updatedCharts = useChartStore
          .getState()
          .charts.map((chart) =>
            chart._id === params.id
              ? { ...chart, isActivated: newActivated }
              : chart
          );
        useChartStore.getState().setCharts(updatedCharts);
        toast.success(
          newActivated
            ? "시즌 차트가 활성화되었습니다."
            : "시즌 차트가 비활성화되었습니다."
        );
      }
    } catch (error) {
      console.error("시즌 차트 활성화 상태 변경 실패:", error);
      toast.error("활성화 상태 변경에 실패했습니다.");
    } finally {
      setIsUpdatingActivation(false);
    }
  };

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

        {/* 시즌 차트 관리 버튼 */}
        {isSeasonChart && !currentChartInfo.deletedAt && (
          <div className="flex items-center gap-4">
            {/* 활성화 토글 */}
            <div className="flex items-center gap-2">
              <Label htmlFor="activation-toggle" className="text-sm">
                {currentChartInfo.isActivated ? "활성화" : "비활성화"}
              </Label>
              {isUpdatingActivation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Switch
                  id="activation-toggle"
                  checked={currentChartInfo.isActivated}
                  onCheckedChange={handleToggleActivation}
                  disabled={isUpdatingActivation}
                />
              )}
            </div>

            {/* 삭제 버튼 */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </Button>
          </div>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={getChartTypeVariant(currentChartInfo.type)}>
                {getChartTypeLabel(currentChartInfo.type)}
              </Badge>
              <Badge
                variant={currentChartInfo.isActivated ? "default" : "secondary"}
              >
                {currentChartInfo.isActivated ? "활성화" : "비활성화"}
              </Badge>
            </div>
            <div>
              <CardTitle className="text-2xl">
                {currentChartInfo.nameList[0]?.ko}
              </CardTitle>
              <p className="text-muted-foreground">
                {currentChartInfo.descriptionList[0]?.ko}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentChartInfo.season && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                시작:{" "}
                {moment(currentChartInfo.season.startedAt).format("YYYY-MM-DD")}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                종료:{" "}
                {moment(currentChartInfo.season.endedAt).format("YYYY-MM-DD")}
              </div>
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-2">
            생성일:{" "}
            {moment(currentChartInfo.createdAt).format("YYYY-MM-DD HH:mm")}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span>총 참가자: {totalCount}명</span>
          </div>
        </CardContent>
      </Card>

      {/* 랭킹 목록 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            사용자 랭킹 ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isFetching && rankings.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          ) : rankings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Trophy className="w-12 h-12 mb-2 opacity-50" />
              <p>등록된 랭킹이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankings.map((ranking) => (
                <div
                  key={`${ranking.user._id}-${ranking.index}`}
                  className={`border rounded-lg p-4 hover:bg-muted/30 transition-colors ${
                    ranking.user.deletedAt ? "opacity-50" : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (ranking.user.deletedAt) {
                      toast.error("탈퇴한 사용자입니다");
                      return;
                    }
                    router.push(`/dashboard/users/${ranking.user._id}`);
                  }}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-1">
                    <div className="flex flex-row flex-1 items-center gap-2 lg:gap-4">
                      {/* 프로필 이미지 */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-background border">
                        {ranking.user.imageList &&
                        ranking.user.imageList.length > 0 ? (
                          <Image
                            src={`${STORAGE_URL}/${ranking.user.imageList[0].image64Path}`}
                            alt={ranking.user.nickname || "사용자"}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>

                      {/* 사용자 정보 */}
                      <div className="flex-1 break-all">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              ranking.ranking <= 3 ? "default" : "outline"
                            }
                            className={
                              ranking.ranking === 1
                                ? "bg-yellow-500"
                                : ranking.ranking === 2
                                ? "bg-gray-400 "
                                : ranking.ranking === 3
                                ? "bg-amber-600 "
                                : ""
                            }
                          >
                            #{ranking.ranking}
                          </Badge>
                          <h3 className="font-semibold text-lg">
                            {ranking.user.deletedAt
                              ? "(탈퇴한 사용자)"
                              : ranking.user.nickname || "이름 없음"}
                          </h3>
                          {!!ranking?.changedRanking && (
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                ranking.changedRanking > 0
                                  ? "bg-red-100 text-red-600"
                                  : ranking.changedRanking < 0
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {ranking.changedRanking > 0 && "↓"}
                              {ranking.changedRanking < 0 && "↑"}
                              {Math.abs(ranking.changedRanking) > 0 &&
                                Math.abs(ranking.changedRanking)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            ID: {ranking.user._id}
                          </span>
                          <span>
                            현재 포인트:{" "}
                            {ranking.user.currentPoint.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* 포인트 */}
                    <div className="flex flex-col w-full lg:w-auto items-end text-right">
                      <div className="text-lg lg:text-2xl font-bold text-primary">
                        {ranking.totalPoint.toLocaleString()}
                      </div>
                      <div className="text-xs lg:text-sm text-muted-foreground">
                        총 포인트
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* 더 보기 버튼 */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isFetching}
                    className="flex items-center gap-2"
                  >
                    {isFetching ? "로딩 중..." : "더 보기"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="시즌 차트 삭제"
        description={`"${currentChartInfo.nameList[0]?.ko}" 차트를 삭제하시겠습니까?\n삭제된 차트는 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteSeasonChart}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
