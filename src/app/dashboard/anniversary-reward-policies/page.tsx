"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
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
  Plus,
  Loader2,
  Edit,
  MoreHorizontal,
  Trash2,
  CalendarHeart,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  deleteAnniversaryRewardPolicy,
  getAnniversaryRewardPolicies,
} from "./actions";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { toast } from "sonner";
import moment from "moment";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAnniversaryRewardPolicyStore } from "@/store/anniversaryRwardPolicyStore";

export default function AnniversaryRewardPoliciesPage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);
  const {
    policies,
    totalPolicyCount,
    policyLoading,
    currentPolicyPage,
    policyItemsPerPage,
    includeDeleted,
    includeDisabled,
    setIncludeDeleted,
    setIncludeDisabled,
    setPolicies,
    setTotalPolicyCount,
    setPolicyLoading,
    setCurrentPolicyPage,
  } = useAnniversaryRewardPolicyStore();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!jsonWebToken) return;
    const fetchPolicies = async () => {
      setPolicyLoading(true);
      try {
        const result = await getAnniversaryRewardPolicies({
          params: {
            __skip: (currentPolicyPage - 1) * policyItemsPerPage,
            __limit: policyItemsPerPage,
            __includeDeleted: includeDeleted,
            __includeDisabled: includeDisabled,
          },
          jsonWebToken,
        });

        if (result) {
          setPolicies(result?.anniversaryRewardPolicies || []);
          setTotalPolicyCount(result?.count || 0);
        }
      } catch (error) {
        console.error("policies fetch error:", error);
        toast.error("가입 기념일 리워드 정책 목록을 가져올 수 없습니다.");
      } finally {
        setPolicyLoading(false);
      }
    };

    fetchPolicies();
  }, [
    jsonWebToken,
    currentPolicyPage,
    policyItemsPerPage,
    includeDeleted,
    includeDisabled,
    setPolicies,
    setPolicyLoading,
    setTotalPolicyCount,
    setCurrentPolicyPage,
    setIncludeDeleted,
    setIncludeDisabled,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPolicyPage(page);
  };

  const totalPages = Math.ceil(totalPolicyCount / policyItemsPerPage);

  return (
    <div className="container mx-auto">
      {/* 상단 헤더 */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4 lg:gap-0">
        <div className="flex items-center gap-3">
          <CalendarHeart className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">가입 기념일 리워드 정책 관리</h1>
            <p className="text-muted-foreground">
              가입 기념일 리워드 정책을 생성하고 관리합니다
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <Button
            onClick={() =>
              router.push("/dashboard/anniversary-reward-policies/create")
            }
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />새 정책 생성
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{`가입 기념일 리워드 정책 목록 (${totalPolicyCount})`}</CardTitle>
          <div className="flex flex-col lg:flex-row w-full items-end justify-end lg:items-center mt-2 gap-4">
            <div className="space-y-2">
              <div key={"includeDeleted"} className="flex items-center gap-2">
                <Label
                  htmlFor={"includeDeleted"}
                  className="text-sm font-normal"
                >
                  {"삭제 정책 포함"}
                </Label>
                <Switch
                  id={"includeDeleted"}
                  checked={includeDeleted}
                  onCheckedChange={(checked: boolean) =>
                    setIncludeDeleted(checked)
                  }
                  disabled={policyLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div key={"includeDisabled"} className="flex items-center gap-2">
                <Label
                  htmlFor={"includeDisabled"}
                  className="text-sm font-normal"
                >
                  {"비활성화 정책 포함"}
                </Label>
                <Switch
                  id={"includeDisabled"}
                  checked={includeDisabled}
                  onCheckedChange={(checked: boolean) =>
                    setIncludeDisabled(checked)
                  }
                  disabled={policyLoading}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {policyLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <CalendarHeart className="w-12 h-12 mb-2 opacity-50" />
              <p>등록된 가입 기념일 리워드 정책이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div
                  key={policy?._id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex-1 cursor-pointer ${
                        !!policy.deletedAt ? "cursor-default" : ""
                      }`}
                      onClick={() => {
                        if (!!policy.deletedAt) return;
                        router.push(
                          `/dashboard/anniversary-reward-policies/${policy?._id}`
                        );
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={policy?.isEnabled ? "default" : "secondary"}
                        >
                          {policy?.isEnabled ? "활성화" : "비활성화"}
                        </Badge>
                        {!!policy.deletedAt && (
                          <Badge variant="destructive">삭제됨</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        {`연차 : ${policy?.year}년 ${
                          policy?.year === 0 ? "(가입기념)" : ""
                        }`}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {`포인트 : ${policy?.pointAmount}P`}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        생성일:{" "}
                        {moment(policy?.createdAt).format("YYYY-MM-DD HH:mm")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        수정일:{" "}
                        {moment(policy?.updatedAt).format("YYYY-MM-DD HH:mm")}
                      </p>
                      {policy?.deletedAt && (
                        <p className="text-sm text-muted-foreground mt-1">
                          삭제일:{" "}
                          {moment(policy?.deletedAt).format("YYYY-MM-DD HH:mm")}
                        </p>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2 ml-4">
                      <DropdownMenu>
                        {!policy.deletedAt && (
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
                                `/dashboard/anniversary-reward-policies/create?isUpdate=true&id=${policy?._id}`
                              );
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setPolicyToDelete(policy?._id || null);
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
                      disabled={currentPolicyPage <= 1}
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
                      onClick={() => handlePageChange(currentPolicyPage - 1)}
                      disabled={currentPolicyPage <= 1}
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
                        Math.min(totalPages - 4, currentPolicyPage - 2)
                      ) + i;
                    if (pageNumber > totalPages) return null;

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentPolicyPage === pageNumber}
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
                      onClick={() => handlePageChange(currentPolicyPage + 1)}
                      disabled={currentPolicyPage >= totalPages}
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
                      disabled={currentPolicyPage >= totalPages}
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
        title="가입 기념일 리워드 정책 삭제"
        description={"이 가입 기념일 리워드 정책을 정말 삭제하시겠습니까?"}
        variant="destructive"
        onConfirm={async () => {
          if (!policyToDelete || !jsonWebToken) return;

          setIsDeleting(true);
          try {
            await deleteAnniversaryRewardPolicy({
              policyId: policyToDelete,
              jsonWebToken,
            });
            toast.success(
              "가입 기념일 리워드 정책이 성공적으로 삭제되었습니다."
            );
          } catch (error) {
            console.error("가입 기념일 리워드 정책 삭제 실패:", error);
            toast.error("가입 기념일 리워드 정책 삭제에 실패했습니다.");
          } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setPolicyToDelete(null);
          }
        }}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setPolicyToDelete(null);
        }}
        confirmText={isDeleting ? "삭제 중..." : "삭제"}
      />
    </div>
  );
}
