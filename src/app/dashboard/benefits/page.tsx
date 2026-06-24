"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Gift,
  Search,
  RefreshCw,
  Plus,
  Calendar,
  Users,
  Mail,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getBenefits } from "./actions";
import { toast } from "sonner";
import { Benefit, BenefitStatus } from "@/lib/types";
import moment from "moment";
import { Label } from "@radix-ui/react-dropdown-menu";

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

// DataTable 컬럼 정의
const createColumns = (
  router: ReturnType<typeof useRouter>
): ColumnDef<Benefit>[] => [
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Badge
          variant={STATUS_VARIANTS[row.getValue("status") as BenefitStatus]}
        >
          {STATUS_LABELS[row.getValue("status") as BenefitStatus]}
        </Badge>
      </div>
    ),
    size: 100,
    enableResizing: false,
  },
  {
    accessorKey: "filter",
    header: "필터",
    cell: ({ row }) => {
      const filter = row.getValue("filter") as Benefit["filter"];
      return (
        <div className="flex flex-col items-center justify-center">
          <Badge variant="outline" className="text-xs w-fit">
            {filter.type === "TOP_RANKING" ? "상위 랭킹" : "가입일 기준"}
          </Badge>
          {filter.type === "TOP_RANKING" && filter.topRanking && (
            <span className="text-xs text-muted-foreground mt-1">
              상위 {filter.topRanking}명
            </span>
          )}
          {filter.type === "USER_CREATED_AT" && (
            <div className="text-xs text-muted-foreground mt-1">
              {filter.userCreatedAtFrom && (
                <div>
                  시작: {moment(filter.userCreatedAtFrom).format("YYYY-MM-DD")}
                </div>
              )}
              {filter.userCreatedAtTo && (
                <div>
                  종료: {moment(filter.userCreatedAtTo).format("YYYY-MM-DD")}
                </div>
              )}
            </div>
          )}
        </div>
      );
    },
    size: 120,
    enableResizing: true,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="특전 제목" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 max-w-[320px]">
        <Gift className="w-4 h-4 flex-shrink-0" />
        <span className="truncate" title={row.getValue("title")}>
          {row.getValue("title")}
        </span>
      </div>
    ),
    size: 320,
    enableResizing: true,
  },
  {
    accessorKey: "email.subject",
    id: "emailSubject",
    header: "이메일 제목",
    cell: ({ row }) => {
      const benefit = row.original;
      return (
        <div className="flex items-center gap-2 max-w-[320px]">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="truncate" title={benefit.email.subject}>
            {benefit.email.subject}
          </span>
        </div>
      );
    },
    size: 320,
    enableResizing: true,
  },
  {
    accessorKey: "pushNotification.title",
    id: "pushTitle",
    header: "푸시 제목",
    cell: ({ row }) => {
      const benefit = row.original;
      return (
        <div className="flex items-center gap-2 max-w-[320px]">
          <Bell className="w-4 h-4 flex-shrink-0" />
          <span className="truncate" title={benefit.pushNotification.title}>
            {benefit.pushNotification.title}
          </span>
        </div>
      );
    },
    size: 320,
    enableResizing: true,
  },
  {
    accessorKey: "userIds",
    header: "대상 사용자 수",
    cell: ({ row }) => {
      const userIds = row.getValue("userIds") as string[];
      return (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="font-medium">{userIds.length}</span>
        </div>
      );
    },
    size: 96,
    enableResizing: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="생성일" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        <span>
          {moment(row.getValue("createdAt")).format("YYYY-MM-DD HH:mm")}
        </span>
      </div>
    ),
    size: 128,
    enableResizing: false,
  },
];

