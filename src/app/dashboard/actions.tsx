"use server";

import { axiosApi } from "@/lib/axios";
import { QRCodeVerificationStatsParams } from "@/lib/types";

// 일간 랭킹 분석 데이터 조회
export const getDailyRankingAnalysis = async ({
  params,
  jsonWebToken,
}: {
  params: {
    startDate: string;
    endDate: string;
    rankingRange: "TOP10" | "TOP30" | "TOP50";
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      "/admin/charts/daily-ranking-analysis",
      "get",
      params,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    // 스웨거 스펙에 따르면 응답은 { statusCode, results: { analysis } } 구조
    return data?.data || null;
  } catch (error) {
    console.warn("DashboardActions getDailyRankingAnalysis error", error);
    throw error;
  }
};

// QR 코드 인증 통계 조회
export const getQRCodeVerificationStats = async ({
  params,
  jsonWebToken,
}: {
  params: QRCodeVerificationStatsParams;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      "/admin/qr-codes/verification-stats",
      "get",
      params,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return data?.data || null;
  } catch (error) {
    console.warn("DashboardActions getQRCodeVerificationStats error", error);
    throw error;
  }
};
