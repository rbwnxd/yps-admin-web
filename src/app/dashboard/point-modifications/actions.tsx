"use server";

import { axiosApi } from "@/lib/axios";
import {
  PointModificationsResponse,
  PointModificationDetailResponse,
  CreatePointModificationResponse,
  PointModificationForm,
  UsersResponse,
  UserDetailResponse,
} from "@/lib/types";

// 포인트 지급/차감 목록 조회
export const getPointModifications = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    type: "GRANT" | "REVOKE" | null;
    title?: string;
    __skip?: number;
    __limit?: number;
    sort?: string;
  };
  jsonWebToken: string;
}): Promise<PointModificationsResponse | null> => {
  try {
    const { data } = await axiosApi(
      "/admin/point-modifications",
      "get",
      params,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("getPointModifications error", error);
    throw error;
  }
};

// 포인트 지급/차감 생성
export const createPointModification = async ({
  body,
  jsonWebToken,
}: {
  body: PointModificationForm;
  jsonWebToken: string;
}): Promise<CreatePointModificationResponse | null> => {
  try {
    const { data } = await axiosApi(
      "/admin/point-modifications",
      "post",
      body,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("createPointModification error", error);
    throw error;
  }
};

// 포인트 지급/차감 상세 조회
export const getPointModificationDetail = async ({
  pointModificationId,
  jsonWebToken,
}: {
  pointModificationId: string;
  jsonWebToken: string;
}): Promise<PointModificationDetailResponse | null> => {
  try {
    const { data } = await axiosApi(
      `/admin/point-modifications/${pointModificationId}`,
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
    console.warn("getPointModificationDetail error", error);
    throw error;
  }
};

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
}): Promise<UsersResponse | null> => {
  try {
    const { data } = await axiosApi("/admin/users", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("getAdminUsers error", error);
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
}): Promise<UserDetailResponse | null> => {
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
    console.warn("getAdminUserDetail error", error);
    throw error;
  }
};
