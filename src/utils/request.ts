import axios, { CanceledError } from 'axios';
import { isString } from 'lodash-es';
import qs from 'qs';
import { message as $message, Modal } from 'ant-design-vue';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ResultEnum } from '@/enums/httpEnum';
import { useLocaleStore } from '@/store/modules/locale';
import { USER_PERSIST_KEY, useUserStore } from '@/store/modules/user';
import { useSSEStore } from '@/store/modules/sse';

export interface RequestOptions extends AxiosRequestConfig {
  /** 是否直接将数据从响应中提取出，例如直接返回 res.data，而忽略 res.code 等信息 */
  isReturnResult?: boolean;
  /** 请求成功是提示信息 */
  successMsg?: string;
  /** 请求失败是提示信息 */
  errorMsg?: string;
  /** 成功时，是否显示后端返回的成功信息 */
  showSuccessMsg?: boolean;
  /** 失败时，是否显示后端返回的失败信息 */
  showErrorMsg?: boolean;
  requestType?: 'json' | 'form';
}

const UNKNOWN_ERROR = '未知错误，请重试';

function stringifyMessage(input: unknown): string {
  if (typeof input === 'string' && input.trim()) return input;
  if (Array.isArray(input)) {
    return input.map(item => stringifyMessage(item)).filter(Boolean).join('; ');
  }
  if (input && typeof input === 'object') {
    const candidate = (input as any).message ?? (input as any).msg ?? (input as any).error;
    if (candidate !== undefined) {
      return stringifyMessage(candidate);
    }
    try {
      return JSON.stringify(input);
    } catch {
      return UNKNOWN_ERROR;
    }
  }
  if (input === undefined || input === null || input === '') return UNKNOWN_ERROR;
  return String(input);
}

function buildErrorContext(error: any) {
  const responseData = error?.response?.data;
  const config = error?.config || {};
  return {
    code: responseData?.code ?? error?.code ?? '',
    status: error?.response?.status ?? '',
    method: String(config.method || 'GET').toUpperCase(),
    url: config.url || '',
  };
}

function logRequestError(error: any, messageText: string) {
  const context = buildErrorContext(error);
  const routeText = [context.method, context.url].filter(Boolean).join(' ');
  const statusText = context.status || context.code || 'ERR';
  console.error(`[request error] ${routeText} [${statusText}] ${messageText}`, context);
}

/** 真实请求的路径前缀 */
export const baseApiUrl = import.meta.env.VITE_BASE_API_URL;
/** mock请求路径前缀 */
// const baseMockUrl = import.meta.env.VITE_MOCK_API;

const controller = new AbortController();
const service = axios.create({
  baseURL: baseApiUrl,
  // adapter: 'fetch',
  timeout: 10000,
  signal: controller.signal,
  paramsSerializer(params) {
    return qs.stringify(params, { arrayFormat: 'brackets' });
  },
});

service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    const localeStore = useLocaleStore();
    const token = userStore.token;
    const headers = (config.headers || {}) as Record<string, any>;
    headers['Accept-Language'] = localeStore.getLocale;
    if (token) {
      // 请求头token信息，请根据实际情况进行修改
      headers.Authorization = `Bearer ${token}`;
    }
    if (userStore.areaId) {
      headers['X-Area-Id'] = String(userStore.areaId);
    }
    config.headers = headers as any;
    return config;
  },
  (error) => {
    Promise.reject(error);
  },
);

service.interceptors.response.use(
  (response: AxiosResponse<BaseResponse>) => {
    const res = response.data;
    const responseMessage = stringifyMessage(res.message);

    // if the custom code is not 200, it is judged as an error.
    if (res.code !== ResultEnum.SUCCESS) {
      $message.error(responseMessage);
      logRequestError({ response, config: response.config, code: res.code }, responseMessage);
      // Illegal token
      if ([1101, 1105].includes(res.code)) {
        // to re-login
        Modal.confirm({
          title: '警告',
          content: responseMessage || '账号异常，您可以取消停留在该页上，或重新登录',
          okText: '重新登录',
          cancelText: '取消',
          onOk: () => {
            sessionStorage.removeItem(USER_PERSIST_KEY);
            window.location.reload();
          },
        });
      }

      // throw other
      const error = new Error(responseMessage || UNKNOWN_ERROR) as Error & { code: any };
      error.code = res.code;
      return Promise.reject(error);
    } else {
      const sseStore = useSSEStore();
      sseStore.setServerConnectStatus(true);
      return response;
    }
  },
  (error) => {
    if (!(error instanceof CanceledError)) {
      // 处理 422 或者 500 的错误异常提示
      const errMsg = error?.response?.data?.message ?? UNKNOWN_ERROR;
      const normalizedMessage = stringifyMessage(errMsg);
      $message.error({ content: normalizedMessage, key: normalizedMessage });
      logRequestError(error, normalizedMessage);
      error.message = normalizedMessage;
    }
    return Promise.reject(error);
  },
);

type BaseResponse<T = any> = Omit<API.ResOp, 'data'> & {
  data: T;
};

export function request<T = any>(
  url: string,
  config: { isReturnResult: false } & RequestOptions,
): Promise<BaseResponse<T>>;
export function request<T = any>(
  url: string,
  config: RequestOptions,
): Promise<BaseResponse<T>['data']>;
export function request<T = any>(
  config: { isReturnResult: false } & RequestOptions,
): Promise<BaseResponse<T>>;
export function request<T = any>(config: RequestOptions): Promise<BaseResponse<T>['data']>;
/**
 *
 * @param url - request url
 * @param config - AxiosRequestConfig
 */
export async function request(_url: string | RequestOptions, _config: RequestOptions = {}) {
  const url = isString(_url) ? _url : _url.url;
  const config = isString(_url) ? _config : _url;
  try {
    // 兼容 from data 文件上传的情况
    const { requestType, isReturnResult = true, ...rest } = config;

    const response = (await service.request({
      url,
      ...rest,
      headers: {
        ...rest.headers,
        ...(requestType === 'form' ? { 'Content-Type': 'multipart/form-data' } : {}),
      },
    })) as AxiosResponse<BaseResponse>;
    const { data } = response;
    const { code, message } = data || {};

    const hasSuccess = data && Reflect.has(data, 'code') && code === ResultEnum.SUCCESS;

    if (hasSuccess) {
      const { successMsg, showSuccessMsg } = config;
      if (successMsg) {
        $message.success(successMsg);
      } else if (showSuccessMsg && message) {
        $message.success(message);
      }
    }

    // 页面代码需要获取 code，data，message 等信息时，需要将 isReturnResult 设置为 false
    if (!isReturnResult) {
      return data;
    } else {
      return data.data;
    }
  } catch (error: any) {
    return Promise.reject(error);
  }
}
