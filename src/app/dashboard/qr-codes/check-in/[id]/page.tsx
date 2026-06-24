"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQRCodeStore } from "@/store/qrCodeStore";
import { useAuthStore } from "@/store/authStore";
import { QRCodeCategory, QRCodeVerification } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  ArrowLeft,
  Edit3,
  Trash2,
  User,
  Search,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getQRCodeVerifications,
  deleteQRCodeVerification,
  deleteQRCodeCheckIn,
} from "../../actions";
import { toast } from "sonner";
import moment from "moment";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { getCategoryLabel } from "@/lib/consts";

interface Admin {
  _id: string;
  name: string;
  account: string;
}

interface CheckIn {
  _id: string;
  title: string;
  category: QRCodeCategory;
  startAt: string;
  endAt: string;
  memo?: string | null;
  admins?: Admin[];
}

export default function QRCodeCheckInDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);
  const { findCheckInById, removeCheckIn } = useQRCodeStore();

  const [verifications, setVerifications] = useState<QRCodeVerification[]>([]);
  const [totalVerificationCount, setTotalVerificationCount] = useState(0);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [currentVerificationPage, setCurrentVerificationPage] = useState(1);
  const [verificationItemsPerPage] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [verificationToDelete, setVerificationToDelete] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckInDeleting, setIsCheckInDeleting] = useState(false);
  const [isCheckInDeleteDialogOpen, setIsCheckInDeleteDialogOpen] =
    useState(false);
  const [searchUserId, setSearchUserId] = useState("");
  const [actualSearchUserId, setActualSearchUserId] = useState(""); // 실제 검색에 사용될 userId
  const [isSearching, setIsSearching] = useState(false);

  const checkIn = findCheckInById(params.id);

  useEffect(() => {
    if (!jsonWebToken || !params.id) return;

    const fetchVerifications = async () => {
      setVerificationLoading(true);
      try {
        const result = await getQRCodeVerifications({
          qrCodeCheckInId: params.id,
          params: {
            __skip: (currentVerificationPage - 1) * verificationItemsPerPage,
            __limit: verificationItemsPerPage,
            ...(actualSearchUserId && { userId: actualSearchUserId }),
          },
          jsonWebToken,
        });

        if (result) {
          setVerifications(result.qrCodeVerifications || []);
          setTotalVerificationCount(result.count || 0);
        }
      } catch (error) {
        console.error("Verification fetch error:", error);
        toast.error("검증 목록을 가져올 수 없습니다.");
      } finally {
        setVerificationLoading(false);
      }
    };

    fetchVerifications();
  }, [
    jsonWebToken,
    params.id,
    currentVerificationPage,
    verificationItemsPerPage,
    actualSearchUserId,
  ]);

  const handleVerificationPageChange = (page: number) => {
    setCurrentVerificationPage(page);
  };

  const handleSearch = async (userId: string) => {
    setIsSearching(true);
    setActualSearchUserId(userId.trim()); // 실제 검색 실행
    setCurrentVerificationPage(1); // 검색 시 첫 페이지로 이동
    setIsSearching(false);
  };

  const handleClearSearch = () => {
    setSearchUserId("");
    setActualSearchUserId(""); // 실제 검색 상태도 초기화
    setCurrentVerificationPage(1);
  };

  const handleDeleteClick = (verificationId: string) => {
    setVerificationToDelete(verificationId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!jsonWebToken || !verificationToDelete) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteQRCodeVerification({
        qrCodeCheckInId: params.id,
        qrCodeVerificationId: verificationToDelete,
        jsonWebToken,
      });

      toast.success("검증 기록이 삭제되었습니다.");

      // 검증 목록 새로고침
      const result = await getQRCodeVerifications({
        qrCodeCheckInId: params.id,
        params: {
          __skip: (currentVerificationPage - 1) * verificationItemsPerPage,
          __limit: verificationItemsPerPage,
        },
        jsonWebToken,
      });

      if (result) {
        setVerifications(result.qrCodeVerifications || []);
        setTotalVerificationCount(result.count || 0);
      }
    } catch (error) {
      console.error("Verification deletion error:", error);
      toast.error("검증 기록 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setVerificationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setVerificationToDelete(null);
  };

  const getStatusBadge = (checkIn: CheckIn) => {
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

  const totalVerificationPages = Math.ceil(
    totalVerificationCount / verificationItemsPerPage,
  );

  if (!checkIn) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Users className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              체크인을 찾을 수 없습니다
            </p>
            <Button onClick={() => router.back()}>돌아가기</Button>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              router.push(
                `/dashboard/qr-codes/check-in/create?id=${checkIn._id}&isUpdate=true`,
              );
            }}
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            수정
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setIsCheckInDeleteDialogOpen(true);
            }}
            disabled={isCheckInDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isCheckInDeleting ? "삭제 중..." : "삭제"}
          </Button>
        </div>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">{checkIn.title}</h1>
          <p className="text-muted-foreground">체크인 상세 정보</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  카테고리
                </Label>
                <div className="mt-1">
                  <Badge variant={"default"}>
                    {getCategoryLabel(checkIn.category)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  상태
                </Label>
                <div className="mt-1">{getStatusBadge(checkIn)}</div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  시작 시간
                </Label>
                <p className="font-medium mt-1">
                  {moment(checkIn.startAt).format("YYYY년 MM월 DD일 HH:mm")}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  종료 시간
                </Label>
                <p className="font-medium mt-1">
                  {moment(checkIn.endAt).format("YYYY년 MM월 DD일 HH:mm")}
                </p>
              </div>
            </div>

            {checkIn.memo && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  메모
                </Label>
                <p className="mt-1 text-sm bg-muted/50 p-3 rounded-md">
                  {checkIn.memo}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 관리자 목록 */}
        <Card className="w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              관리자 목록
            </CardTitle>
          </CardHeader>
          <CardContent className="">
            {checkIn.admins && checkIn.admins.length > 0 ? (
              <div className="w-full overflow-x-auto overflow-y-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>번호</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>계정</TableHead>
                      <TableHead>ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkIn.admins.map((admin: Admin, index: number) => (
                      <TableRow key={admin._id}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>{admin.name || "-"}</TableCell>
                        <TableCell>{admin.account || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {admin._id || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="px-6 py-4">
                <p className="text-muted-foreground">
                  등록된 관리자가 없습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 검증 기록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              검증 기록 ({totalVerificationCount})
            </CardTitle>
            {/* 사용자 ID 검색 */}
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="사용자 ID로 검색..."
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(searchUserId);
                    }
                  }}
                  className="pr-10"
                />
              </div>
              <Button
                onClick={() => handleSearch(searchUserId)}
                disabled={isSearching}
                variant="outline"
              >
                {isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
              {actualSearchUserId && (
                <Button onClick={handleClearSearch} variant="outline" size="sm">
                  초기화
                </Button>
              )}
            </div>
            {actualSearchUserId && (
              <p className="text-sm text-muted-foreground mt-2">
                검색어: &ldquo;
                <span className="font-medium">{actualSearchUserId}</span>&rdquo;
                에 대한 결과
              </p>
            )}
          </CardHeader>
          <CardContent>
            {verificationLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : verifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Search className="w-12 h-12 mb-2 opacity-50" />
                <p>검증 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verifications.map((verification: QRCodeVerification) => (
                  <div
                    key={verification._id}
                    className="border rounded-lg p-3 bg-muted/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 w-full">
                        <p className="font-medium">
                          닉네임: {verification.user?.nickname || "알 수 없음"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          유저 ID: {verification.user?._id || "알 수 없음"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          QR코드 ID: {verification.qrCodeId || "알 수 없음"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          해시 ID: {verification.qrCodeHashId || "알 수 없음"}
                        </p>
                        <p className="text-sm text-muted-foreground text-right">
                          검증 시간:{" "}
                          {moment(verification.verifiedAt).format(
                            "YYYY-MM-DD HH:mm:ss",
                          )}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteClick(verification._id);
                              }}
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
            {totalVerificationPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVerificationPageChange(1)}
                        disabled={currentVerificationPage <= 1}
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
                        onClick={() =>
                          handleVerificationPageChange(
                            currentVerificationPage - 1,
                          )
                        }
                        disabled={currentVerificationPage <= 1}
                        className="h-9 w-9"
                        title="이전 페이지"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </PaginationItem>

                    {Array.from(
                      { length: Math.min(totalVerificationPages, 5) },
                      (_, i) => {
                        const pageNumber =
                          Math.max(
                            1,
                            Math.min(
                              totalVerificationPages - 4,
                              currentVerificationPage - 2,
                            ),
                          ) + i;
                        if (pageNumber > totalVerificationPages) return null;

                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() =>
                                handleVerificationPageChange(pageNumber)
                              }
                              isActive={currentVerificationPage === pageNumber}
                              className="cursor-pointer"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      },
                    )}

                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleVerificationPageChange(
                            currentVerificationPage + 1,
                          )
                        }
                        disabled={
                          currentVerificationPage >= totalVerificationPages
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
                          handleVerificationPageChange(totalVerificationPages)
                        }
                        disabled={
                          currentVerificationPage >= totalVerificationPages
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

      {/* 검증 기록 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="검증 기록 삭제"
        description={
          "이 검증 기록을 삭제하고 포인트를 회수하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
        }
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
        variant="destructive"
      />

      {/* 체크인 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={isCheckInDeleteDialogOpen}
        onOpenChange={setIsCheckInDeleteDialogOpen}
        title="체크인 삭제"
        description={"정말로 이 체크인을 삭제하시겠습니까?"}
        confirmText="삭제"
        cancelText="취소"
        isLoading={isCheckInDeleting}
        variant="destructive"
        onConfirm={async () => {
          setIsCheckInDeleting(true);
          try {
            if (jsonWebToken) {
              await deleteQRCodeCheckIn({
                checkInId: checkIn._id,
                jsonWebToken,
              });
              removeCheckIn(checkIn._id);
              toast.success("체크인이 성공적으로 삭제되었습니다.");
              router.push("/dashboard/qr-codes/check-in");
            }
          } catch (error) {
            console.error("체크인 삭제 실패:", error);
            toast.error("체크인 삭제에 실패했습니다.");
          } finally {
            setIsCheckInDeleting(false);
            setIsCheckInDeleteDialogOpen(false);
          }
        }}
        onCancel={() => {
          setIsCheckInDeleteDialogOpen(false);
        }}
      />
    </div>
  );
}
