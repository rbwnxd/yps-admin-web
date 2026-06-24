"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Plus,
  Loader2,
  Trash2,
  MoreHorizontal,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { getTerms, deleteTerms, activateTerms } from "./actions";
import { Terms, TermsType } from "@/lib/types";
import { toast } from "sonner";
import moment from "moment";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";

const TERMS_TYPE_LABELS: Record<TermsType, string> = {
  PRIVACY_POLICY: "개인정보 처리방침",
  TERMS_OF_SERVICE: "서비스 이용약관",
};

export default function TermsPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  const [terms, setTerms] = useState<Terms[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TermsType | "ALL">("ALL");

  // 삭제 다이얼로그
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    termsId: "",
    title: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // 활성화 다이얼로그
  const [activateDialog, setActivateDialog] = useState({
    open: false,
    termsId: "",
    title: "",
  });
  const [isActivating, setIsActivating] = useState(false);

  // 약관 목록 조회
  const fetchTerms = async () => {
    if (!jsonWebToken) return;

    setLoading(true);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const params: {
        __skip: number;
        __limit: number;
        type?: string;
      } = {
        __skip: skip,
        __limit: itemsPerPage,
      };

      if (typeFilter !== "ALL") {
        params.type = typeFilter;
      }

      const data = await getTerms({
        params,
        jsonWebToken,
      });

      if (data) {
        setTerms(data.terms || []);
        setTotalCount(data.count || 0);
      }
    } catch (error) {
      console.error("약관 조회 실패:", error);
      toast.error("약관 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonWebToken, currentPage, itemsPerPage, typeFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value as TermsType | "ALL");
    setCurrentPage(1);
  };

  const handleDeleteClick = (termsId: string, title: string) => {
    setDeleteDialog({
      open: true,
      termsId,
      title,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!jsonWebToken || !deleteDialog.termsId) return;

    setIsDeleting(true);
    try {
      const result = await deleteTerms({
        termsId: deleteDialog.termsId,
        jsonWebToken,
      });

      if (result) {
        toast.success("약관이 삭제되었습니다.");
        setDeleteDialog({ open: false, termsId: "", title: "" });
        fetchTerms();
      } else {
        toast.error("약관 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("약관 삭제 실패:", error);
      toast.error("약관 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivateClick = (termsId: string, title: string) => {
    setActivateDialog({
      open: true,
      termsId,
      title,
    });
  };

  const handleActivateConfirm = async () => {
    if (!jsonWebToken || !activateDialog.termsId) return;

    setIsActivating(true);
    try {
      const result = await activateTerms({
        termsId: activateDialog.termsId,
        jsonWebToken,
      });

      if (result) {
        toast.success("약관이 활성화되었습니다.");
        setActivateDialog({ open: false, termsId: "", title: "" });
        fetchTerms();
      } else {
        toast.error("약관 활성화에 실패했습니다.");
      }
    } catch (error) {
      console.error("약관 활성화 실패:", error);
      toast.error("약관 활성화에 실패했습니다.");
    } finally {
      setIsActivating(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <CardTitle>약관 관리</CardTitle>
            </div>
            <Button onClick={() => router.push("/dashboard/terms/create")}>
              <Plus className="mr-2 h-4 w-4" />
              약관 생성
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 */}
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="약관 타입" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="PRIVACY_POLICY">
                    개인정보 처리방침
                  </SelectItem>
                  <SelectItem value="TERMS_OF_SERVICE">
                    서비스 이용약관
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground flex items-center">
              총 {totalCount}개
            </div>
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* 약관 목록 */}
          {!loading && terms.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              약관이 없습니다.
            </div>
          )}

          {!loading && terms.length > 0 && (
            <div className="space-y-4">
              {terms.map((term) => (
                <div
                  key={term._id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => router.push(`/dashboard/terms/${term._id}`)}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {TERMS_TYPE_LABELS[term.type]}
                      </Badge>
                      <Badge variant="secondary">v{term.version}</Badge>
                      {term.isActive && (
                        <Badge variant="default" className="bg-green-600">
                          활성화
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">
                      {term?.titleList?.[0]?.ko}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        생성일:{" "}
                        {moment(term?.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                      </p>
                      <p>
                        수정일:{" "}
                        {moment(term?.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
                      </p>
                      {!!term?.deletedAt && (
                        <p>
                          삭제일:{" "}
                          {moment(term?.deletedAt).format(
                            "YYYY-MM-DD HH:mm:ss"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!term?.isActive && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleActivateClick(
                                term?._id,
                                term?.titleList?.[0]?.ko
                              );
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            활성화
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteClick(
                              term?._id,
                              term?.titleList?.[0]?.ko
                            );
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="약관 삭제"
        description={`"${deleteDialog?.title || ""}" 약관을 삭제하시겠습니까?`}
        confirmText="삭제"
        cancelText="취소"
        isLoading={isDeleting}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* 활성화 확인 다이얼로그 */}
      <ConfirmDialog
        open={activateDialog.open}
        onOpenChange={(open) => setActivateDialog({ ...activateDialog, open })}
        title="약관 활성화"
        description={`"${
          activateDialog?.title || ""
        }" 약관을 활성화하시겠습니까? 기존 활성화된 동일 타입의 약관은 자동으로 비활성화됩니다.`}
        confirmText="활성화"
        cancelText="취소"
        isLoading={isActivating}
        onConfirm={handleActivateConfirm}
      />
    </div>
  );
}
