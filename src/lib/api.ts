import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios"
import { toast } from "sonner"

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Token nằm trong cookie HttpOnly do backend set, JS không đọc/ghi được.
// withCredentials: true để trình duyệt tự gửi và nhận cookie.
export const apiClient = axios.create({
  baseURL: GATEWAY_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// ─── Custom Error class ────────────────────────────────────────────────────────
export class HttpError extends Error {
  status: number
  constructor({ status, message }: { status: number; message: string }) {
    super(message)
    this.status = status
    this.name = "HttpError"
  }
}

export function getErrorMessage(
  error: unknown,
  fallback = "Email hoặc mật khẩu không chính xác. Vui lòng thử lại."
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined
    return data?.message || data?.error || fallback
  }
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

// Các endpoint này 401 là lỗi thật, không refresh
const NO_REFRESH_PATHS = [
  "/api/auth/login",
  "/api/auth/login/2fa",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
]

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]

// Nhiều request 401 cùng lúc thì chỉ refresh 1 lần, các request còn lại chờ chung kết quả
let refreshPromise: Promise<unknown> | null = null
let lastRateLimitToastTime = 0

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined
    const url = original?.url ?? ""

    // Xử lý 429 Too Many Requests (Rate Limit Exceeded)
    if (error.response?.status === 429) {
      const now = Date.now()
      // Throttle toast cảnh báo mỗi 5 giây để tránh spam
      if (now - lastRateLimitToastTime > 5000) {
        lastRateLimitToastTime = now
        if (typeof window !== "undefined") {
          toast.warning("Hệ thống nhận quá nhiều yêu cầu trong thời gian ngắn", {
            description: "Vui lòng đợi vài giây rồi thử lại để tránh bị giới hạn tốc độ (Rate Limit).",
          })
        }
      }
      return Promise.reject(error)
    }

    if (
      !original ||
      error.response?.status !== 401 ||
      original._retry ||
      NO_REFRESH_PATHS.some((p) => url.includes(p))
    ) {
      return Promise.reject(error)
    }

    original._retry = true

    try {
      refreshPromise ??= apiClient
        .post("/api/auth/refresh", {})
        .finally(() => {
          refreshPromise = null
        })
      await refreshPromise
      return apiClient(original)
    } catch (refreshError) {
      // Refresh thất bại: phiên đã hết, đưa về trang login
      if (typeof window !== "undefined" && !AUTH_PAGES.includes(window.location.pathname)) {
        const redirectTo = `${window.location.pathname}${window.location.search}`
        window.location.href = `/login?redirect=${encodeURIComponent(redirectTo)}`
      }
      return Promise.reject(refreshError)
    }
  }
)

export const api = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.get<T>(url, config)
    return res.data
  },

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.post<T>(url, data, config)
    return res.data
  },

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.put<T>(url, data, config)
    return res.data
  },

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.patch<T>(url, data, config)
    return res.data
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.delete<T>(url, config)
    return res.data
  },
}