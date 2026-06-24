"use client";

import { axiosApi } from "@/lib/axios";

// 이미지 업로드 관련 API 함수들

// 1단계: 멀티파트 업로드 ID 발급
export const getMultipartUploadId = async ({
  filename,
  fileType = "images",
  dataCollectionName = "announcements",
  jsonWebToken,
}: {
  filename: string;
  fileType?: string;
  dataCollectionName?: string;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      "/uploads/multipart/upload-id",
      "post",
      {
        filename,
        fileType,
        dataCollectionName,
      },
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return data?.data || null;
  } catch (error) {
    console.warn("getMultipartUploadId error", error);
    throw error;
  }
};

// 2단계: Pre-signed URL 발급
export const getPreSignedUrls = async ({
  uploadId,
  key,
  partCount = 1,
  jsonWebToken,
}: {
  uploadId: string;
  key: string;
  partCount?: number;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      "/uploads/multipart/pre-signed-urls",
      "post",
      {
        uploadId,
        key,
        partCount,
      },
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return data?.data || null;
  } catch (error) {
    console.warn("getPreSignedUrls error", error);
    throw error;
  }
};

// 3단계: 파일을 pre-signed URL에 업로드
export const uploadFileToS3 = async (
  presignedUrl: string,
  file: File,
): Promise<string> => {
  try {
    const response = await axiosApi(
      presignedUrl,
      "put",
      file,
      {
        headers: {
          "Content-Type": file.type,
        },
      },
      "", // baseURL을 빈 문자열로 설정하여 완전한 URL 사용
    );

    // ETag 추출 (따옴표 제거)
    const etag =
      response.headers.etag?.replace(/"/g, "") ||
      response.headers.ETag?.replace(/"/g, "") ||
      "";
    return etag;
  } catch (error) {
    console.warn("uploadFileToS3 error", error);
    throw error;
  }
};

// 파일 청크 업로드 함수 (멀티파트용)
export const uploadChunkToS3 = async (
  presignedUrl: string,
  chunk: Blob,
): Promise<string> => {
  try {
    const response = await axiosApi(
      presignedUrl,
      "put",
      chunk,
      {
        headers: {
          "Content-Type": "application/octet-stream",
        },
      },
      "", // baseURL을 빈 문자열로 설정하여 완전한 URL 사용
    );

    // ETag 추출 (따옴표 제거)
    const etag =
      response.headers.etag?.replace(/"/g, "") ||
      response.headers.ETag?.replace(/"/g, "") ||
      "";
    return etag;
  } catch (error) {
    console.warn("uploadChunkToS3 error", error);
    throw error;
  }
};

// 4단계: 멀티파트 업로드 완료 처리
export const completeMultipartUpload = async ({
  uploadId,
  key,
  partList,
  action = "complete",
  jsonWebToken,
}: {
  uploadId: string;
  key: string;
  partList: Array<{ partNumber: number; ETag: string }>;
  action?: "complete" | "abort";
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      "/uploads/multipart",
      "put",
      {
        uploadId,
        key,
        partList,
        action,
      },
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      },
    );
    return data?.data || null;
  } catch (error) {
    console.warn("completeMultipartUpload error", error);
    throw error;
  }
};

// 통합 이미지 업로드 함수
export const uploadImageFile = async ({
  file,
  jsonWebToken,
  onProgress,
  dataCollectionName = "announcements",
}: {
  file: File;
  jsonWebToken: string | null;
  onProgress?: (progress: number) => void;
  dataCollectionName?: string;
}): Promise<string> => {
  try {
    onProgress?.(10); // 시작

    // 1단계: 업로드 ID 발급
    const uploadData = await getMultipartUploadId({
      filename: file.name,
      fileType: "images",
      dataCollectionName,
      jsonWebToken,
    });

    if (!uploadData?.uploadId || !uploadData?.key) {
      throw new Error("Failed to get upload ID");
    }

    onProgress?.(30); // 업로드 ID 발급 완료

    // 2단계: Pre-signed URL 발급
    const urlData = await getPreSignedUrls({
      uploadId: uploadData.uploadId,
      key: uploadData.key,
      partCount: 1,
      jsonWebToken,
    });

    if (!urlData?.urlList?.[0]?.url) {
      throw new Error("Failed to get pre-signed URL");
    }

    onProgress?.(50); // Pre-signed URL 발급 완료

    // 3단계: S3에 파일 업로드
    const etag = await uploadFileToS3(urlData.urlList[0].url, file);

    onProgress?.(80); // 파일 업로드 완료

    // 4단계: 멀티파트 업로드 완료 처리
    await completeMultipartUpload({
      uploadId: uploadData.uploadId,
      key: uploadData.key,
      partList: [{ partNumber: 1, ETag: etag }],
      action: "complete",
      jsonWebToken,
    });

    onProgress?.(100); // 완료

    // 업로드된 파일의 key 반환 (경로)
    return uploadData.key;
  } catch (error) {
    console.error("uploadImageFile error", error);
    throw error;
  }
};

// 통합 동영상 업로드 함수
export const uploadVideoFile = async ({
  file,
  jsonWebToken,
  onProgress,
  dataCollectionName = "announcements",
}: {
  file: File;
  jsonWebToken: string | null;
  onProgress?: (progress: number) => void;
  dataCollectionName?: string;
}): Promise<string> => {
  try {
    onProgress?.(5); // 시작

    // 청크 크기 설정 (10MB)
    const CHUNK_SIZE = 10 * 1024 * 1024;
    const fileSize = file.size;
    const shouldUseMultipart = fileSize > 100 * 1024 * 1024; // 100MB 이상이면 멀티파트 사용

    // 1단계: 업로드 ID 발급
    const uploadData = await getMultipartUploadId({
      filename: file.name,
      fileType: "videos",
      dataCollectionName,
      jsonWebToken,
    });

    if (!uploadData?.uploadId || !uploadData?.key) {
      throw new Error("Failed to get upload ID");
    }

    onProgress?.(10); // 업로드 ID 발급 완료

    if (!shouldUseMultipart) {
      // 작은 파일: 단일 업로드
      const urlData = await getPreSignedUrls({
        uploadId: uploadData.uploadId,
        key: uploadData.key,
        partCount: 1,
        jsonWebToken,
      });

      if (!urlData?.urlList?.[0]?.url) {
        throw new Error("Failed to get pre-signed URL");
      }

      onProgress?.(30);
      const etag = await uploadFileToS3(urlData.urlList[0].url, file);
      onProgress?.(80);

      await completeMultipartUpload({
        uploadId: uploadData.uploadId,
        key: uploadData.key,
        partList: [{ partNumber: 1, ETag: etag }],
        action: "complete",
        jsonWebToken,
      });

      onProgress?.(100);
      return uploadData.key;
    }

    // 큰 파일: 멀티파트 업로드
    const partCount = Math.ceil(fileSize / CHUNK_SIZE);

    // 2단계: Pre-signed URL 발급 (여러 파트)
    const urlData = await getPreSignedUrls({
      uploadId: uploadData.uploadId,
      key: uploadData.key,
      partCount,
      jsonWebToken,
    });

    if (!urlData?.urlList || urlData.urlList.length === 0) {
      throw new Error("Failed to get pre-signed URLs");
    }

    onProgress?.(20); // URL 발급 완료

    // 3단계: 각 청크를 순차적으로 업로드
    const partList: Array<{ partNumber: number; ETag: string }> = [];

    for (let i = 0; i < partCount; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = file.slice(start, end);

      const presignedUrl = urlData.urlList[i]?.url;
      if (!presignedUrl) {
        throw new Error(`Failed to get pre-signed URL for part ${i + 1}`);
      }

      const etag = await uploadChunkToS3(presignedUrl, chunk);
      partList.push({ partNumber: i + 1, ETag: etag });

      // 진행률 업데이트 (20% ~ 85%)
      const uploadProgress = 20 + Math.floor(((i + 1) / partCount) * 65);
      onProgress?.(uploadProgress);
    }

    onProgress?.(90); // 업로드 완료

    // 4단계: 멀티파트 업로드 완료 처리
    await completeMultipartUpload({
      uploadId: uploadData.uploadId,
      key: uploadData.key,
      partList,
      action: "complete",
      jsonWebToken,
    });

    onProgress?.(100); // 완료

    // 업로드된 파일의 key 반환 (경로)
    return uploadData.key;
  } catch (error) {
    console.error("uploadVideoFile error", error);
    throw error;
  }
};

// 통합 오디오 업로드 함수
export const uploadAudioFile = async ({
  file,
  jsonWebToken,
  onProgress,
  dataCollectionName = "announcements",
}: {
  file: File;
  jsonWebToken: string | null;
  onProgress?: (progress: number) => void;
  dataCollectionName?: string;
}): Promise<string> => {
  try {
    onProgress?.(5); // 시작

    // 청크 크기 설정 (10MB)
    const CHUNK_SIZE = 10 * 1024 * 1024;
    const fileSize = file.size;
    const shouldUseMultipart = fileSize > 100 * 1024 * 1024; // 100MB 이상이면 멀티파트 사용

    // 1단계: 업로드 ID 발급
    const uploadData = await getMultipartUploadId({
      filename: file.name,
      fileType: "songs",
      dataCollectionName,
      jsonWebToken,
    });

    if (!uploadData?.uploadId || !uploadData?.key) {
      throw new Error("Failed to get upload ID");
    }

    onProgress?.(10); // 업로드 ID 발급 완료

    if (!shouldUseMultipart) {
      // 작은 파일: 단일 업로드
      const urlData = await getPreSignedUrls({
        uploadId: uploadData.uploadId,
        key: uploadData.key,
        partCount: 1,
        jsonWebToken,
      });

      if (!urlData?.urlList?.[0]?.url) {
        throw new Error("Failed to get pre-signed URL");
      }

      onProgress?.(30);
      const etag = await uploadFileToS3(urlData.urlList[0].url, file);
      onProgress?.(80);

      await completeMultipartUpload({
        uploadId: uploadData.uploadId,
        key: uploadData.key,
        partList: [{ partNumber: 1, ETag: etag }],
        action: "complete",
        jsonWebToken,
      });

      onProgress?.(100);
      return uploadData.key;
    }

    // 큰 파일: 멀티파트 업로드
    const partCount = Math.ceil(fileSize / CHUNK_SIZE);

    // 2단계: Pre-signed URL 발급 (여러 파트)
    const urlData = await getPreSignedUrls({
      uploadId: uploadData.uploadId,
      key: uploadData.key,
      partCount,
      jsonWebToken,
    });

    if (!urlData?.urlList || urlData.urlList.length === 0) {
      throw new Error("Failed to get pre-signed URLs");
    }

    onProgress?.(20); // URL 발급 완료

    // 3단계: 각 청크를 순차적으로 업로드
    const partList: Array<{ partNumber: number; ETag: string }> = [];

    for (let i = 0; i < partCount; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = file.slice(start, end);

      const presignedUrl = urlData.urlList[i]?.url;
      if (!presignedUrl) {
        throw new Error(`Failed to get pre-signed URL for part ${i + 1}`);
      }

      const etag = await uploadChunkToS3(presignedUrl, chunk);
      partList.push({ partNumber: i + 1, ETag: etag });

      // 진행률 업데이트 (20% ~ 85%)
      const uploadProgress = 20 + Math.floor(((i + 1) / partCount) * 65);
      onProgress?.(uploadProgress);
    }

    onProgress?.(90); // 업로드 완료

    // 4단계: 멀티파트 업로드 완료 처리
    await completeMultipartUpload({
      uploadId: uploadData.uploadId,
      key: uploadData.key,
      partList,
      action: "complete",
      jsonWebToken,
    });

    onProgress?.(100); // 완료

    // 업로드된 파일의 key 반환 (경로)
    return uploadData.key;
  } catch (error) {
    console.error("uploadAudioFile error", error);
    throw error;
  }
};
