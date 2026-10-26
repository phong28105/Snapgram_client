import { apiClient } from "@/lib/api"
import type {
  PageNotificationResponse,
} from "@/types/notification.type"

export const notificationService = {
  /**
   * GET /api/notifications — Lấy danh sách thông báo
   */
  async getNotifications(
    unreadOnly = false,
    page = 0,
    size = 20
  ): Promise<PageNotificationResponse> {
    const res = await apiClient.get<PageNotificationResponse>("/api/notifications", {
      params: { unreadOnly, page, size },
    })
    return res.data
  },

  /**
   * GET /api/notifications/unread-count — Đếm số thông báo chưa đọc
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<{ unreadCount: number }>(
        "/api/notifications/unread-count"
      )
      return res.data.unreadCount ?? 0
    } catch {
      return 0
    }
  },

  /**
   * POST /api/notifications/{id}/read — Đánh dấu 1 thông báo là đã đọc
   */
  async markAsRead(id: string): Promise<void> {
    await apiClient.post(`/api/notifications/${id}/read`)
  },

  /**
   * POST /api/notifications/read-all — Đánh dấu tất cả thông báo là đã đọc
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.post("/api/notifications/read-all")
  },
}
