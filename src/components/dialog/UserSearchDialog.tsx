"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Loader2, Users } from "lucide-react";
import { getUsers } from "@/app/dashboard/point-modifications/actions";
import { toast } from "sonner";
import { User, UserImage } from "@/lib/types";

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserSelect: (users: User[]) => void;
  selectedUsers: User[];
  multiple?: boolean;
}

export function UserSearchDialog({
  open,
  onOpenChange,
  onUserSelect,
  selectedUsers,
  multiple = false,
}: UserSearchDialogProps) {
  const jsonWebToken = useAuthStore((state) => state.token);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedUsers, setTempSelectedUsers] = useState(selectedUsers);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  const searchUsers = async (nickname?: string, page: number = 1) => {
    if (!jsonWebToken) return;

    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const result = await getUsers({
        params: {
          ...(nickname && { nickname }),
          __limit: limit,
          __skip: offset,
          __includeDeleted: false,
        },
        jsonWebToken,
      });

      if (result) {
        setUsers(result.users || []);
        setTotalCount(result.count || 0);
        setTotalPages(Math.ceil((result.count || 0) / limit));
      }
    } catch (error) {
      console.error("사용자 검색 오류:", error);
      toast.error("사용자 검색에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setCurrentPage(1);
      searchUsers();
    }
  }, [open, jsonWebToken]);

  useEffect(() => {
    setTempSelectedUsers(selectedUsers);
  }, [selectedUsers]);

  const handleSearch = () => {
    setCurrentPage(1);
    searchUsers(searchQuery.trim() || undefined, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    searchUsers(searchQuery.trim() || undefined, page);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isUserSelected = (userId: string) => {
    return tempSelectedUsers.some((user) => user._id === userId);
  };

  const handleUserToggle = (user: User) => {
    if (multiple) {
      setTempSelectedUsers((prev) => {
        const isSelected = prev.some((u) => u._id === user._id);
        if (isSelected) {
          return prev.filter((u) => u._id !== user._id);
        } else {
          return [...prev, user];
        }
      });
    } else {
      setTempSelectedUsers([user]);
    }
  };

  const handleConfirm = () => {
    onUserSelect(tempSelectedUsers);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSelectedUsers(selectedUsers);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            사용자 선택
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 검색 */}
          <div className="flex gap-2">
            <Input
              placeholder="닉네임으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* 선택된 사용자 표시 */}
          {tempSelectedUsers.length > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">
                선택된 사용자 ({tempSelectedUsers.length}명)
              </p>
              <div className="flex flex-wrap gap-1">
                {tempSelectedUsers.map((user) => (
                  <Badge key={user._id} variant="secondary" className="text-xs">
                    {user.profile?.nickname}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 사용자 목록 */}
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    검색된 사용자가 없습니다
                  </p>
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleUserToggle(user)}
                  >
                    {multiple && (
                      <Checkbox
                        checked={isUserSelected(user._id)}
                        onChange={() => handleUserToggle(user)}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.profile?.nickname} ({user.email})
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          currentPage > 1 && handlePageChange(currentPage - 1)
                        }
                        className={
                          currentPage <= 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        // 현재 페이지 주변 페이지만 표시
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      }
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          currentPage < totalPages &&
                          handlePageChange(currentPage + 1)
                        }
                        className={
                          currentPage >= totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              취소
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              확인 ({tempSelectedUsers.length}명 선택)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
