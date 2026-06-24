"use server";

import { axiosApi } from "@/lib/axios";

// 앱 관리자 목록 조회 (페이지네이션 지원)
export const getAppAdminUsers = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    __skip?: number;
    __limit?: number;
    __includeDisabled?: boolean;
    __includeDeleted?: boolean;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi("/admin/app-admin-users", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("AppAdminActions getAppAdminUsers error", error);
    throw error;
  }
};

// 앱 관리자 생성
export const createAppAdminUser = async ({
  body,
  jsonWebToken,
}: {
  body: {
    account: string;
    password: string;
    name: string;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi("/admin/app-admin-users", "post", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("AppAdminActions createAppAdminUser error", error);
    throw error;
  }
};

// 앱 관리자 상세 조회
export const getAppAdminUser = async ({
  appAdminUserId,
  jsonWebToken,
}: {
  appAdminUserId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/app-admin-users/${appAdminUserId}`,
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
    console.warn("AppAdminActions getAppAdminUser error", error);
    throw error;
  }
};

// 앱 관리자 정보 수정
export const updateAppAdminUser = async ({
  appAdminUserId,
  body,
  jsonWebToken,
}: {
  appAdminUserId: string;
  body: {
    password?: string;
    permissions?: string[];
    name?: string;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/app-admin-users/${appAdminUserId}`,
      "patch",
      body,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("AppAdminActions updateAppAdminUser error", error);
    throw error;
  }
};

// 앱 관리자 삭제
export const deleteAppAdminUser = async ({
  appAdminUserId,
  jsonWebToken,
}: {
  appAdminUserId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/app-admin-users/${appAdminUserId}`,
      "delete",
      undefined,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return data || null;
  } catch (error) {
    console.warn("AppAdminActions deleteAppAdminUser error", error);
    throw error;
  }
};

// 앱 관리자 비활성화
export const disableAppAdminUser = async ({
  appAdminUserId,
  jsonWebToken,
}: {
  appAdminUserId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/app-admin-users/${appAdminUserId}/disable`,
      "post",
      undefined,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return data || null;
  } catch (error) {
    console.warn("AppAdminActions disableAppAdminUser error", error);
    throw error;
  }
};

// 앱 관리자 활성화
export const enableAppAdminUser = async ({
  appAdminUserId,
  jsonWebToken,
}: {
  appAdminUserId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/app-admin-users/${appAdminUserId}/enable`,
      "post",
      undefined,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return data || null;
  } catch (error) {
    console.warn("AppAdminActions enableAppAdminUser error", error);
    throw error;
  }
};