export default function BenefitsPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  // 특전 목록 상태
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 검색 및 필터 상태
  const [searchTitle, setSearchTitle] = useState("");
  const [searchTitleInput, setSearchTitleInput] = useState(""); // 실제 입력값
  const [createdAtFrom, setCreatedAtFrom] = useState("");
  const [createdAtTo, setCreatedAtTo] = useState("");

  // 디바운스를 위한 ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 정렬 상태
  const [sorting, setSorting] = useState<SortingState>([]);

  // 디바운스된 검색 함수
  const debouncedSearch = useCallback((value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setSearchTitle(value);
    }, 500); // 500ms 디바운스
  }, []);

  // 컬럼 정의
  const columns = createColumns(router);

  // 특전 목록 가져오기
  useEffect(() => {
    if (!jsonWebToken) return;

    const fetchBenefits = async () => {
      setLoading(true);
      try {
        // 스웨거 스펙에 맞는 정렬 파라미터 생성
        let sortParam = '{ "field": "createdAt", "order": "DESC" }'; // 기본값
        if (sorting.length > 0) {
          const sort = sorting[0]; // 첫 번째 정렬만 사용
          sortParam = JSON.stringify({
            field: sort.id,
            order: sort.desc ? "DESC" : "ASC",
          });
        }

        // ISO 8601 형식으로 날짜 변환
        const formatToISO = (datetime: string) => {
          if (!datetime) return undefined;
          return new Date(datetime).toISOString();
        };

        const params: {
          __skip: number;
          __limit: number;
          sort: string;
          title?: string;
          createdAtFrom?: string;
          createdAtTo?: string;
        } = {
          __skip: (currentPage - 1) * itemsPerPage,
          __limit: itemsPerPage,
          sort: sortParam,
        };

        if (searchTitle) {
          params.title = searchTitle;
        }

        if (createdAtFrom) {
          params.createdAtFrom = formatToISO(createdAtFrom);
        }

        if (createdAtTo) {
          params.createdAtTo = formatToISO(createdAtTo);
        }

        const result = await getBenefits({
          params,
          jsonWebToken,
        });

        if (result) {
          setBenefits(result.benefits || []);
          setTotalCount(result.count || 0);
        }
      } catch (error) {
        console.error("Benefits fetch error:", error);
        toast.error("특전 목록을 가져올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, [
    jsonWebToken,
    searchTitle,
    createdAtFrom,
    createdAtTo,
    sorting,
    currentPage,
    itemsPerPage,
  ]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearch = () => {
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  const handleReset = () => {
    setSearchTitle("");
    setSearchTitleInput("");
    setCreatedAtFrom("");
    setCreatedAtTo("");
    setCurrentPage(1);

    // 디바운스 타이머도 클리어
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  return (
    <div className="container mx-auto">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">특전 관리</h1>
            <p className="text-muted-foreground">
              필터 조건에 따라 사용자를 선별하여 특전을 발송합니다
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/dashboard/benefits/create")}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          특전 생성
        </Button>
      </div>

      <div className="space-y-6">
        {/* 검색 및 필터 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              검색 및 필터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex flex-col flex-1 gap-2">
                <Label>특전 제목</Label>
                <Input
                  type="text"
                  placeholder="특전 제목으로 검색..."
                  value={searchTitleInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTitleInput(value);
                    debouncedSearch(value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>생성일 시작</Label>
                <Input
                  type="datetime-local"
                  placeholder="생성일 시작"
                  value={createdAtFrom}
                  onChange={(e) => setCreatedAtFrom(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>생성일 끝</Label>
                <Input
                  type="datetime-local"
                  placeholder="생성일 종료"
                  value={createdAtTo}
                  onChange={(e) => setCreatedAtTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={handleSearch} variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                검색
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 특전 목록 - DataTable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              특전 목록 ({totalCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={benefits}
              showColumnToggle={true}
              showPagination={false}
              onRowClick={(benefit) =>
                router.push(`/dashboard/benefits/${benefit._id}`)
              }
              serverSide={true}
              sorting={sorting}
              onSortingChange={setSorting}
              loading={loading}
            />

            {/* 서버 사이드 페이지네이션 */}
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
                      {
                        length: Math.min(
                          Math.ceil(totalCount / itemsPerPage),
                          5
                        ),
                      },
                      (_, i) => {
                        const totalPages = Math.ceil(totalCount / itemsPerPage);
                        const pageNumber =
                          Math.max(
                            1,
                            Math.min(totalPages - 4, currentPage - 2)
                          ) + i;
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
                        disabled={
                          currentPage >= Math.ceil(totalCount / itemsPerPage)
                        }
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
                        disabled={
                          currentPage >= Math.ceil(totalCount / itemsPerPage)
                        }
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
    </div>
  );
}
