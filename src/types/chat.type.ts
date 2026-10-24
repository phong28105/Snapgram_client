export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  type: string
  content: string
  mediaUrl?: string
  createdAt: string
  /** Chỉ có ở phía client khi gửi optimistic. */
  status?: "sending" | "failed" | "sent"
}

export interface ChatPartner {
  id: string
  username?: string
  displayName?: string
  avatarUrl?: string
  verified?: boolean
  verifiedUntil?: string
}

export interface ChatConversation {
  id: string
  type: string
  name?: string
  avatarUrl?: string
  memberIds: string[]
  partner?: ChatPartner
  lastMessage?: ChatMessage
  unreadCount: number
  lastReadMessageId?: string
  muted: boolean
  updatedAt?: string
  createdAt: string
}

export interface SendMessagePayload {
  content: string
  type?: string
  mediaUrl?: string
}

export interface CreateDirectConversationPayload {
  targetUserId: string
}

export interface MessagePage {
  content: ChatMessage[]
  hasMore: boolean
  nextCursor?: string
  totalElements: number
}

/** Envelope WebSocket từ chat-service: { type, data }. */
export interface ChatWsEnvelope {
  type: "MESSAGE_CREATED" | "MESSAGE_DELETED" | "TYPING" | "READ_RECEIPT"
  data?: {
    message?: ChatMessage
    conversationId?: string
    messageId?: string
    userId?: string
    username?: string
    typing?: boolean
    lastReadMessageId?: string
    readAt?: string
  }
}

export interface ChatTypingState {
  userId: string
  username?: string
  updatedAt: number
}
