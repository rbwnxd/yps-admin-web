// QR 코드 카테고리 옵션
export const CATEGORY_OPTIONS = [
  { value: "PLATFORM_ALBUM", label: "플랫폼 앨범" },
  { value: "CONTENTS_ALBUM", label: "콘텐츠 앨범" },
  { value: "CONTENTS_GOODS", label: "콘텐츠 굿즈" },
  { value: "ALBUM", label: "앨범" },
  { value: "CONCERT", label: "콘서트" },
  { value: "BROADCAST", label: "방송" },
  { value: "GOODS", label: "굿즈" },
  { value: "OFFLINE_SPOT", label: "오프라인 스팟" },
] as const;

// 카테고리 코드를 한글 라벨로 변환하는 헬퍼 함수
export const getCategoryLabel = (category: string): string => {
  const option = CATEGORY_OPTIONS.find((option) => option.value === category);
  return option ? option.label : category;
};

// 카테고리 타입 정의
export type CategoryType = (typeof CATEGORY_OPTIONS)[number]["value"];
