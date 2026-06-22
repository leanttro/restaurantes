import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { storage } from '@/utils/storage'
import { ApiError, ApiErrorBody } from '@/types/api'
import { AuthTokens } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = storage.getRefreshToken()
      if (!refreshToken) {
        storage.clearAll()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(normalizeError(error))
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((newToken: string) => {
            originalRequest.headers = originalRequest.headers ?? {}
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(api(originalRequest))
          })
          setTimeout(() => reject(normalizeError(error)), 10000)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post<AuthTokens>(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
        storage.setTokens(data.access_token, data.refresh_token)
        onRefreshed(data.access_token)
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch {
        storage.clearAll()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(normalizeError(error))
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(normalizeError(error))
  }
)

function normalizeError(error: AxiosError<ApiErrorBody>): ApiError {
  const status = error.response?.status ?? 0
  const body = error.response?.data
  let message = 'Não foi possível completar a operação. Tente novamente.'
  if (body?.detail) {
    message = Array.isArray(body.detail) ? body.detail.map((d) => d.msg).join(' ') : body.detail
  } else if (body?.message) {
    message = body.message
  } else if (error.message === 'Network Error') {
    message = 'Não foi possível conectar ao servidor.'
  }
  return new ApiError(message, status, body)
}
