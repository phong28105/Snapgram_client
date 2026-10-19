import { apiClient } from "@/lib/api"
import type {
  ChatConversation,
  ChatMessage,
  SendMessagePayload,
  CreateDirectConversationPayload,
} from "@/types/chat.type"

export interface PageChatMessage {
  content?: ChatMessage[]
  totalElements?: number
  totalPages?: number
  number?: number
  size?: number
}

export const chatService = {
  /**
   * Lấy danh sách cuộc hội thoại của tôi
   * GET /api/conv
   */
  async getMyConversations(): Promise<ChatConversation[]> {
    const response = await apiClient.get<ChatConversation[]>("/api/conv")
    return response.data
  },

  /**
   * Tạo hoặc lấy cuộc hội thoại 1-1 với một người dùng
   * POST /api/conv
   */
  async getOrCreateDirectConversation(
    data: CreateDirectConversationPayload
  ): Promise<ChatConversation> {
    const response = await apiClient.post<ChatConversation>("/api/conv", data)
    return response.data
  },

  /**
   * Lấy tin nhắn trong cuộc hội thoại
   * GET /api/conv/{id}/messages
   */
  async getMessages(
    conversationId: string,
    page = 0,
    size = 30
  ): Promise<PageChatMessage> {
    const response = await apiClient.get<PageChatMessage>(
      `/api/conv/${conversationId}/messages`,
      {
        params: { page, size },
      }
    )
    return response.data
  },

  /**
   * Gửi tin nhắn mới
   * POST /api/conv/{id}/messages
   */
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
}
