"use server";

import { axiosApi } from "@/lib/axios";
import { AxiosError } from "axios";

// 약관 목록 조회
export const getTerms = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    __skip?: number;
    __limit?: number;
    type?: string;
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi("/admin/terms", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("TermsActions getTerms error", error);
    throw error;
  }
};

// 특정 약관 조회
export const getTermsById = async ({
  termsId,
  jsonWebToken,
}: {
  termsId: string;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/terms/${termsId}`,
      "get",
      undefined,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"] && data["data"]["terms"]) || null;
  } catch (error) {
    console.warn("TermsActions getTermsById error", error);
    throw error;
  }
};

// 약관 생성
export const createTerms = async ({
  body,
  jsonWebToken,
}: {
  body: {
    type: string;
    titleList: {
      ko: string;
      en: string;
    }[];
    contentList: {
      ko: string;
      en: string;
    }[];
    version: string;
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi("/admin/terms", "post", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"] && data["data"]["terms"]) || null;
  } catch (error) {
    console.warn("TermsActions createTerms error", error);

    throw error;
  }
};

// 약관 삭제
export const deleteTerms = async ({
  termsId,
  jsonWebToken,
}: {
  termsId: string;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/terms/${termsId}`,
      "delete",
      {},
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return data && !data?.["error"] ? true : false;
  } catch (error) {
    console.warn("TermsActions deleteTerms error", error);
    throw error;
  }
};

// 약관 활성화
export const activateTerms = async ({
  termsId,
  jsonWebToken,
}: {
  termsId: string;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/terms/${termsId}/activate`,
      "post",
      {},
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"] && data["data"]["terms"]) || null;
  } catch (error) {
    console.warn("TermsActions activateTerms error", error);
    throw error;
  }
};
