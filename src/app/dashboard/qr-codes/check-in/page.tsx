"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useQRCodeStore } from "@/store/qrCodeStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  ArrowLeft,
  Users,
  Plus,
  User,
  Calendar,
  Edit3,
  MoreHorizontal,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getQRCodeCheckIns, deleteQRCodeCheckIn } from "../actions";
import { toast } from "sonner";
import moment from "moment";
import { QRCodeCheckIn } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getCategoryLabel } from "@/lib/consts";

export default function QRCodeCheckInPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);
  const removeCheckIn = useQRCodeStore((state) => state.removeCheckIn);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [checkInToDelete, setCheckInToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    checkIns,
    totalCheckInCount,
    checkInLoading,
    currentCheckInPage,
    checkInItemsPerPage,
    checkInIncludeDeleted,
    setCheckInIncludeDeleted,
    setCheckIns,
    setTotalCheckInCount,
    setCheckInLoading,
    setCurrentCheckInPage,
  } = useQRCodeStore();

  useEffect(() => {
    if (!jsonWebToken) return;

    const fetchCheckIns = async () => {
      setCheckInLoading(true);
      try {
        const result = await getQRCodeCheckIns({
          params: {
            __skip: (currentCheckInPage - 1) * checkInItemsPerPage,
            __limit: checkInItemsPerPage,
            __includeDeleted: checkInIncludeDeleted,
          },
          jsonWebToken,
        });

        if (result) {
          setCheckIns(result.qrCodeCheckIns || []);
          setTotalCheckInCount(result.count || 0);
        }
      } catch (error) {
        console.error("Check-in fetch error:", error);
        toast.error("체크인 목록을 가져올 수 없습니다.");
      } finally {
        setCheckInLoading(false);
      }
    };

    fetchCheckIns();
  }, [
    jsonWebToken,
    currentCheckInPage,
    checkInItemsPerPage,
    checkInIncludeDeleted,
    setCheckIns,
    setTotalCheckInCount,
    setCheckInLoading,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentCheckInPage(page);
  };

  const getStatusBadge = (checkIn: QRCodeCheckIn) => {
    const now = new Date();
    const startDate = new Date(checkIn.startAt);
    const endDate = new Date(checkIn.endAt);

    if (now < startDate) {
      return <Badge variant="outline">예정</Badge>;
    } else if (now >= startDate && now <= endDate) {
      return <Badge variant="default">진행 중</Badge>;
    } else {
      return <Badge variant="secondary">종료</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCheckInCount / checkInItemsPerPage);

  return (
    <div className="container mx-auto">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/qr-codes")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            QR 코드로 돌아가기
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push("/dashboard/qr-codes/check-in/create")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            체크인 생성
          </Button>
        </div>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">체크인 관리</h1>
          <p className="text-muted-foreground">
            QR 코드 체크인 이벤트를 관리합니다
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{`체크인 목록 (${totalCheckInCount})`}</CardTitle>
          <div className="flex flex-col lg:flex-row w-full items-end justify-end mt-2 gap-4">
            <div className="space-y-2">
              <div key={"includeDeleted"} className="flex items-center gap-2">
                <Label
                  htmlFor={"includeDeleted"}
                  className="text-sm font-normal"
                >
                  {"삭제된 체크인 포함"}
                </Label>
                <Switch
                  id={"includeDeleted"}
                  checked={checkInIncludeDeleted}
                  onCheckedChange={(checked: boolean) =>
                    setCheckInIncludeDeleted(checked)
                  }
                  disabled={checkInLoading}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {checkInLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          ) : checkIns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Users className="w-12 h-12 mb-2 opacity-50" />
              <p>등록된 체크인이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {checkIns.map((checkIn) => (
                <div
                  key={checkIn._id}
                  className={`border rounded-lg p-4 hover:bg-muted/30 transition-colors ${
                    !!checkIn?.deletedAt ? "" : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!!checkIn?.deletedAt) {
                      return;
                    }
                    router.push(`/dashboard/qr-codes/check-in/${checkIn._id}`);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={"default"}>
                          {getCategoryLabel(checkIn.category)}
                        </Badge>
                        {getStatusBadge(checkIn)}
                        {!!checkIn?.deletedAt && (
                          <Badge variant="destructive">삭제됨</Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-lg mb-1">
                        {checkIn.title}
                      </h3>

                      {checkIn.memo && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {checkIn.memo}
                        </p>
                      )}

                      <div className="flex items-center gap-1 mb-1">
                        <User className="w-4 h-4" />
                        <p className="text-sm text-muted-foreground ">
                          관리자 {checkIn.admins?.length || 0}명
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {moment(checkIn.startAt).format("YY/MM/DD HH:mm")}{" "}
                              - {moment(checkIn.endAt).format("YY/MM/DD HH:mm")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground ">
                        생성일:{" "}
                        {moment(checkIn.createdAt).format("YYYY-MM-DD HH:mm")}
                      </p>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2 ml-4">
                      <DropdownMenu>
                        {!checkIn?.deletedAt && (
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        )}
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/qr-codes/check-in/create?id=${checkIn._id}&isUpdate=true`,
                              );
                            }}
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setCheckInToDelete(checkIn._id);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                      disabled={currentCheckInPage <= 1}
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
                      onClick={() => handlePageChange(currentCheckInPage - 1)}
                      disabled={currentCheckInPage <= 1}
                      className="h-9 w-9"
                      title="이전 페이지"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNumber =
                      Math.max(
                        1,
                        Math.min(totalPages - 4, currentCheckInPage - 2),
                      ) + i;
                    if (pageNumber > totalPages) return null;

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentCheckInPage === pageNumber}
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
                      onClick={() => handlePageChange(currentCheckInPage + 1)}
                      disabled={currentCheckInPage >= totalPages}
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
                      disabled={currentCheckInPage >= totalPages}
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

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="체크인 삭제"
        description="정말로 이 체크인을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        isLoading={isDeleting}
        variant="destructive"
        onConfirm={async () => {
          if (!checkInToDelete || !jsonWebToken) return;

          setIsDeleting(true);
          try {
            await deleteQRCodeCheckIn({
              checkInId: checkInToDelete,
              jsonWebToken,
            });
            removeCheckIn(checkInToDelete);
            toast.success("체크인이 성공적으로 삭제되었습니다.");
          } catch (error) {
            console.error("체크인 삭제 실패:", error);
            toast.error("체크인 삭제에 실패했습니다.");
          } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setCheckInToDelete(null);
          }
        }}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setCheckInToDelete(null);
        }}
      />
    </div>
  );
}
