export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  type: string
  content: string
  mediaUrl?: string
  createdAt: string
}

export interface ChatConversation {
  id: string
  type: string
  name?: string
  avatarUrl?: string
  memberIds: string[]
  lastMessage?: ChatMessage
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
