export const IS_DEV = process.env.NODE_ENV === "development" ? true : false;

export const STORAGE_URL = `https://storage.youngposse.kr`;

// npm start = 개발 서버
// build => 릴리즈 서버
export const API_URL = IS_DEV
  ? `https://api-test.youngposse.kr`
  : `https://api.youngposse.kr`;
