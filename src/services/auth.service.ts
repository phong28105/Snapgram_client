import { apiClient } from "@/lib/api"
import type {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
  TwoFaPayload,
  UserDto,
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

  async getUserInfo(): Promise<UserDto> {
    const res = await apiClient.get<UserDto>("/api/auth/user")
    return res.data
  },

  async verifyToken(): Promise<boolean> {
    const res = await apiClient.post<boolean>("/api/auth/verify")
    return res.data
  },

  async refreshToken(): Promise<void> {
    await apiClient.post("/api/auth/refresh", {})
  },

  async forgotPassword(params: ForgotPasswordPayload): Promise<void> {
    await apiClient.post("/api/auth/forgot-password", params)
  },

  async resetPassword(params: ResetPasswordPayload): Promise<void> {
    await apiClient.post("/api/auth/reset-password", params)
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.get("/api/auth/verify-email", {
      params: { token },
    })
  },

  async sendVerificationEmail(): Promise<void> {
    await apiClient.post("/api/users/me/send-verification-email")
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout", {})
    } finally {
      window.location.href = "/login"
    }
  },
}