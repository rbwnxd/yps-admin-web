export interface Announcement {
  _id: string;
  titleList: [
    {
      ko: string;
      en: string;
    },
  ];
  contentList: [
    {
      ko: string;
      en: string;
    },
  ];
  publishedAt: string;
  imageList: {
    image64Path: string;
    image128Path: string;
    image256Path: string;
    image512Path: string;
    image1024Path: string;
    imageFilename: string;
    imageOriginalPath: string;
    name: string;
  }[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Artist {
  _id: string;
  account?: string;
  nameList: [
    {
      ko: string;
      en: string;
    },
  ];
  imageList: {
    image64Path: string;
    image128Path: string;
    image256Path: string;
    image512Path: string;
    image1024Path: string;
    imageFilename: string;
    imageOriginalPath: string;
    name: string;
  }[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// === 차트 관련 타입들 ===

export interface ChartItem {
  _id: string;
  nameList: Array<{ ko: string; en: string }>;
  descriptionList: Array<{ ko: string; en: string }>;
  type: "DAILY_ACCUMULATED" | "ALL_TIME_ACCUMULATED" | "SEASON";
  season?: {
    startedAt: string;
    endedAt: string;
  } | null;
  isActivated: boolean;
  summaryUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// 관리자용 차트 랭킹 아이템 타입 (새 API 스펙 기준)
export interface AdminChartRankingItem {
  user: {
    _id: string;
    nickname: string;
    imageList: Array<{
      name: string;
      imageOriginalPath: string;
      image64Path: string;
      image128Path: string;
      image256Path: string;
      image512Path: string;
      image1024Path: string;
      imageFilename: string;
    }>;
    currentPoint: number;
    gradeInfo: GradeInfo;
    createdAt: string;
    deletedAt: string | null;
  };
  previousTotalPoint: number | null;
  totalPoint: number;
  previousRanking: number | null;
  ranking: number;
  changedRanking: number | null;
  index: number;
}

// 시즌 차트 생성 폼 타입
export interface SeasonChartForm {
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  startedAt: string;
  endedAt: string;
}

// === 앱 관리자 관련 타입들 ===

export interface AppAdminUser {
  _id: string;
  account: string;
  name: string;
  isEnabled: boolean;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// 앱 관리자 생성 폼 타입
export interface AppAdminUserForm {
  account: string;
  password: string;
  name: string;
}

// 앱 관리자 수정 폼 타입
export interface AppAdminUserUpdateForm {
  password?: string;
  permissions?: string[];
  name?: string;
}

// === QR 코드 관련 타입들 ===

export interface QRCodeImage {
  name: string;
  imageOriginalPath: string;
  image64Path: string;
  image128Path: string;
  image256Path: string;
  image512Path: string;
  image1024Path: string;
  imageFilename: string;
}

export interface MultiLanguageText {
  ko: string;
  en: string;
}

export type QRCodeCategory =
  | "PLATFORM_ALBUM"
  | "CONTENTS_ALBUM"
  | "CONTENTS_GOODS"
  | "ALBUM"
  | "CONCERT"
  | "BROADCAST"
  | "GOODS"
  | "OFFLINE_SPOT";

export interface QRCode {
  _id: string;
  type: "STATIC" | "CHECK_IN";
  category: QRCodeCategory;
  imageList: QRCodeImage[];
  point: number;
  issuedCount: number;
  verifiedCount: number;
  hashCount: number;
  displayMainTitleList: MultiLanguageText[];
  displaySubTitleList: MultiLanguageText[];
  displayTextList: MultiLanguageText[];
  isEnabled: boolean;
  expireMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  expiresAt: string | null;
  userId?: string;
  user?: {
    _id: string;
    nickname: string;
    imageList: QRCodeImage[];
  };
  isHashReusable?: boolean; // 해시 재활용 가능 여부
  albumCount?: number; // 앨범 콘텐츠 수
  trackCount?: number; // 트랙 수
  photoCount?: number; // 사진 콘텐츠 수
  videoCount?: number; // 비디오 콘텐츠 수
}

export interface QRCodeHash {
  _id: string;
  qrCodeId: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QRCodeCheckIn {
  _id: string;
  category: QRCodeCategory;
  title: string;
  startAt: string;
  endAt: string;
  admins: Array<{
    _id: string;
    name: string;
    account: string;
  }>;
  memo: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface QRCodeVerification {
  _id: string;
  user: {
    _id: string;
    nickname: string;
    imageList?: QRCodeImage[];
  };
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;

  qrCodeId: string;
  qrCodeHashId: string;
  category: QRCodeCategory;
  verifiedAdmin: {
    _id: string;
    account: string;
    name: string;
  };
}

// === QR 코드 콘텐츠 관련 타입들 ===

export type QRCodeContentType = "TEXT" | "PHOTO" | "VIDEO" | "ALBUM";

export interface QRCodeContentAlbumTrack {
  number: number;
  isMainTitle: string;
  isTitle: number;
  titleI18n?: {
    ko?: string;
    en?: string;
  };
  descriptionI18n?: {
    ko?: string;
    en?: string;
  };
  artistNameI18n?: {
    ko?: string;
    en?: string;
  };
  durationSeconds: number;
  trackFilename: string;
  trackFilePath: string;
}

export interface QRCodeContent {
  _id: string;
  qrCodeId: string;
  type: QRCodeContentType;
  titleI18n?: { [key: string]: string } | null;
  descriptionI18n?: { [key: string]: string } | null;
  isPublished: boolean;
  publishedAt?: string | null;
  photo?: {
    imageOriginalPath: string;
    image512Path?: string;
  };
  video?: {
    thumbnailImageOriginalPath: string;
    thumbnailImage512Path?: string;
    videoFilename: string;
    videoFilePath: string;
  };
  album?: {
    imageOriginalPath: string;
    image512Path?: string;
    trackList: QRCodeContentAlbumTrack[];
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// === 사용자 관련 타입들 ===

export interface UserImage {
  name: string;
  imageOriginalPath: string;
  image64Path: string;
  image128Path: string;
  image256Path: string;
  image512Path: string;
  image1024Path: string;
  imageFilename: string;
}

export interface UserProfile {
  name: string;
  nickname: string;
  birth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  phoneNumber: string;
}

export interface UserPoint {
  currentPoint: number;
  totalUsedPoint: number;
  totalReceivedPoint: number;
}

export interface RestrictionInfo {
  isRestricted: boolean;
  restrictedAt: string | null;
  restrictedReason: string | null;
  restrictionEndsAt: string | null;
}
export interface GradeInfo {
  title:
    | "STONE"
    | "BRONZE"
    | "SILVER"
    | "GOLD"
    | "PLATINUM"
    | "DIAMOND"
    | "MASTER"
    | "ARTIST";
  level: number;
  createdAt: string;
}

export interface BanInfo {
  isBanned: boolean;
  bannedReason: string | null;
  bannedAt: string | null;
}

// 완전한 사용자 타입 (관리자 페이지용)
export interface User {
  _id: string;
  account: string;
  email: string;
  emailVerifiedAt: string | null;
  platform: "GOOGLE" | "APPLE" | "KAKAO" | "NAVER";
  platformUserId: string;
  profile: UserProfile;
  countryCode: string;
  languageCode: string;
  point: UserPoint;
  termsAgreedAt: string;
  nicknameChangedAt: string | null;
  imageList: UserImage[];
  restrictionInfo: RestrictionInfo;
  gradeInfo: GradeInfo;
  banInfo: BanInfo;
  memberHash: string;
  favoriteArtistIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 사용자 검색 다이얼로그용 간소화된 타입
export interface UserSearchResult {
  _id: string;
  email: string;
  profile: {
    nickname: string;
  };
  imageList: UserImage[];
}

// 사용자 목록 API 응답 타입
export interface UsersResponse {
  users: User[];
  count: number;
}

// 사용자 상세 API 응답 타입
export interface UserDetailResponse {
  user: User;
}

// === 포인트 지급/차감 관련 타입들 ===

// 포인트 작업 대상 사용자 (간소화된 정보)
export interface TargetUser {
  _id: string;
  nickname: string;
  imageList: UserImage[];
}

// 포인트 지급/차감 작업
export interface PointModification {
  _id: string;
  type: "GRANT" | "REVOKE";
  title: string;
  amount: number;
  description: string;
  status: "PENDING" | "SCHEDULED" | "COMPLETED" | "FAILED";
  targetUserIds: string[];
  targetUsers: TargetUser[] | null;
  processedUserIds: string[];
  processedUsers: TargetUser[] | null;
  scheduledAt: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 포인트 지급/차감 생성 폼 타입
export interface PointModificationForm {
  type: "GRANT" | "REVOKE";
  title: string;
  amount: number;
  description: string;
  targetUserIds: string[];
  scheduledAt: string | null;
}

// 포인트 지급/차감 목록 API 응답 타입 (results 내부)
export interface PointModificationsResponse {
  count: number;
  adminPointModifications: PointModification[];
}

// 포인트 지급/차감 상세 API 응답 타입 (results 내부)
export interface PointModificationDetailResponse {
  pointModification: PointModification;
}

// 포인트 지급/차감 생성 API 응답 타입 (results 내부)
export interface CreatePointModificationResponse {
  adminPointModification: PointModification;
}

// === 특전 관련 타입들 ===

export type BenefitStatus =
  | "PENDING"
  | "SCHEDULED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELED"
  | "FAILED";

export type BenefitFilterType = "TOP_RANKING" | "USER_CREATED_AT";

export interface BenefitFilter {
  type: BenefitFilterType;
  topRanking?: number;
  userCreatedAtFrom?: string;
  userCreatedAtTo?: string;
}

export interface BenefitEmail {
  subject: string;
  content: string;
  attachments?: Array<{
    name: string;
    path: string;
  }>;
}

export interface BenefitPushNotification {
  title: string;
  body: string;
}

export interface BenefitUser {
  _id: string;
  nickname: string;
  imageList: UserImage[];
  createdAt: string;
}

export interface Benefit {
  _id: string;
  status: BenefitStatus;
  filter: BenefitFilter;
  email: BenefitEmail;
  pushNotification: BenefitPushNotification;
  userIds: string[];
  users: BenefitUser[];
  createdAt: string;
  updatedAt: string;
  title: string;
}

// 특전 생성 폼 타입
export interface CreateBenefitForm {
  title: string;
  filter: BenefitFilter;
  email: BenefitEmail;
  pushNotification: BenefitPushNotification;
}

// 특전 API 응답 타입들
export interface BenefitsResponse {
  count: number;
  benefits: Benefit[];
}

export interface BenefitDetailResponse {
  benefit: Benefit;
}

export interface CreateBenefitResponse {
  benefit: Benefit;
}

// === 아티스트 폼 관련 타입들 ===

// 업로드된 이미지 (폼에서 사용)
export interface UploadedImage {
  id: string;
  file: File | null; // 기존 업로드된 이미지의 경우 null일 수 있음
  path?: string;
  progress: number;
  isUploading: boolean;
  error?: string;
  preview?: string; // 미리보기 URL 추가
}

// 아티스트 폼 데이터
export interface ArtistFormData {
  account: string;
  password: string;
  nameKo: string;
  nameEn: string;
}

// === 공지사항 폼 관련 타입들 ===

// 공지사항 폼 데이터
export interface AnnouncementFormData {
  titleKo: string;
  titleEn: string;
  contentKo: string;
  contentEn: string;
  publishedAt: string;
}

// === QR 코드 관련 타입들 ===

// 다국어 텍스트
export interface MultiLanguageText {
  ko: string;
  en: string;
  [key: string]: string;
}

// QR 코드 폼 데이터
export interface QRCodeFormData {
  category: QRCodeCategory | "";
  point: number;
  expireMinutes: number | null;
  issuedCount: number;
  hashCount: number;
  isHashReusable: boolean;
  isEnabled: boolean;
}

// QR 코드용 업로드된 이미지
export interface QRCodeUploadedImage {
  id: string;
  file: File | null;
  path?: string;
  progress?: number;
  isUploading: boolean;
  error?: string;
}

// QR 코드 체크인 관리자
export interface QRCodeCheckInAdmin {
  _id: string;
  name: string;
  account: string;
}

// QR 코드 체크인 폼 데이터
export interface QRCodeCheckInFormData {
  category: QRCodeCategory | "";
  title: string;
  startAt: string;
  endAt: string;
  memo: string;
}

export interface AnniversaryRewardPolicyFormData {
  year: number;
  pointAmount: number;
  isEnabled: boolean;
}

export interface AnniversaryRewardPolicy {
  _id: string;
  year: number;
  pointAmount: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// === 일간 랭킹 분석 관련 타입들 ===

export type RankingRange = "TOP10" | "TOP30" | "TOP50";

// 랭킹 분석용 사용자 정보
export interface DailyRankingAnalysisDtoUser {
  _id: string;
  nickname: string;
  imageList: UserImage[];
  gradeInfo: GradeInfo;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 사용자별 랭킹 통계
export interface DailyRankingAnalysisUserStat {
  user: DailyRankingAnalysisDtoUser | null;
  totalAppearances: number; // 전체 진입 횟수
  bestRanking: number; // 최고 순위 (1부터 시작)
  averageRanking: number; // 평균 순위
  appearanceRate: number; // 진입률 (백분율)
  firstAppearanceDate: string; // 첫 진입 날짜
  lastAppearanceDate: string; // 마지막 진입 날짜
}

// 일간 랭킹 분석 결과 (스웨거 스펙 기준)
export interface DailyRankingAnalysisDto {
  chartId: string; // 차트 고유 ID
  range: RankingRange; // 분석 범위 (TOP10, TOP30, TOP50)
  startDate: string; // 분석 시작 날짜
  endDate: string; // 분석 종료 날짜
  totalDays: number; // 전체 분석 일수
  userStats: DailyRankingAnalysisUserStat[]; // 사용자별 랭킹 통계
}

// 일간 랭킹 분석 API 요청 파라미터
export interface DailyRankingAnalysisParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  rankingRange: RankingRange;
}

// 일간 랭킹 분석 API 응답 타입 (스웨거 스펙 기준)
export interface DailyRankingAnalysisApiResponse {
  statusCode: number;
  results: {
    analysis: DailyRankingAnalysisDto;
  };
}

// === QR 코드 인증 통계 관련 타입들 ===

export type QRVerificationPeriod = "monthly" | "yearly";

// 카테고리별 통계
export interface QRCodeVerificationCategoryStatDto {
  category: string;
  count: number;
  percentage: number;
}

// QR 코드 인증 통계
export interface QRCodeVerificationStatsDto {
  period: QRVerificationPeriod;
  year: number;
  month: number | null;
  totalVerifications: number;
  categoryStats: QRCodeVerificationCategoryStatDto[];
  startDate: string;
  endDate: string;
}

// QR 코드 인증 통계 API 요청 파라미터
export interface QRCodeVerificationStatsParams {
  period: QRVerificationPeriod;
  year: number;
  month?: number;
}

// QR 코드 인증 통계 API 응답 타입
export interface QRCodeVerificationStatsResponse {
  statusCode: number;
  results: {
    stats: QRCodeVerificationStatsDto;
  };
}

// === 약관 관련 타입들 ===

export type TermsType = "PRIVACY_POLICY" | "TERMS_OF_SERVICE";

export interface Terms {
  _id: string;
  type: TermsType;
  titleList: [
    {
      ko: string;
      en: string;
    },
  ];
  contentList: [
    {
      ko: string;
      en: string;
    },
  ];
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TermsFormData {
  type: TermsType;
  titleKo: string;
  titleEn: string;
  contentKo: string;
  contentEn: string;
  version: string;
}

export interface TermsResponse {
  count: number;
  terms: Terms[];
}

export interface TermsDetailResponse {
  terms: Terms;
}

export interface CreateTermsResponse {
  terms: Terms;
}

// === 알림 관련 타입들 ===

export interface Notification {
  _id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface NotificationListDto {
  count: number;
  notifications: Notification[];
}
