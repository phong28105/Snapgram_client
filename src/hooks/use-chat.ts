"use client"

import { useChatContext } from "@/components/providers/chat-provider"

/** Hook truy cập realtime chat (socket, unread, typing). */
export function useChat() {
  return useChatContext()
}

export default useChat
