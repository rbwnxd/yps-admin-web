"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useQRCodeStore } from "@/store/qrCodeStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  QrCode,
  Plus,
  Settings,
  Loader2,
  Edit,
  MoreHorizontal,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getQRCodes, deleteQRCode } from "./actions";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { toast } from "sonner";
import moment from "moment";
import { CATEGORY_OPTIONS, getCategoryLabel } from "@/lib/consts";
import type { QRCodeCategory } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function QRCodesPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);
  const {
    qrCodes,
    totalQRCount,
    qrLoading,
    currentQRPage,
    qrItemsPerPage,
    selectedCategory,
    setSelectedCategory,
    includeDeleted,
    includeDisabled,
    setIncludeDeleted,
    setIncludeDisabled,
    setQRCodes,
    setTotalQRCount,
    setQRLoading,
    setCurrentQRPage,
    removeQRCode,
  } = useQRCodeStore();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [qrCodeToDelete, setQRCodeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!jsonWebToken) return;
    const fetchQRCodes = async () => {
      setQRLoading(true);
      try {
        const result = await getQRCodes({
          params: {
            __skip: (currentQRPage - 1) * qrItemsPerPage,
            __limit: qrItemsPerPage,
            __includeDeleted: includeDeleted,
            __includeDisabled: includeDisabled,
            ...(selectedCategory &&
              selectedCategory !== "ALL" && {
                category: selectedCategory as QRCodeCategory,
              }),
          },
          jsonWebToken,
        });

        if (result) {
          setQRCodes(result.qrCodes || []);
          setTotalQRCount(result.count || 0);
        }
      } catch (error) {
        console.error("QR codes fetch error:", error);
        toast.error("QR 코드 목록을 가져올 수 없습니다.");
      } finally {
        setQRLoading(false);
      }
    };

    fetchQRCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    jsonWebToken,
    currentQRPage,
    qrItemsPerPage,
    selectedCategory,
    includeDeleted,
    includeDisabled,
  ]);

  const getQRCodeTypeLabel = (type: "STATIC" | "CHECK_IN") => {
    return type === "STATIC" ? "정적" : "체크인";
  };

  const getQRCodeTypeVariant = (type: "STATIC" | "CHECK_IN") => {
    return type === "STATIC" ? "default" : "secondary";
  };

  const handlePageChange = (page: number) => {
    setCurrentQRPage(page);
  };

  const totalPages = Math.ceil(totalQRCount / qrItemsPerPage);

  return (
    <div className="container mx-auto">
      {/* 상단 헤더 */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4 lg:gap-0">
        <div className="flex items-center gap-3">
          <QrCode className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">QR 코드 관리</h1>
            <p className="text-muted-foreground">
              다양한 용도의 QR 코드를 생성하고 관리합니다
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/qr-codes/check-in")}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            체크인 관리
          </Button>
          {/* <Button
            variant="outline"
            onClick={() => router.push("/dashboard/qr-codes/check-in/create")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            QR 코드 체크인 생성
          </Button> */}
          <Button
            onClick={() => router.push("/dashboard/qr-codes/create")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />새 QR 코드 생성
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{`QR 코드 목록 (${totalQRCount})`}</CardTitle>
          <div className="flex flex-col lg:flex-row w-full items-end justify-end lg:items-center mt-2 gap-4">
            <Select
              value={selectedCategory}
              onValueChange={(value: "ALL" | QRCodeCategory) =>
                setSelectedCategory(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {[{ value: "ALL", label: "전체" }, ...CATEGORY_OPTIONS].map(
                  (option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <div key={"includeDeleted"} className="flex items-center gap-2">
                <Label
                  htmlFor={"includeDeleted"}
                  className="text-sm font-normal"
                >
                  {"삭제 QR 코드 포함"}
                </Label>
                <Switch
                  id={"includeDeleted"}
                  checked={includeDeleted}
                  onCheckedChange={(checked: boolean) =>
                    setIncludeDeleted(checked)
                  }
                  disabled={qrLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div key={"includeDisabled"} className="flex items-center gap-2">
                <Label
                  htmlFor={"includeDisabled"}
                  className="text-sm font-normal"
                >
                  {"비활성화 QR 코드 포함"}
                </Label>
                <Switch
                  id={"includeDisabled"}
                  checked={includeDisabled}
                  onCheckedChange={(checked: boolean) =>
                    setIncludeDisabled(checked)
                  }
                  disabled={qrLoading}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {qrLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : qrCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <QrCode className="w-12 h-12 mb-2 opacity-50" />
              <p>등록된 QR 코드가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {qrCodes.map((qrCode) => (
                <div
                  key={qrCode?._id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex-1 cursor-pointer ${
                        !!qrCode.deletedAt ? "cursor-default" : ""
                      }`}
                      onClick={() => {
                        if (!!qrCode.deletedAt) return;
                        router.push(`/dashboard/qr-codes/${qrCode?._id}`);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getQRCodeTypeVariant(qrCode?.type)}>
                          {getQRCodeTypeLabel(qrCode?.type)}
                        </Badge>
                        <Badge variant="default">
                          {getCategoryLabel(qrCode?.category || "")}
                        </Badge>
                        <Badge
                          variant={
                            moment().isBefore(moment(qrCode?.expiresAt)) ||
                            !qrCode?.expiresAt
                              ? qrCode?.isEnabled
                                ? "default"
                                : "secondary"
                              : "destructive"
                          }
                          className={qrCode?.isEnabled ? "bg-green-400" : ""}
                        >
                          {moment().isBefore(moment(qrCode?.expiresAt)) ||
                          !qrCode?.expiresAt
                            ? qrCode?.isEnabled
                              ? "활성화"
                              : "비활성화"
                            : "만료"}
                        </Badge>
                        {!!qrCode.deletedAt && (
                          <Badge variant="destructive">삭제됨</Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-lg mb-1">
                        {qrCode?.displayMainTitleList?.[0]?.ko}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {qrCode?.displaySubTitleList?.[0]?.ko}
                      </p>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>포인트 : {qrCode?.point}P</span>
                          <span>발급 수 : {qrCode?.issuedCount}</span>
                          <span>검증 수 : {qrCode?.verifiedCount}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        생성일:{" "}
                        {moment(qrCode?.createdAt).format("YYYY-MM-DD HH:mm")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        만료일:{" "}
                        {qrCode?.expiresAt
                          ? moment(qrCode?.expiresAt).format("YYYY-MM-DD HH:mm")
                          : "무제한"}
                      </p>
                      {qrCode?.deletedAt && (
                        <p className="text-sm text-muted-foreground mt-1">
                          삭제일:{" "}
                          {moment(qrCode?.deletedAt).format("YYYY-MM-DD HH:mm")}
                        </p>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2 ml-4">
                      <DropdownMenu>
                        {!qrCode.deletedAt && (
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
                          {(moment().isBefore(moment(qrCode?.expiresAt)) ||
                            !qrCode?.expiresAt) && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/qr-codes/create?isUpdate=true&id=${qrCode?._id}`,
                                );
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                          )}
                          {(qrCode.category === "PLATFORM_ALBUM" ||
                            qrCode.category === "CONTENTS_ALBUM" ||
                            qrCode.category === "CONTENTS_GOODS") && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/qr-codes/${qrCode._id}/contents`,
                                );
                              }}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              콘텐츠 관리
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setQRCodeToDelete(qrCode?._id || null);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
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
                      disabled={currentQRPage <= 1}
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
                      onClick={() => handlePageChange(currentQRPage - 1)}
                      disabled={currentQRPage <= 1}
                      className="h-9 w-9"
                      title="이전 페이지"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNumber =
                      Math.max(1, Math.min(totalPages - 4, currentQRPage - 2)) +
                      i;
                    if (pageNumber > totalPages) return null;

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentQRPage === pageNumber}
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
                      onClick={() => handlePageChange(currentQRPage + 1)}
                      disabled={currentQRPage >= totalPages}
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
                      disabled={currentQRPage >= totalPages}
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
        title="QR 코드 삭제"
        description={"이 QR 코드를 정말 삭제하시겠습니까?"}
        variant="destructive"
        onConfirm={async () => {
          if (!qrCodeToDelete || !jsonWebToken) return;

          setIsDeleting(true);
          try {
            await deleteQRCode({
              id: qrCodeToDelete,
              jsonWebToken,
            });
            removeQRCode(qrCodeToDelete);
            toast.success("QR 코드가 성공적으로 삭제되었습니다.");
          } catch (error) {
            console.error("QR 코드 삭제 실패:", error);
            toast.error("QR 코드 삭제에 실패했습니다.");
          } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setQRCodeToDelete(null);
          }
        }}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setQRCodeToDelete(null);
        }}
        confirmText={isDeleting ? "삭제 중..." : "삭제"}
      />
    </div>
  );
}
