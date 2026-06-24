"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getNotifications } from "./actions";
import { Notification } from "@/lib/types";
import { toast } from "sonner";
import moment from "moment";

export default function NotificationsPage() {
  const jsonWebToken = useAuthStore((state) => state.token);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  // 알림 목록 조회
  const fetchNotifications = async () => {
    if (!jsonWebToken) return;

    setLoading(true);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const params = {
        __skip: skip,
        __limit: itemsPerPage,
      };

      const data = await getNotifications({
        params,
        jsonWebToken,
      });

      if (data) {
        setNotifications(data.notifications || []);
        setTotalCount(data.count || 0);
      }
    } catch (error) {
      console.error("알림 조회 실패:", error);
      toast.error("알림 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonWebToken, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              <CardTitle>알림 관리</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 총 개수 */}
          <div className="text-sm text-muted-foreground">
            총 {totalCount}개
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* 알림 목록 */}
          {!loading && notifications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              알림이 없습니다.
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{notification.type}</Badge>
                      {!!notification.deletedAt && (
                        <Badge variant="destructive">삭제됨</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {notification.content}
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        생성일:{" "}
                        {moment(notification.createdAt).format(
                          "YYYY-MM-DD HH:mm:ss"
                        )}
                      </p>
                      <p>
                        수정일:{" "}
                        {moment(notification.updatedAt).format(
                          "YYYY-MM-DD HH:mm:ss"
                        )}
                      </p>
                      {!!notification?.deletedAt && (
                        <p>
                          삭제일:{" "}
                          {moment(notification?.deletedAt).format(
                            "YYYY-MM-DD HH:mm:ss"
                          )}
                        </p>
                      )}
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
