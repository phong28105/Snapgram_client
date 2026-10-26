"use client"

import React, { useState } from "react"
import { MessageCircle, Minus, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
import { ConversationList } from "@/components/chat/conversation-list"
import { ChatThread } from "@/components/chat/chat-thread"

/**
 * Cửa sổ chat nổi cho desktop.
 * Dùng chung ConversationList/ChatThread nên có đầy đủ realtime, typing,
 * đã đọc và badge chưa đọc — không còn state cục bộ như bản cũ.
 */
export function DesktopMiniChat() {
  const { isAuthenticated } = useAuth()
  const { unreadTotal } = useChat()

  const [isOpen, setIsOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  if (!isAuthenticated) return null

  return (
    <div className="hidden md:block fixed bottom-4 right-6 z-40">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-card hover:bg-accent border border-border shadow-xl hover:shadow-2xl transition text-foreground font-medium text-xs select-none"
        >
          <MessageCircle className="w-4 h-4 text-primary" />
          <span>Tin nhắn</span>
          {unreadTotal > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </span>
          )}
        </button>
      ) : (
        <div className="w-[360px] h-[520px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-end gap-1 px-2 py-1.5 border-b border-border shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setActiveId(null)
              }}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
              title="Thu nhỏ"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setActiveId(null)
              }}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
              title="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {activeId ? (
              <ChatThread
                conversationId={activeId}
                onBack={() => setActiveId(null)}
                backAlwaysVisible
              />
            ) : (
              <ConversationList activeId={undefined} onSelect={setActiveId} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DesktopMiniChat
