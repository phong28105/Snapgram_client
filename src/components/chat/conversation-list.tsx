"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, MessageCircle, Search, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
import { chatService } from "@/services/chat.service"
import { userService } from "@/services/user.service"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { formatRelativeTime } from "@/lib/time"
import type { ChatConversation } from "@/types/chat.type"
import type { UserProfileResponse } from "@/types/user.type"

interface ConversationListProps {
  activeId?: string
  onSelect: (conversationId: string) => void
}

export function ConversationList({ activeId, onSelect }: ConversationListProps) {
  const { user } = useAuth()
  const { lastEvent, refreshUnread } = useChat()

  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserProfileResponse[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await chatService.getMyConversations()
      // Lưới an toàn: nếu backend lỡ tạo trùng hội thoại DIRECT với cùng partner thì gộp lại
      const seen = new Set<string>()
      const deduped: ChatConversation[] = []
      for (const conversation of list || []) {
        const key =
          conversation.type === "DIRECT" && conversation.partner?.id
            ? `direct:${conversation.partner.id}`
            : `id:${conversation.id}`
        if (seen.has(key)) continue
        seen.add(key)
        deduped.push(conversation)
      }
      setConversations(deduped)
    } catch {
      setConversations([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  // Tin mới → cập nhật preview + đưa hội thoại lên đầu
  useEffect(() => {
    if (!lastEvent) return
    const { envelope } = lastEvent
    const data = envelope.data
    if (envelope.type !== "MESSAGE_CREATED" || !data?.message || !data.conversationId) return

    const incoming = data.message
    const conversationId = data.conversationId

    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === conversationId)
      if (index < 0) {
        // Hội thoại mới chưa có trong danh sách → tải lại để lấy đủ thông tin partner
        void loadConversations()
        return prev
      }
      const updated: ChatConversation = {
        ...prev[index],
        lastMessage: incoming,
        updatedAt: incoming.createdAt,
        unreadCount:
          conversationId === activeId || incoming.senderId === user?.id
            ? prev[index].unreadCount
            : prev[index].unreadCount + 1,
      }
      const rest = prev.filter((c) => c.id !== conversationId)
      return [updated, ...rest]
    })
  }, [lastEvent, activeId, user?.id, loadConversations])

  // Reset unread khi mở hội thoại
  useEffect(() => {
    if (!activeId) return
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
    )
  }, [activeId])

  useEffect(() => {
    if (!isNewChatOpen || !searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await userService.searchUsers(searchQuery.trim(), 0, 10)
        setSearchResults((res.content || []).filter((u) => u.id !== user?.id))
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [isNewChatOpen, searchQuery, user?.id])

  const handleStartChat = async (target: UserProfileResponse) => {
    try {
      const conversation = await chatService.getOrCreateDirectConversation({
        targetUserId: target.id,
      })
      setIsNewChatOpen(false)
      setSearchQuery("")
      await loadConversations()
      void refreshUnread()
      onSelect(conversation.id)
    } catch {
      toast.error("Không bắt đầu được hội thoại.")
    }
  }

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations]
  )

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border shrink-0">
        {isNewChatOpen ? (
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                setIsNewChatOpen(false)
                setSearchQuery("")
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Huỷ
            </button>
            <span className="text-sm font-semibold">Tin nhắn mới</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-semibold">{user?.username || "Tin nhắn"}</span>
            {totalUnread > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
        )}

        {!isNewChatOpen && (
          <button
            type="button"
            onClick={() => setIsNewChatOpen(true)}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
            title="Soạn tin nhắn mới"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {isNewChatOpen ? (
        <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tài khoản để nhắn tin…"
              className="w-full bg-muted/60 pl-8 pr-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/40"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {isSearching ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleStartChat(result)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-accent transition text-left"
                >
                  <img
                    src={result.avatarUrl || "/profile.jpg"}
                    alt={result.username}
                    className="w-9 h-9 rounded-full object-cover border border-border"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{result.username}</p>
                      <VerifiedBadge
                        verified={result.verified}
                        verifiedUntil={result.verifiedUntil}
                        size={12}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {result.displayName || "Người dùng Snapgram"}
                    </p>
                  </div>
                </button>
              ))
            ) : searchQuery.trim() ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Không tìm thấy người dùng
              </p>
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Nhập tên người dùng để bắt đầu trò chuyện
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          {isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-6">
              <MessageCircle className="w-9 h-9 text-muted-foreground/50" />
              <p className="text-sm font-medium">Chưa có cuộc trò chuyện nào</p>
              <p className="text-[11px] text-muted-foreground">
                Bấm biểu tượng người dùng ở trên để bắt đầu.
              </p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const name =
                conversation.partner?.username ||
                conversation.name ||
                "Hội thoại"
              const avatar = conversation.partner?.avatarUrl || conversation.avatarUrl || "/profile.jpg"
              const isActive = conversation.id === activeId
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition text-left ${
                    isActive ? "bg-accent" : "hover:bg-accent/60"
                  }`}
                >
                  <img
                    src={avatar}
                    alt={name}
                    className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate">{name}</p>
                      <VerifiedBadge
                        verified={conversation.partner?.verified}
                        verifiedUntil={conversation.partner?.verifiedUntil}
                        size={12}
                      />
                      <span className="ml-auto text-[9px] text-muted-foreground shrink-0">
                        {conversation.updatedAt ? formatRelativeTime(conversation.updatedAt) : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-[11px] truncate flex-1 ${
                          conversation.unreadCount > 0
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {conversation.lastMessage?.content || "Bắt đầu cuộc trò chuyện…"}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="shrink-0 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                          {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default ConversationList
