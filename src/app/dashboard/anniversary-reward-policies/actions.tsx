"use server";

import { axiosApi } from "@/lib/axios";

// 가입 기념일 리워드 정책 목록 조회
export const getAnniversaryRewardPolicies = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    __skip?: number;
    __limit?: number;
    __includeDeleted?: boolean;
    __includeDisabled?: boolean;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      "/admin/anniversary-reward-policies",
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
    console.error("Failed to fetch anniversary reward policies:", error);
    throw error;
  }
};

// 가입 기념일 리워드 정책 상세 조회
export const getAnniversaryRewardPolicy = async ({
  policyId,
  jsonWebToken,
}: {
  policyId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/anniversary-reward-policies/${policyId}`,
      "get",
      {},
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (
      (data && data["data"] && data["data"]["anniversaryRewardPolicy"]) || null
    );
  } catch (error) {
    console.error(
      `Failed to fetch anniversary reward policy ${policyId}:`,
      error
    );
    throw error;
  }
};

// 가입 기념일 리워드 정책 생성
export const createAnniversaryRewardPolicy = async ({
  body,
  jsonWebToken,
}: {
  body: {
    year: number;
    pointAmount: number;
    isEnabled: boolean;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      "/admin/anniversary-reward-policies",
      "post",
      body,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (
      (data && data["data"] && data["data"]["anniversaryRewardPolicy"]) || null
    );
  } catch (error) {
    console.error("Failed to create anniversary reward policy:", error);
    throw error;
  }
};

// 가입 기념일 리워드 정책 수정
export const updateAnniversaryRewardPolicy = async ({
  policyId,
  body,
  jsonWebToken,
}: {
  policyId: string;
  body: {
    year: number;
    pointAmount: number;
    isEnabled: boolean;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/anniversary-reward-policies/${policyId}`,
      "put",
      body,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (
      (data && data["data"] && data["data"]["anniversaryRewardPolicy"]) || null
    );
  } catch (error) {
    console.error(
      `Failed to update anniversary reward policy ${policyId}:`,
      error
    );
    throw error;
  }
};

// 가입 기념일 리워드 정책 삭제
export const deleteAnniversaryRewardPolicy = async ({
  policyId,
  jsonWebToken,
}: {
  policyId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/anniversary-reward-policies/${policyId}`,
      "delete",
      {},
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (
      (data && data["data"] && data["data"]["anniversaryRewardPolicy"]) || null
    );
  } catch (error) {
    console.error(
      `Failed to delete anniversary reward policy ${policyId}:`,
      error
    );
    throw error;
  }
};
