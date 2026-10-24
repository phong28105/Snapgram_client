import { apiClient } from "@/lib/api"
import type {
  ActivityStatusRequest,
  ChangeEmailRequest,
  ChangePasswordRequest,
  NoteRequest,
  NoteResponse,
  PageBlockedUserResponse,
  PageUserProfileResponse,
  PrivacySettingRequest,
  TwoFaDisableRequest,
  TwoFaEnableRequest,
  TwoFaEnableResponse,
  TwoFaSetupResponse,
  UpdateProfileRequest,
  UserProfileResponse,
} from "@/types/user.type"

export const userService = {
  /** GET /api/users/me — Lấy hồ sơ cá nhân đầy đủ của tôi */
  async getMyProfile(): Promise<UserProfileResponse> {
    const res = await apiClient.get<UserProfileResponse>("/api/users/me")
    return res.data
  },

  /** PATCH /api/users/me — Cập nhật thông tin hồ sơ cá nhân */
  async updateProfile(payload: UpdateProfileRequest): Promise<UserProfileResponse> {
    const res = await apiClient.patch<UserProfileResponse>("/api/users/me", payload)
    return res.data
  },

  /** GET /api/users/{username} — Xem hồ sơ công khai theo username */
  async getPublicProfile(username: string): Promise<UserProfileResponse> {
    const res = await apiClient.get<UserProfileResponse>(
      `/api/users/${encodeURIComponent(username)}`
    )
    return res.data
  },

  /** GET /api/users/search — Tìm kiếm người dùng */
  async searchUsers(q: string, page = 0, size = 20): Promise<PageUserProfileResponse> {
    const res = await apiClient.get<PageUserProfileResponse>("/api/users/search", {
      params: { q, page, size },
    })
    return res.data
  },

  /** POST /api/users/batch — Lấy thông tin tóm tắt hàng loạt người dùng theo danh sách ID */
  async getUsersBatch(userIds: string[]): Promise<UserProfileResponse[]> {
    if (!userIds || userIds.length === 0) return []
    const res = await apiClient.post<UserProfileResponse[]>("/api/users/batch", {
      userIds,
    })
    return res.data
  },

  /** POST /api/users/me/heartbeat — Cập nhật trạng thái đang hoạt động */
  async heartbeat(): Promise<void> {
    await apiClient.post("/api/users/me/heartbeat")
  },

  /** POST /api/users/me/note — Tạo hoặc cập nhật ghi chú 24h (tối đa 60 ký tự) */
  async upsertNote(payload: NoteRequest): Promise<NoteResponse> {
    const res = await apiClient.post<NoteResponse>("/api/users/me/note", payload)
    return res.data
  },

  /** DELETE /api/users/me/note — Xóa ghi chú hiện tại của tôi */
  async deleteNote(): Promise<void> {
    await apiClient.delete("/api/users/me/note")
  },

  /** GET /api/users/{userId}/note — Lấy ghi chú hiện tại của 1 user */
  async getNote(userId: string): Promise<NoteResponse | null> {
    const res = await apiClient.get<NoteResponse | null>(`/api/users/${userId}/note`)
    return res.data
  },

  /** PUT /api/users/me/privacy — Bật/tắt tài khoản riêng tư */
  async updatePrivacy(payload: PrivacySettingRequest): Promise<UserProfileResponse> {
    const res = await apiClient.put<UserProfileResponse>("/api/users/me/privacy", payload)
    return res.data
  },

  /** PUT /api/users/me/activity-status — Bật/tắt hiển thị trạng thái hoạt động */
  async updateActivityStatus(payload: ActivityStatusRequest): Promise<UserProfileResponse> {
    const res = await apiClient.put<UserProfileResponse>(
      "/api/users/me/activity-status",
      payload
    )
    return res.data
  },

  /** PUT /api/users/me/password — Đổi mật khẩu */
  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await apiClient.put("/api/users/me/password", payload)
  },

  /** POST /api/users/me/email — Yêu cầu đổi địa chỉ email */
  async requestEmailChange(payload: ChangeEmailRequest): Promise<void> {
    await apiClient.post("/api/users/me/email", payload)
  },

  /** POST /api/users/me/send-verification-email — Gửi lại email xác thực */
  async sendVerificationEmail(): Promise<void> {
    await apiClient.post("/api/users/me/send-verification-email")
  },

  /** POST /api/users/me/2fa/setup — Khởi tạo 2FA (trả về secret + QR code) */
  async setup2Fa(): Promise<TwoFaSetupResponse> {
    const res = await apiClient.post<TwoFaSetupResponse>("/api/users/me/2fa/setup")
    return res.data
  },

  /** POST /api/users/me/2fa/enable — Xác nhận mã TOTP để bật 2FA */
  async enable2Fa(payload: TwoFaEnableRequest): Promise<TwoFaEnableResponse> {
    const res = await apiClient.post<TwoFaEnableResponse>("/api/users/me/2fa/enable", payload)
    return res.data
  },

  /** DELETE /api/users/me/2fa/disable — Tắt 2FA bằng TOTP hoặc Backup Code */
  async disable2Fa(payload: TwoFaDisableRequest): Promise<void> {
    await apiClient.delete("/api/users/me/2fa/disable", {
      data: payload,
    })
  },

  /** GET /api/users/me/blocks — Danh sách người dùng đã chặn */
  async getBlockedUsers(page = 0, size = 20): Promise<PageBlockedUserResponse> {
    const res = await apiClient.get<PageBlockedUserResponse>("/api/users/me/blocks", {
      params: { page, size },
    })
    return res.data
  },

  /** POST /api/users/{targetId}/block — Chặn người dùng */
  async blockUser(targetId: string): Promise<void> {
    await apiClient.post(`/api/users/${targetId}/block`)
  },

  /** DELETE /api/users/{targetId}/block — Bỏ chặn người dùng */
  async unblockUser(targetId: string): Promise<void> {
    await apiClient.delete(`/api/users/${targetId}/block`)
  },
}
