"use server";

import { axiosApi } from "@/lib/axios";
import {
  BenefitsResponse,
  BenefitDetailResponse,
  CreateBenefitResponse,
  CreateBenefitForm,
} from "@/lib/types";

// 특전 목록 조회
export const getBenefits = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    __skip?: number;
    __limit?: number;
    title?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    sort?: string;
  };
  jsonWebToken: string;
}): Promise<BenefitsResponse | null> => {
  try {
    const { data } = await axiosApi("/admin/benefits", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("Benefits getBenefits error", error);
    throw error;
  }
};

// 특전 생성 및 발송
export const createBenefit = async ({
  body,
  jsonWebToken,
}: {
  body: CreateBenefitForm;
  jsonWebToken: string;
}): Promise<CreateBenefitResponse | null> => {
  try {
    const { data } = await axiosApi("/admin/benefits", "post", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("Benefits createBenefit error", error);
    throw error;
  }
};

// 특정 특전 조회
export const getBenefitDetail = async ({
  benefitId,
  jsonWebToken,
}: {
  benefitId: string;
  jsonWebToken: string;
}): Promise<BenefitDetailResponse | null> => {
  try {
    const { data } = await axiosApi(
      `/admin/benefits/${benefitId}`,
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
    console.warn("Benefits getBenefitDetail error", error);
    throw error;
  }
};
