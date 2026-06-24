"use server";

import { axiosApi } from "@/lib/axios";

// 알림 목록 조회
export const getNotifications = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    __skip?: number;
    __limit?: number;
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi("/admin/notifications", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("NotificationsActions getNotifications error", error);
    throw error;
  }
};
