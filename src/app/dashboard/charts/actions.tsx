"use server";

import { axiosApi } from "@/lib/axios";

// 관리자용 차트 목록 조회
export const getCharts = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    __skip?: number;
    __limit?: number;
    __includeDeleted?: boolean;
    __includeInactive?: boolean;
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi("/admin/charts", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("ChartActions getCharts error", error);
    throw error;
  }
};

// 관리자용 차트 랭킹 조회
export const getChartRanking = async ({
  chartId,
  params,
  jsonWebToken,
}: {
  chartId: string;
  params?: {
    __skip?: number;
    __limit?: number;
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/charts/${chartId}/ranking`,
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
    console.warn("ChartActions getChartRanking error", error);
    throw error;
  }
};

// 시스템 차트 등록
export const createSystemCharts = async ({
  jsonWebToken,
}: {
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      "/admin/charts/system",
      "post",
      {},
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("ChartActions createSystemCharts error", error);
    throw error;
  }
};

// 시즌 차트 생성
export const createSeasonChart = async ({
  body,
  jsonWebToken,
}: {
  body: {
    nameList: Array<{ ko: string; en: string }>;
    descriptionList: Array<{ ko: string; en: string }>;
    season: {
      startedAt: string;
      endedAt: string;
    };
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi("/admin/charts/season", "post", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("ChartActions createSeasonChart error", error);
    throw error;
  }
};

// 시즌 차트 삭제
export const deleteSeasonChart = async ({
  chartId,
  jsonWebToken,
}: {
  chartId: string;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/charts/season/${chartId}`,
      "delete",
      {},
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("ChartActions deleteSeasonChart error", error);
    throw error;
  }
};

// 시즌 차트 활성화 상태 수정
export const updateSeasonChartActivation = async ({
  chartId,
  isActivated,
  jsonWebToken,
}: {
  chartId: string;
  isActivated: boolean;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/charts/season/${chartId}`,
      "patch",
      { isActivated },
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("ChartActions updateSeasonChartActivation error", error);
    throw error;
  }
};
