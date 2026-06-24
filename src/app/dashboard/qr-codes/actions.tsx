"use server";

import { axiosApi } from "@/lib/axios";

import type {
  QRCodeCategory,
  QRCodeContentType,
  QRCodeContentAlbumTrack,
} from "@/lib/types";

// QR 코드 목록 조회
export const getQRCodes = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    __skip?: number;
    __limit?: number;
    category?: QRCodeCategory;
    __includeDeleted?: boolean;
    __includeDisabled?: boolean;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi("/admin/qr-codes", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode getQRCodes error", error);
    throw error;
  }
};

// QR 코드 생성
export const createQRCode = async ({
  body,
  jsonWebToken,
}: {
  body: {
    category: QRCodeCategory;
    point?: number;
    displayMainTitleList?: { [key: string]: string }[];
    displaySubTitleList?: { [key: string]: string }[];
    displayTextList?: { [key: string]: string }[];
    imageList?: { name: string; imageOriginalPath: string }[];
    expireMinutes?: number | null;
    issuedCount?: number;
    hashCount?: number;
    isHashReusable?: boolean;
    isEnabled?: boolean;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi("/admin/qr-codes", "post", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"] && data["data"]["qrCode"]) || null;
  } catch (error) {
    console.warn("QRCode createQRCode error", error);
    throw error;
  }
};

// QR 코드 수정 함수
export const updateQRCode = async ({
  id,
  body,
  jsonWebToken,
}: {
  id: string;
  body: {
    category?: QRCodeCategory;
    point?: number;
    displayMainTitleList?: { [key: string]: string }[];
    displaySubTitleList?: { [key: string]: string }[];
    displayTextList?: { [key: string]: string }[];
    imageList?: { name: string; imageOriginalPath: string }[];
    issuedCount?: number;
    isEnabled?: boolean;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(`/admin/qr-codes/${id}`, "patch", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"] && data["data"]["qrCode"]) || null;
  } catch (error) {
    console.warn("QRCode updateQRCode error", error);
    throw error;
  }
};

// QR 코드 삭제 함수
export const deleteQRCode = async ({
  id,
  jsonWebToken,
}: {
  id: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/${id}`,
      "delete",
      undefined,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode deleteQRCode error", error);
    throw error;
  }
};

// QR 코드 단일 상세 조회
export const getQRCodeDetail = async ({
  qrCodeId,
  jsonWebToken,
}: {
  qrCodeId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/${qrCodeId}`,
      "get",
      undefined,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode getQRCodeDetail error", error);
    throw error;
  }
};

// QR 코드 해시 목록 조회
export const getQRCodeHashes = async ({
  qrCodeId,
  params,
  jsonWebToken,
}: {
  qrCodeId: string;
  params?: {
    __skip?: number;
    __limit?: number;
    __includeDeleted?: boolean;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/${qrCodeId}/hashes`,
      "get",
      params,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode getQRCodeHashes error", error);
    throw error;
  }
};

// 해시 추가 발행
export const createAdditionalIssueQRCode = async ({
  qrCodeId,
  body,
  jsonWebToken,
}: {
  qrCodeId: string;
  body: {
    hashCount: number;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/${qrCodeId}/hashes`,
      "post",
      body,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode createAdditionalIssueQRCode error", error);
    throw error;
  }
};

// 체크인 목록 조회 (앱 관리자용)
export const getQRCodeCheckIns = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    __skip?: number;
    __limit?: number;
    __includeDeleted?: boolean;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi("/admin/qr-codes/check-in", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode getQRCodeCheckIns error", error);
    throw error;
  }
};

// 체크인 생성
export const createQRCodeCheckIn = async ({
  body,
  jsonWebToken,
}: {
  body: {
    category: QRCodeCategory;
    title: string;
    startAt: string;
    endAt: string;
    adminIds: string[];
    memo?: string;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi("/admin/qr-codes/check-in", "post", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"] && data["data"]["qrCodeCheckIn"]) || null;
  } catch (error) {
    console.warn("QRCode createQRCodeCheckIn error", error);
    throw error;
  }
};

// 체크인 수정
export const updateQRCodeCheckIn = async ({
  checkInId,
  body,
  jsonWebToken,
}: {
  checkInId: string;
  body: {
    category: QRCodeCategory;
    title: string;
    startAt: string;
    endAt: string;
    adminIds: string[];
    memo?: string;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/check-in/${checkInId}`,
      "put",
      body,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"] && data["data"]["qrCodeCheckIn"]) || null;
  } catch (error) {
    console.warn("QRCode updateQRCodeCheckIn error", error);
    throw error;
  }
};

// 체크인 삭제
export const deleteQRCodeCheckIn = async ({
  checkInId,
  jsonWebToken,
}: {
  checkInId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/check-in/${checkInId}`,
      "delete",
      undefined,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode deleteQRCodeCheckIn error", error);
    throw error;
  }
};

// QR 코드 체크인 검증
export const verifyQRCodeCheckIn = async ({
  qrCodeCheckInId,
  body,
  jsonWebToken,
}: {
  qrCodeCheckInId: string;
  body: {
    hashId: string;
    token: string;
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/check-in/${qrCodeCheckInId}/verify`,
      "post",
      body,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode verifyQRCodeCheckIn error", error);
    throw error;
  }
};

// 체크인 검증 목록 조회
export const getQRCodeVerifications = async ({
  qrCodeCheckInId,
  params,
  jsonWebToken,
}: {
  qrCodeCheckInId: string;
  params?: {
    __skip?: number;
    __limit?: number;
    userId?: string; // 새로 추가된 userId 필터
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/check-in/${qrCodeCheckInId}/verifications`,
      "get",
      params,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode getQRCodeVerifications error", error);
    throw error;
  }
};

// 체크인 검증 기록 삭제
export const deleteQRCodeVerification = async ({
  qrCodeCheckInId,
  qrCodeVerificationId,
  jsonWebToken,
}: {
  qrCodeCheckInId: string;
  qrCodeVerificationId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/check-in/${qrCodeCheckInId}/verifications/${qrCodeVerificationId}`,
      "delete",
      undefined,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode deleteQRCodeVerification error", error);
    throw error;
  }
};

// === QR 코드 콘텐츠 관련 함수들 ===

// QR 코드 콘텐츠 목록 조회
export const getQRCodeContents = async ({
  qrCodeId,
  params,
  jsonWebToken,
}: {
  qrCodeId: string;
  params?: {
    type?: QRCodeContentType;
    __limit?: number;
    __skip?: number;
    __sortBy?: string;
    __sort?: "1" | "-1";
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/${qrCodeId}/contents`,
      "get",
      params,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode getQRCodeContents error", error);
    throw error;
  }
};

// QR 코드 콘텐츠 생성
export const createQRCodeContent = async ({
  qrCodeId,
  body,
  jsonWebToken,
}: {
  qrCodeId: string;
  body: {
    type: QRCodeContentType;
    titleI18n?: { [key: string]: string } | null;
    descriptionI18n?: { [key: string]: string } | null;
    isPublished?: boolean;
    publishedAt?: string | null;
    photo?: {
      imageOriginalPath: string;
    };
    video?: {
      thumbnailImageOriginalPath: string;
      videoFilename: string;
      videoFilePath: string;
    };
    album?: {
      imageOriginalPath: string;
      trackList: QRCodeContentAlbumTrack[];
    };
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/${qrCodeId}/contents`,
      "post",
      body,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode createQRCodeContent error", error);
    throw error;
  }
};

// QR 코드 콘텐츠 수정
export const updateQRCodeContent = async ({
  qrCodeId,
  qrCodeContentId,
  body,
  jsonWebToken,
}: {
  qrCodeId: string;
  qrCodeContentId: string;
  body: {
    type?: QRCodeContentType;
    titleI18n?: { [key: string]: string } | null;
    descriptionI18n?: { [key: string]: string } | null;
    isPublished?: boolean;
    publishedAt?: string | null;
    photo?: {
      imageOriginalPath: string;
    };
    video?: {
      thumbnailImageOriginalPath: string;
      videoFilename: string;
      videoFilePath: string;
    };
    album?: {
      imageOriginalPath: string;
      trackList: QRCodeContentAlbumTrack[];
    };
  };
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/${qrCodeId}/contents/${qrCodeContentId}`,
      "put",
      body,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode updateQRCodeContent error", error);
    throw error;
  }
};

// QR 코드 콘텐츠 삭제
export const deleteQRCodeContent = async ({
  qrCodeId,
  qrCodeContentId,
  jsonWebToken,
}: {
  qrCodeId: string;
  qrCodeContentId: string;
  jsonWebToken: string;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/qr-codes/${qrCodeId}/contents/${qrCodeContentId}`,
      "delete",
      undefined,
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return (data && data["data"]) || null;
  } catch (error) {
    console.warn("QRCode deleteQRCodeContent error", error);
    throw error;
  }
};

// 별칭 export (다이얼로그 호환성)
export const postQRCodeContent = createQRCodeContent;
export const putQRCodeContent = updateQRCodeContent;
