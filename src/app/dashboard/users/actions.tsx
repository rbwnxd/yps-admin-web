"use server";

import { axiosApi } from "@/lib/axios";

// 관리자용 사용자 목록 조회
export const getUsers = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    nickname?: string;
    __skip?: number;
    __limit?: number;
    __includeDeleted?: boolean;
    sort?: string;
    // sort?: {
    //   field: "createdAt" | "point.totalReceivedPoint" | "point.currentPoint"; // 생성일, life-time포인트, 사용가능 포인트
    //   order: "ASC" | "DESC";
    // }; // Default value : { "field": "createdAt", "order": "DESC" }
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi("/admin/users", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("getUsers error", error);
    throw error;
  }
};

// 관리자용 사용자 상세 조회
export const getUserDetail = async ({
  userId,
  jsonWebToken,
}: {
  userId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/users/${userId}`,
      "get",
      undefined,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("getUserDetail error", error);
    throw error;
  }
};

// 관리자용 사용자 계정 차단
export const banUser = async ({
  userId,
  reason,
  jsonWebToken,
}: {
  userId: string;
  reason: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/users/${userId}/ban`,
      "post",
      { reason },
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("banUser error", error);
    throw error;
  }
};

// 관리자용 사용자 계정 제한 (활동정지)
export const restrictUser = async ({
  userId,
  reason,
  restrictDurationInDays,
  jsonWebToken,
}: {
  userId: string;
  reason: string;
  restrictDurationInDays: number;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/users/${userId}/restrict`,
      "post",
      { reason, restrictDurationInDays },
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("restrictUser error", error);
    throw error;
  }
};

export const liftRestrictUser = async ({
  userId,
  reason,
  jsonWebToken,
}: {
  userId: string;
  reason: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/users/${userId}/restriction/lift`,
      "post",
      { reason },
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("liftRestrictUser error", error);
    throw error;
  }
};

export const liftBanUser = async ({
  userId,
  reason,
  jsonWebToken,
}: {
  userId: string;
  reason: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/users/${userId}/ban/lift`,
      "post",
      { reason },
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("liftBanUser error", error);
    throw error;
  }
};

// 관리자용 사용자 아티스트 승격
export const promoteUser = async ({
  userId,
  jsonWebToken,
}: {
  userId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/users/${userId}/promote-to-artist`,
      "patch",
      {},
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("promoteUser error", error);
    throw error;
  }
};
