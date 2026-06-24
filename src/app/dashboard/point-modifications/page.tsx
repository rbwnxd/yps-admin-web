"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePointModificationStore } from "@/store/pointModificationStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

import {
  Coins,
  Search,
  Plus,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { getPointModifications } from "./actions";
import { toast } from "sonner";
import moment from "moment";

export default function PointModificationsPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);
  const {
    pointModifications,
    totalCount,
    loading,
    currentPage,
    itemsPerPage,
    selectedType,
    searchTitle,
    setPointModifications,
    setTotalCount,
    setLoading,
    setCurrentPage,
    setSelectedType,
    setSearchTitle,
  } = usePointModificationStore();

  const [searchInput, setSearchInput] = useState(searchTitle);

  useEffect(() => {
    if (!jsonWebToken) return;

    const fetchPointModifications = async () => {
      setLoading(true);
      try {
        const result = await getPointModifications({
          params: {
            type: selectedType === "ALL" ? null : selectedType,
            __skip: (currentPage - 1) * itemsPerPage,
            __limit: itemsPerPage,
            ...(searchTitle && { title: searchTitle }),
          },
          jsonWebToken,
        });

        if (result) {
          setPointModifications(result.adminPointModifications || []);
          setTotalCount(result.count || 0);
        }
      } catch (error) {
        console.error("포인트 작업 목록 조회 오류:", error);
        toast.error("포인트 작업 목록 조회에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPointModifications();
  }, [
    jsonWebToken,
    currentPage,
    itemsPerPage,
    selectedType,
    searchTitle,
    setPointModifications,
    setTotalCount,
    setLoading,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setSearchTitle(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-500">
            완료
          </Badge>
        );
      case "FAILED":
        return <Badge variant="destructive">실패</Badge>;
      case "SCHEDULED":
        return <Badge variant="secondary">예약됨</Badge>;
      case "PENDING":
        return <Badge variant="outline">대기중</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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

  return (
    <div className="container mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Coins className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">포인트 관리</h1>
            <p className="text-muted-foreground">
              사용자 포인트 지급 및 차감을 관리합니다
            </p>
          </div>
        </div>

        <Button
          onClick={() => router.push("/dashboard/point-modifications/create")}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />새 포인트 작업
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>포인트 작업 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 필터 및 검색 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select
              value={selectedType}
              onValueChange={(value: "ALL" | "GRANT" | "REVOKE") => {
                setSelectedType(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="GRANT">포인트 지급</SelectItem>
                <SelectItem value="REVOKE">포인트 차감</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-1">
              <Input
                placeholder="제목으로 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                검색
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pointModifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Coins className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                포인트 작업이 없습니다
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                새로운 포인트 지급 또는 차감 작업을 생성해보세요.
              </p>
              <Button
                onClick={() =>
                  router.push("/dashboard/point-modifications/create")
                }
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />새 포인트 작업
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pointModifications.map((pointModification) => (
                <div
                  key={pointModification._id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/point-modifications/${pointModification._id}`
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            pointModification.type === "GRANT"
                              ? "default"
                              : "destructive"
                          }
                          className={`flex items-center gap-1 ${
                            pointModification.type === "GRANT"
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          {pointModification.type === "GRANT" ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {pointModification.type === "GRANT" ? "지급" : "차감"}
                        </Badge>
                        {getStatusBadge(pointModification.status)}
                      </div>

                      <h3 className="font-semibold text-lg mb-1">
                        {pointModification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {pointModification.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium">
                          {pointModification.amount.toLocaleString()}P
                        </span>
                        <span>
                          대상자:{" "}
                          {pointModification?.targetUserIds?.length?.toLocaleString() ||
                            0}
                          명
                        </span>
                        <span>
                          처리완료:{" "}
                          {pointModification?.processedUserIds?.length?.toLocaleString() ||
                            0}
                          명
                        </span>
                        {pointModification.scheduledAt && (
                          <span>
                            예약:{" "}
                            {moment(pointModification.scheduledAt).format(
                              "MM/DD HH:mm"
                            )}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        생성일:{" "}
                        {moment(pointModification.createdAt).format(
                          "YYYY-MM-DD HH:mm"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
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

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNumber =
                      Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                      i;
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
                  })}

                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
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
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage >= totalPages}
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
        </CardContent>
      </Card>
    </div>
  );
}
