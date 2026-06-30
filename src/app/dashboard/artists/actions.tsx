"use server";

import { axiosApi } from "@/lib/axios";
import { Artist } from "@/lib/types";

type ArtistCreateResult =
  | {
      artist: Artist;
      errorMessage?: never;
    }
  | {
      artist: null;
      errorMessage: string;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getArtistCreateErrorMessage = (error: unknown) => {
  if (!isRecord(error)) {
    return "아티스트 생성 중 오류가 발생했습니다.";
  }

  const response = error.response;
  if (!isRecord(response)) {
    return "네트워크 상태를 확인해주세요.";
  }

  const data = response.data;
  if (!isRecord(data)) {
    return "아티스트 생성 중 오류가 발생했습니다.";
  }

  const status = typeof response.status === "number" ? response.status : null;
  const apiError = data.error;
  const serverMessage =
    isRecord(apiError) && typeof apiError.message === "string"
      ? apiError.message.toLowerCase()
      : typeof data.message === "string"
        ? data.message.toLowerCase()
        : "";

  if (status === 422 || serverMessage.includes("already")) {
    return "이미 사용 중인 아티스트 계정입니다.";
  }

  if (status === 401 || serverMessage.includes("unauthorized")) {
    return "인증이 만료되었습니다. 다시 로그인해주세요.";
  }

  if (status === 404) {
    return "관리자 정보를 찾을 수 없습니다. 다시 로그인 후 시도해주세요.";
  }

  if (
    serverMessage.includes("account") &&
    (serverMessage.includes("required") || serverMessage.includes("invalid"))
  ) {
    return "계정 ID를 확인해주세요.";
  }

  if (
    serverMessage.includes("password") &&
    (serverMessage.includes("required") || serverMessage.includes("invalid"))
  ) {
    return "비밀번호를 확인해주세요.";
  }

  if (
    serverMessage.includes("name") &&
    (serverMessage.includes("required") || serverMessage.includes("invalid"))
  ) {
    return "아티스트 이름을 확인해주세요.";
  }

  if (isRecord(apiError) && typeof apiError.message === "string") {
    return "입력한 정보를 확인해주세요.";
  }

  return "아티스트 생성 중 오류가 발생했습니다.";
};

export const getArtists = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    __skip?: number;
    __limit?: number;
    __includeDeleted?: boolean;
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi("/admin/artists", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || [];
  } catch (error) {
    console.warn("AnnouncementsActions getAnnouncements error", error);
  }
};

export const getArtist = async ({
  id,
  jsonWebToken,
}: {
  id: string;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/artists/${id}`,
      "get",
      {},
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"] && data["data"]["artist"]) || null;
  } catch (error) {
    console.warn("AnnouncementsActions getAnnouncement error", error);
  }
};

export const postArtist = async ({
  body,
  jsonWebToken,
}: {
  body: {
    account: string;
    password: string;
    nameList: {
      ko: string;
      en: string;
    }[];
    imageList?: { name: string; imageOriginalPath: string }[];
  };
  jsonWebToken: string | null;
}): Promise<ArtistCreateResult> => {
  try {
    const { data } = await axiosApi("/admin/artists", "post", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    const artist = (data && data["data"] && data["data"]["artist"]) || null;

    if (!artist) {
      return {
        artist: null,
        errorMessage: "아티스트 생성 응답을 확인할 수 없습니다.",
      };
    }

    return { artist };
  } catch (error) {
    console.warn("AnnouncementsActions postArtist error", error);
    return {
      artist: null,
      errorMessage: getArtistCreateErrorMessage(error),
    };
  }
};

export const patchArtist = async ({
  id,
  body,
  jsonWebToken,
}: {
  id: string;
  body: {
    nameList: {
      ko: string;
      en: string;
    }[];
    imageList?: { name: string; imageOriginalPath: string }[];
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(`/admin/artists/${id}`, "patch", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"] && data["data"]["artist"]) || null;
  } catch (error) {
    console.warn("AnnouncementsActions patchArtist error", error);
  }
};

export const deleteArtist = async ({
  id,
  jsonWebToken,
}: {
  id: string;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/artists/${id}`,
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
    console.warn("AnnouncementsActions deleteArtist error", error);
  }
};
