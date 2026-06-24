import axios, { AxiosError, Method, AxiosRequestConfig } from "axios";
import moment from "moment";
import { API_URL } from "./api";

export const IS_DEV = process.env["NODE_ENV"] === "development";

// API 옵션 타입 정의
interface ApiOptions {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

const apiHandler = axios.create({
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-type": "application/json",
  },
  validateStatus: (status) => status >= 200 && status < 300,
});

apiHandler.interceptors.response.use(
  (response) => response,
  (error) => {
    // console.warn('[error][request]', error && error.response)
    if (error && error.response) {
      if (error.response.data) {
        console.log("ws", error.response.data);
      }
    } else {
      // showToast('네트워크 상태를 확인해주세요.')
    }
    throw error;
  },
);

/**
 * axios#request(config)
 * axios#get(url[, config])
 * axios#delete(url[, config])
 * axios#head(url[, config])
 * axios#options(url[, config])
 * axios#post(url[, data[, config]])
 * axios#put(url[, data[, config]])
 * axios#patch(url[, data[, config]])
 * axios#getUri([config])
 */
/**
 * config 종류
 * https://github.com/axios/axios
 * 'Request Config' 검색
 */
export async function axiosApi(
  url: string,
  method:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH"
    | "get"
    | "post"
    | "put"
    | "delete"
    | "patch" = "GET",
  data?: object,
  options: ApiOptions = {},
  baseURL = `${API_URL}`,
) {
  try {
    const _method = method.toLowerCase();

    // headers와 다른 옵션들을 분리
    const { headers, ...restOptions } = options;

    const requestConfig: AxiosRequestConfig = {
      method: _method as Method,
      baseURL,
      url,
      headers,
      ...restOptions,
    };

    // 메서드에 따른 데이터 처리
    if (_method === "get") {
      requestConfig.params = data;
    } else if (_method === "delete") {
      requestConfig.data = data;
    } else {
      requestConfig.data = data;
    }

    if (IS_DEV) {
      const _startTime = new Date().getTime();
      try {
        const res = await apiHandler.request(requestConfig);
        console.log(
          `[${moment().format("YYYY.MM.DD h:mm:ss")}]` +
            `[DEV][LOG][axiosApi][respond]`,
          `[${new Date().getTime() - _startTime}]`,
          _method,
          url,
          data,
          res,
        );
        return res;
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        console.log(
          `[${moment().format("YYYY.MM.DD h:mm:ss")}]` +
            `[ERROR][axiosApi][respond]`,
          `[${new Date().getTime() - _startTime}]`,
          _method,
          url,
          data,
          axiosError?.response,
          error,
        );
        throw error;
      }
    } else {
      const res = await apiHandler.request(requestConfig);
      return res;
    }
  } catch (error) {
    console.log("axiosApi error", error);
    throw error;
  }
}
