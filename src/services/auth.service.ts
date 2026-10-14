import { apiClient } from "@/lib/api"
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  TwoFaPayload,
  UserMe,
} from "@/types/auth.type"

export const authService = {
  async register(params: RegisterPayload): Promise<RegisterResponse> {
    const res = await apiClient.post<RegisterResponse>("/api/auth/register", params)
    return res.data
  },

  async login(params: LoginPayload): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>("/api/auth/login", params)
    return res.data
  },

  async login2Fa(params: TwoFaPayload): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>("/api/auth/login/2fa", params)
    return res.data
  },

  async getMe(): Promise<UserMe> {
    const res = await apiClient.get<UserMe>("/api/auth/me")
    return res.data
  },

  async refreshToken(): Promise<void> {
    await apiClient.post("/api/auth/refresh", {})
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout", {})
    } finally {
      window.location.href = "/login"
    }
  }
}