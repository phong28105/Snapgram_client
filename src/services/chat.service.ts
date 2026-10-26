import { apiClient } from "@/lib/api"
import type {
  ChatConversation,
  ChatMessage,
  CreateDirectConversationPayload,
  MessagePage,
  SendMessagePayload,
} from "@/types/chat.type"

export const chatService = {
  /** GET /api/conv — danh sách hội thoại (đã kèm partner + unreadCount) */
  async getMyConversations(): Promise<ChatConversation[]> {
    const response = await apiClient.get<ChatConversation[]>("/api/conv")
    return response.data
  },

  /** GET /api/conv/unread-count — tổng tin chưa đọc cho badge */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ total: number }>("/api/conv/unread-count")
    return response.data?.total ?? 0
  },

  /** POST /api/conv — tạo hoặc lấy hội thoại 1-1 */
  async getOrCreateDirectConversation(
    data: CreateDirectConversationPayload
  ): Promise<ChatConversation> {
    const response = await apiClient.post<ChatConversation>("/api/conv", data)
    return response.data
  },

  /** GET /api/conv/{id} */
  async getConversation(conversationId: string): Promise<ChatConversation> {
    const response = await apiClient.get<ChatConversation>(
      `/api/conv/${conversationId}`
    )
    return response.data
  },

  /**
   * GET /api/conv/{id}/messages — trả về cũ → mới
   * `before` là id tin cũ nhất đã có, dùng để tải thêm tin cũ hơn.
   */
  async getMessages(
    conversationId: string,
    options: { before?: string; page?: number; size?: number } = {}
  ): Promise<MessagePage> {
    const { before, page = 0, size = 30 } = options
    const response = await apiClient.get<MessagePage>(
      `/api/conv/${conversationId}/messages`,
      { params: { page, size, ...(before ? { before } : {}) } }
    )
    return response.data
  },

  /** POST /api/conv/{id}/messages */
  async sendMessage(
    conversationId: string,
    data: SendMessagePayload
  ): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>(
      `/api/conv/${conversationId}/messages`,
      data
    )
    return response.data
  },

  /** DELETE /api/conv/{id}/messages/{messageId} */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await apiClient.delete(
      `/api/conv/${conversationId}/messages/${messageId}`
    )
  },

  /** POST /api/conv/{id}/read */
  async markRead(
    conversationId: string,
    lastReadMessageId?: string
  ): Promise<ChatConversation> {
    const response = await apiClient.post<ChatConversation>(
      `/api/conv/${conversationId}/read`,
      lastReadMessageId ? { lastReadMessageId } : {}
    )
    return response.data
  },

  /** POST /api/conv/{id}/typing — dự phòng khi WebSocket không khả dụng */
  async typing(
    conversationId: string,
    payload: { typing?: boolean; username?: string } = {}
  ): Promise<void> {
    await apiClient.post(`/api/conv/${conversationId}/typing`, {
      typing: payload.typing ?? true,
      username: payload.username,
    })
  },
}
