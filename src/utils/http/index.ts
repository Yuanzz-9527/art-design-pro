import axios, { InternalAxiosRequestConfig, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useUserStore } from '@/store/modules/user'
import { ApiStatus } from './status'
import { HttpError, handleError, showError } from './error'
import { $t } from '@/locales'
import { tansParams } from '@/utils/dataprocess'
import FileSaver from 'file-saver'

// 常量定义
const REQUEST_TIMEOUT = 15000 // 请求超时时间(毫秒)
const LOGOUT_DELAY = 1000 // 退出登录延迟时间(毫秒)
const MAX_RETRIES = 0 // 最大重试次数
const RETRY_DELAY = 1000 // 重试延迟时间(毫秒)

// 扩展 AxiosRequestConfig 类型
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
}

const { VITE_API_URL, VITE_WITH_CREDENTIALS } = import.meta.env

const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT, // 请求超时时间(毫秒)
  baseURL: VITE_API_URL, // API地址
  withCredentials: VITE_WITH_CREDENTIALS === 'true', // 是否携带cookie，默认关闭
  validateStatus: (status) => status >= 200 && status < 300, // 只接受 2xx 的状态码
  transformResponse: [
    (data, headers) => {
      const contentType = headers['content-type']
      if (contentType && contentType.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      return data
    }
  ],
  // ⭐ GET 请求参数序列化
  paramsSerializer: (params) => {
    const buildQuery = (obj: Record<string, any>, prefix = ''): string[] => {
      const pairs: string[] = []
      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue
        const value = obj[key]
        const k = prefix ? `${prefix}[${key}]` : key
        if (value !== null && typeof value === 'object') {
          pairs.push(...buildQuery(value, k))
        } else if (value !== undefined) {
          pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(value)}`)
        }
      }
      return pairs
    }
    return buildQuery(params).join('&')
  }
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    const { accessToken } = useUserStore()
    const isToken = (request.headers || {}).isToken === false
    // 设置 token
    if (accessToken && !isToken) {
      request.headers.set('Authorization', accessToken)
    }
    // 根据请求数据类型设置 Content-Type
    if (request.data && !(request.data instanceof FormData) && !request.headers['Content-Type']) {
      request.headers.set('Content-Type', 'application/json')
      request.data = JSON.stringify(request.data)
    }
    return request
  },
  (error) => {
    showError(new HttpError($t('httpMsg.requestConfigError'), ApiStatus.error))
    return Promise.reject(error)
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<Api.Http.BaseResponse>) => {
    const { code, msg } = response.data
    // 二进制数据则直接返回
    if (
      response.request.responseType === 'blob' ||
      response.request.responseType === 'arraybuffer'
    ) {
      return response
    }
    switch (code) {
      case ApiStatus.success:
        return response
      case ApiStatus.unauthorized:
        logOut()
        throw new HttpError(msg || $t('httpMsg.unauthorized'), ApiStatus.unauthorized)
      default:
        throw new HttpError(msg || $t('httpMsg.requestFailed'), code)
    }
  },
  (error) => {
    return Promise.reject(handleError(error))
  }
)

// 请求重试函数
async function retryRequest<T>(
  config: ExtendedAxiosRequestConfig,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await request<T>(config)
  } catch (error) {
    if (retries > 0 && error instanceof HttpError && shouldRetry(error.code)) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
      return retryRequest<T>(config, retries - 1)
    }
    throw error
  }
}

// 判断是否需要重试
function shouldRetry(statusCode: number): boolean {
  return [
    ApiStatus.requestTimeout,
    ApiStatus.internalServerError,
    ApiStatus.badGateway,
    ApiStatus.serviceUnavailable,
    ApiStatus.gatewayTimeout
  ].includes(statusCode)
}

// 请求函数
async function request<T = any>(config: ExtendedAxiosRequestConfig): Promise<T> {
  // 对 POST | PUT 请求特殊处理
  if (config.method?.toUpperCase() === 'POST' || config.method?.toUpperCase() === 'PUT') {
    if (config.params && !config.data) {
      config.data = config.params
      config.params = undefined
    }
  }

  try {
    const res = await axiosInstance.request<Api.Http.BaseResponse<T>>(config)
    return res.data as T
  } catch (error) {
    if (error instanceof HttpError) {
      // 根据配置决定是否显示错误消息
      const showErrorMessage = config.showErrorMessage !== false
      showError(error, showErrorMessage)
    }
    return Promise.reject(error)
  }
}

// API 方法集合
const api = {
  get<T>(config: ExtendedAxiosRequestConfig): Promise<T> {
    return retryRequest<T>({ ...config, method: 'GET' })
  },
  post<T>(config: ExtendedAxiosRequestConfig): Promise<T> {
    return retryRequest<T>({ ...config, method: 'POST' })
  },
  put<T>(config: ExtendedAxiosRequestConfig): Promise<T> {
    return retryRequest<T>({ ...config, method: 'PUT' })
  },
  del<T>(config: ExtendedAxiosRequestConfig): Promise<T> {
    return retryRequest<T>({ ...config, method: 'DELETE' })
  },
  request<T>(config: ExtendedAxiosRequestConfig): Promise<T> {
    return retryRequest<T>({ ...config })
  }
}

// 退出登录函数
const logOut = (): void => {
  setTimeout(() => {
    useUserStore().logOut()
  }, LOGOUT_DELAY)
}

/**
 * 下载文件
 * @param url 下载地址
 * @param params 请求参数
 * @param fileName 文件名
 * @param config 自定义请求配置
 */
export const downloadFile = async (
  url: string,
  params: Record<string, any>,
  fileName: string,
  config?: ExtendedAxiosRequestConfig
) => {
  const loading = ElLoading.service({
    text: '正在下载数据，请稍候',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    const response = await axiosInstance.post(url, params, {
      transformRequest: [(params) => tansParams(params)],
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      responseType: 'blob',
      ...config
    })
    const data = response.data as unknown as Blob
    const isBlob = data.type !== 'application/json'

    if (isBlob) {
      const blob = new Blob([data])
      FileSaver.saveAs(blob, fileName)
    } else {
      const resText = await (data as any).text()
      const rspObj = JSON.parse(resText)
      ElMessage.error(rspObj.msg)
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('下载文件出现错误，请联系管理员！')
  } finally {
    loading.close()
  }
}

export default api
