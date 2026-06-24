"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChartStore } from "@/store/chartStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Plus,
  Eye,
  Calendar,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import moment from "moment";
import { getCharts } from "./actions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function ChartsPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  // Chart Store 사용
  const {
    charts,
    totalCount,
    isLoading,
    currentPage,
    itemsPerPage,
    setCharts,
    setTotalCount,
    setLoading,
    setCurrentPage,
    includeDeleted,
    includeInactive,
    setIncludeDeleted,
    setIncludeInactive,
  } = useChartStore();

  // Persist 스토어 하이드레이션
  useEffect(() => {
    useChartStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!jsonWebToken) return;

    const fetchCharts = async () => {
      try {
        setLoading(true);
        const skip = (currentPage - 1) * itemsPerPage;

        const result = await getCharts({
          params: {
            __skip: skip,
            __limit: itemsPerPage,
            __includeDeleted: includeDeleted,
            __includeInactive: includeInactive,
          },
          jsonWebToken,
        });

        if (result) {
          setCharts(result.charts || []);
          setTotalCount(result.count || 0);
        }
      } catch (error) {
        console.error("Charts fetch error:", error);
        toast.error("차트 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    jsonWebToken,
    currentPage,
    itemsPerPage,
    includeDeleted,
    includeInactive,
  ]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  return (
    <div className="container mx-auto">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">차트 관리</h1>
            <p className="text-muted-foreground">
              사용자 랭킹 차트를 생성하고 관리합니다
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push("/dashboard/charts/create")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />새 차트 생성
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{`차트 목록 (${totalCount})`}</CardTitle>
          <div className="flex flex-col lg:flex-row w-full items-end justify-end mt-2 gap-4">
            <div className="space-y-2">
              <div key={"includeDeleted"} className="flex items-center gap-2">
                <Label
                  htmlFor={"includeDeleted"}
                  className="text-sm font-normal"
                >
                  {"삭제 차트 포함"}
                </Label>
                <Switch
                  id={"includeDeleted"}
                  checked={includeDeleted}
                  onCheckedChange={(checked: boolean) =>
                    setIncludeDeleted(checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div
                key={"includeUnpublished"}
                className="flex items-center gap-2"
              >
                <Label
                  htmlFor={"includeUnpublished"}
                  className="text-sm font-normal"
                >
                  {"비활성화 차트 포함"}
                </Label>
                <Switch
                  id={"includeInactive"}
                  checked={includeInactive}
                  onCheckedChange={(checked: boolean) =>
                    setIncludeInactive(checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </div>
          ) : charts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">
                  등록된 차트가 없습니다
                </p>
                <p className="text-sm text-muted-foreground">
                  새 차트를 생성해보세요.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {charts.map((chart) => (
                <div
                  key={chart?._id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/charts/${chart?._id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getChartTypeVariant(chart?.type)}>
                          {getChartTypeLabel(chart?.type)}
                        </Badge>
                        <Badge
                          variant={chart?.isActivated ? "default" : "secondary"}
                        >
                          {chart?.isActivated ? "활성화" : "비활성화"}
                        </Badge>
                        {chart?.deletedAt && (
                          <Badge variant="destructive">삭제됨</Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-lg mb-1">
                        {chart?.nameList?.[0]?.ko}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {chart?.descriptionList?.[0]?.ko}
                      </p>

                      {chart?.season && (
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm text-muted-foreground">
                            {moment(chart?.season.startedAt).format(
                              "YYYY-MM-DD"
                            )}{" "}
                            ~{" "}
                            {moment(chart?.season.endedAt).format("YYYY-MM-DD")}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-start gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>
                            생성일:{" "}
                            {moment(chart?.createdAt).format(
                              "YYYY-MM-DD HH:mm"
                            )}
                          </span>
                          {chart?.summaryUpdatedAt && (
                            <span>
                              업데이트:{" "}
                              {moment(chart?.summaryUpdatedAt).format(
                                "YYYY-MM-DD HH:mm"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/charts/${chart?._id}`);
                      }}
                      className="flex items-center gap-1 ml-4"
                    >
                      <Eye className="w-4 h-4" />
                      랭킹 보기
                    </Button> */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      {Math.ceil(totalCount / itemsPerPage) > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage <= 1}
                  className="h-9 w-9"
                  title="첫 페이지"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="h-9 w-9"
                  title="이전 페이지"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>

              {Array.from(
                { length: Math.min(Math.ceil(totalCount / itemsPerPage), 5) },
                (_, i) => {
                  const totalPages = Math.ceil(totalCount / itemsPerPage);
                  const pageNumber =
                    Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNumber > totalPages) return null;

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              )}

              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                  className="h-9 w-9"
                  title="다음 페이지"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handlePageChange(Math.ceil(totalCount / itemsPerPage))
                  }
                  disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                  className="h-9 w-9"
                  title="마지막 페이지"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
