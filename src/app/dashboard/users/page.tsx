"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUserManagementStore } from "@/store/userManagementStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

import {
  Search,
  Loader2,
  Users,
  User2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getUsers } from "./actions";
import { toast } from "sonner";
import moment from "moment";
import { STORAGE_URL } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DailyRankingAnalysisUserStat, User } from "@/lib/types";
import Image from "next/image";

export default function UsersPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);
  const {
    users,
    totalCount,
    loading,
    currentPage,
    itemsPerPage,
    searchNickname,
    includeDeleted,
    setUsers,
    setTotalCount,
    setLoading,
    setCurrentPage,
    setSearchNickname,
    setIncludeDeleted,
  } = useUserManagementStore();

  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "state",
        header: "",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex justify-center text-center gap-1">
              {!!user?.deletedAt && (
                <Badge variant="secondary" className="text-xs">
                  탈퇴
                </Badge>
              )}
              {!user?.deletedAt &&
                !user?.banInfo?.isBanned &&
                user?.restrictionInfo?.isRestricted && (
                  <Badge variant="destructive" className="text-xs">
                    제한됨
                  </Badge>
                )}
              {!user?.deletedAt && user?.banInfo?.isBanned && (
                <Badge variant="destructive" className="text-xs">
                  차단됨
                </Badge>
              )}
            </div>
          );
        },
        size: 10,
      },
      {
        accessorKey: "gradeInfo",
        header: "등급",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-center">
              {user?.gradeInfo?.title && (
                <Badge
                  variant={"default"}
                  className={`text-xs ${getGradeBadgeColor(
                    user.gradeInfo.title
                  )}`}
                >
                  {user.gradeInfo.title}
                </Badge>
              )}
            </div>
          );
        },
        size: 20,
      },
      {
        id: "user",
        header: "닉네임",
        accessorFn: (row) => row.profile?.nickname || "",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2">
              {user?.imageList && user.imageList.length > 0 ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={`${STORAGE_URL}/${user?.imageList?.[0]?.image64Path}`}
                    alt={user?.profile?.nickname || "profile"}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User2 className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm font-medium">
                {user.profile?.nickname || "알 수 없음"}
              </span>
              {getPlatformBadge(user?.platform)}
            </div>
          );
        },
        size: 100,
      },
      {
        accessorKey: "email",
        header: "이메일",
        cell: ({ row }) => {
          const user = row.original;
          return <div className="text-center">{user?.email}</div>;
        },
        size: 20,
      },

      {
        accessorKey: "gender",
        header: "성별",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-center">
              {getGenderBadge(user?.profile?.gender)}
            </div>
          );
        },
        size: 20,
      },
      {
        accessorKey: "point.totalReceivedPoint",
        id: "point.totalReceivedPoint",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="총 받은 포인트" />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-right">
              {user.point?.totalReceivedPoint.toLocaleString()} P
            </div>
          );
        },
        size: 50,
      },
      {
        accessorKey: "point.currentPoint",
        id: "point.currentPoint",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="현재 포인트" />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-right">
              {user.point?.currentPoint.toLocaleString()} P
            </div>
          );
        },
        size: 50,
      },
      {
        id: "memberHash",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="해시" />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return <div className="text-left">{user.memberHash}</div>;
        },
        size: 100,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="가입일" />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-center text-xs">
              {moment(user.createdAt).format("YYYY-MM-DD HH:mm")}
            </div>
          );
        },
        size: 20,
      },
    ],
    []
  );

  const [searchInput, setSearchInput] = useState(searchNickname);

  useEffect(() => {
    if (!jsonWebToken) return;

    const fetchUsers = async () => {
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

        const result = await getUsers({
          params: {
            __skip: (currentPage - 1) * itemsPerPage,
            __limit: itemsPerPage,
            __includeDeleted: includeDeleted,
            sort: sortParam,
            ...(searchNickname && { nickname: searchNickname }),
          },
          jsonWebToken,
        });

        if (result) {
          setUsers(result.users || []);
          setTotalCount(result.count || 0);
        }
      } catch (error) {
        console.error("사용자 목록 조회 오류:", error);
        toast.error("사용자 목록 조회에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    jsonWebToken,
    currentPage,
    itemsPerPage,
    searchNickname,
    includeDeleted,
    sorting,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setSearchNickname(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getPlatformBadge = (platform: string) => {
    const platformMap: {
      [key: string]: {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      };
    } = {
      GOOGLE: { label: "구글", variant: "secondary" },
      APPLE: { label: "애플", variant: "secondary" },
      KAKAO: { label: "카카오", variant: "secondary" },
      NAVER: { label: "네이버", variant: "secondary" },
    };

    const platformInfo = platformMap[platform] || {
      label: platform,
      variant: "outline",
    };
    return (
      <Badge variant={platformInfo.variant} className="text-xs">
        {platformInfo.label}
      </Badge>
    );
  };

  const getGradeBadgeColor = (grade: string) => {
    const gradeMap: { [key: string]: string } = {
      STONE: "bg-stone-500",
      BRONZE: "bg-amber-600",
      SILVER: "bg-slate-400",
      GOLD: "bg-yellow-400",
      PLATINUM: "bg-emerald-400",
      DIAMOND: "bg-cyan-300",
      MASTER: "bg-purple-600",
      ARTIST: "bg-green-600",
    };
    return gradeMap[grade.toUpperCase()] || "gray";
  };

  const getGenderBadge = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      MALE: "남성",
      FEMALE: "여성",
      OTHER: "기타",
    };
    return genderMap[gender] || gender;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (!jsonWebToken) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Users className="h-12 w-12 text-muted-foreground" />
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
          <Users className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">사용자 관리</h1>
            <p className="text-muted-foreground">
              등록된 사용자들을 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">총 사용자 수</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <div className="flex flex-col lg:flex-row w-full items-end justify-end mt-2 gap-4">
            <div className="space-y-2">
              <div key={"includeDeleted"} className="flex items-center gap-2">
                <Label
                  htmlFor={"includeDeleted"}
                  className="text-sm font-normal"
                >
                  {"탈퇴한 사용자 포함"}
                </Label>
                <Switch
                  id={"includeDeleted"}
                  checked={includeDeleted}
                  onCheckedChange={(checked: boolean) =>
                    setIncludeDeleted(checked)
                  }
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 검색 */}
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="닉네임으로 검색..."
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

          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                사용자가 없습니다
              </p>
              <p className="text-sm text-muted-foreground">
                검색 조건을 변경해보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* {users.map((user) => (
                <div
                  key={user._id}
                  className={`border rounded-lg p-4 hover:bg-muted/30 transition-colors ${
                    user.deletedAt ? "opacity-60" : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!user.deletedAt) {
                      router.push(`/dashboard/users/${user._id}`);
                    }
                  }}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={
                          user.imageList?.[0]?.image64Path
                            ? `${STORAGE_URL}/${user.imageList[0].image64Path}`
                            : undefined
                        }
                        alt={user.profile.nickname}
                      />
                      <AvatarFallback>
                        <User2 className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {user.profile.nickname}
                        </h3>
                        {getPlatformBadge(user.platform)}
                        {user?.gradeInfo?.title && (
                          <Badge
                            variant={"default"}
                            className={`text-xs ${getGradeBadgeColor(
                              user.gradeInfo.title
                            )}`}
                          >
                            {user.gradeInfo.title}
                          </Badge>
                        )}
                        {user.restrictionInfo.isRestricted && (
                          <Badge variant="destructive" className="text-xs">
                            제한됨
                          </Badge>
                        )}
                        {user.banInfo.isBanned && (
                          <Badge variant="destructive" className="text-xs">
                            차단됨
                          </Badge>
                        )}
                        {user.deletedAt && (
                          <Badge variant="secondary" className="text-xs">
                            탈퇴
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {user.profile.name} (
                          {getGenderBadge(user.profile.gender)})
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          포인트: {user.point.currentPoint.toLocaleString()} P
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          해시: {user.memberHash}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          가입일:{" "}
                          {moment(user.createdAt).format("YYYY-MM-DD HH:mm")}
                        </p>
                        {user.deletedAt && (
                          <p className="text-xs text-muted-foreground truncate">
                            탈퇴일:{" "}
                            {moment(user.deletedAt).format("YYYY-MM-DD HH:mm")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))} */}
              <DataTable
                columns={columns}
                data={users || []}
                // searchKey="user"
                // searchPlaceholder="사용자 검색..."
                showColumnToggle={false}
                showPagination={false}
                pageSize={10}
                loading={loading}
                onRowClick={(row) => {
                  router.push(`/dashboard/users/${row?._id}`);
                }}
                serverSide={true}
                sorting={sorting}
                onSortingChange={setSorting}
              />
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
