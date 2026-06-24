"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Loader2 } from "lucide-react";
import { getAppAdminUsers } from "@/app/dashboard/app-admin/actions";
import { toast } from "sonner";

interface AdminUser {
  _id: string;
  name: string;
  account: string;
  email?: string;
}

interface AdminSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedUsers: AdminUser[]) => void;
  jsonWebToken: string;
  adminIds: string[];
}

export function AdminSearchDialog({
  open,
  onOpenChange,
  onConfirm,
  jsonWebToken,
  adminIds,
}: AdminSearchDialogProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchUsers = useCallback(
    async (page = 1) => {
      if (!jsonWebToken) return;

      setLoading(true);
      try {
        const result = await getAppAdminUsers({
          params: {
            __skip: (page - 1) * itemsPerPage,
            __limit: itemsPerPage,
            __includeDisabled: false,
            __includeDeleted: false,
          },
          jsonWebToken,
        });

        if (result) {
          setUsers(result.appAdminUsers || []);
          setTotalCount(result.count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch admin users:", error);
        toast.error("사용자 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [jsonWebToken]
  );

  useEffect(() => {
    if (open) {
      fetchUsers(1);
      setCurrentPage(1);
      setSelectedUsers([]);
    }
  }, [open, fetchUsers]);

  // adminIds와 일치하는 사용자들을 자동으로 선택
  useEffect(() => {
    if (users.length > 0 && adminIds.length > 0) {
      const preSelectedUsers = users.filter((user) =>
        adminIds.includes(user._id)
      );

      if (preSelectedUsers.length > 0) {
        setSelectedUsers((prev) => {
          // 중복 제거를 위해 기존에 없는 사용자만 추가
          const newUsers = preSelectedUsers.filter(
            (user) => !prev.some((selected) => selected._id === user._id)
          );
          return newUsers.length > 0 ? [...prev, ...newUsers] : prev;
        });
      }
    }
  }, [users, adminIds]);

  const handleUserToggle = (user: AdminUser, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, user]);
    } else {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelectedUsers = users.filter(
        (user) => !selectedUsers.some((selected) => selected._id === user._id)
      );
      setSelectedUsers([...selectedUsers, ...newSelectedUsers]);
    } else {
      const userIds = users.map((user) => user._id);
      setSelectedUsers(
        selectedUsers.filter((user) => !userIds.includes(user._id))
      );
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page);
  };

  const handleConfirm = () => {
    onConfirm(selectedUsers);
    onOpenChange(false);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const allCurrentPageSelected = users.every((user) =>
    selectedUsers.some((selected) => selected._id === user._id)
  );
  const someCurrentPageSelected = users.some((user) =>
    selectedUsers.some((selected) => selected._id === user._id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            관리자 선택
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* 선택된 사용자 수 */}
          <div className="text-sm text-muted-foreground">
            {selectedUsers.length > 0 && (
              <span>{selectedUsers.length}명 선택됨</span>
            )}
          </div>

          {/* 사용자 리스트 */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">로딩 중...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                사용자가 없습니다.
              </div>
            ) : (
              <div className="p-4">
                {/* 전체 선택 */}
                <div className="flex items-center space-x-2 pb-3 border-b mb-3">
                  <Checkbox
                    id="select-all"
                    checked={allCurrentPageSelected}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    ref={(el) => {
                      if (el) {
                        // @ts-expect-error - indeterminate is not in the type but exists on the element
                        el.indeterminate =
                          someCurrentPageSelected && !allCurrentPageSelected;
                      }
                    }}
                  />
                  <Label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    현재 페이지 전체 선택 ({users.length}명)
                  </Label>
                </div>

                {/* 사용자 목록 */}
                <div className="space-y-2">
                  {users.map((user) => {
                    const isSelected = selectedUsers.some(
                      (selected) => selected._id === user._id
                    );
                    return (
                      <div
                        key={user._id}
                        className="flex items-center space-x-3 p-2 hover:bg-muted/30 rounded"
                      >
                        <Checkbox
                          id={`user-${user._id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleUserToggle(user, !!checked)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`user-${user._id}`}
                            className="cursor-pointer flex flex-row gap-1 justify-between"
                          >
                            <span className="font-medium">{user.name}</span>
                            <div className="flex flex-col gap-1 text-right">
                              <span className="text-sm text-muted-foreground">
                                {user.account}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {user._id}
                              </span>
                            </div>
                          </Label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
              >
                이전
              </Button>
              <span className="flex items-center px-3 text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                다음
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={selectedUsers.length === 0}>
            선택된 {selectedUsers.length}명 추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
