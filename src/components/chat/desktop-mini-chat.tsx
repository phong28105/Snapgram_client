"use client"

import React, { useEffect, useRef, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { chatService } from "@/services/chat.service"
import { userService } from "@/services/user.service"
import {
  MessageCircle,
  X,
  Minus,
  Send,
  UserPlus,
  ArrowLeft,
  Search,
  Loader2,
} from "lucide-react"
import { TimeAgo } from "@/components/ui/time-ago"
import type { ChatConversation, ChatMessage } from "@/types/chat.type"
import type { UserProfileResponse } from "@/types/user.type"

export function DesktopMiniChat() {
  const { user, isAuthenticated } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeConv, setActiveConv] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserProfileResponse[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activePartner, setActivePartner] = useState<{
    id: string
    username: string
    avatarUrl?: string
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Load conversations when opened or authenticated
  const loadConversations = async () => {
    if (!isAuthenticated) return
    try {
      const list = await chatService.getMyConversations()
      setConversations(list || [])
    } catch {
      // Ignored
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations()
    }
  }, [isAuthenticated])

  // Load messages when an active conversation is selected
  useEffect(() => {
    if (!activeConv) {
      setMessages([])
      return
    }

    let active = true
    chatService
      .getMessages(activeConv.id, 0, 50)
      .then((res) => {
        if (!active) return
        // Server returns newest first, reverse for chronological top-to-bottom chat
        const list = (res.content || []).slice().reverse()
        setMessages(list)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [activeConv])

  // Auto scroll to bottom
  useEffect(() => {
    if (activeConv) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, activeConv])

  // Resolve chat partner username & avatar for direct conversation
  useEffect(() => {
    if (!activeConv || !user) {
      setActivePartner(null)
      return
    }

    const partnerId = activeConv.memberIds.find((id) => id !== user.id)
    if (!partnerId) {
      setActivePartner({
        id: "me",
        username: user.username,
        avatarUrl: user.avatarUrl,
      })
      return
    }

    // Fallback if not found: resolve from partnerId
    setActivePartner({
      id: partnerId,
      username: `user_${partnerId.slice(0, 6)}`,
      avatarUrl: "/profile.jpg",
    })
  }, [activeConv, user])

  // Search users for new chat
  useEffect(() => {
    if (!isNewChatOpen || !searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await userService.searchUsers(searchQuery.trim(), 0, 8)
        const filtered = (res.content || []).filter((u) => u.id !== user?.id)
        setSearchResults(filtered)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [isNewChatOpen, searchQuery, user?.id])

  const handleStartChatWithUser = async (targetUser: UserProfileResponse) => {
    try {
      const conv = await chatService.getOrCreateDirectConversation({
        targetUserId: targetUser.id,
      })
      setIsNewChatOpen(false)
      setSearchQuery("")
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id)
        return exists ? prev : [conv, ...prev]
      })
      setActiveConv(conv)
      setActivePartner({
        id: targetUser.id,
        username: targetUser.username,
        avatarUrl: targetUser.avatarUrl,
      })
    } catch {
      // Ignored
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeConv || !inputMessage.trim() || isSending) return

    const textToSend = inputMessage.trim()
    setInputMessage("")
    setIsSending(true)

    try {
      const sent = await chatService.sendMessage(activeConv.id, {
        content: textToSend,
        type: "TEXT",
      })
      setMessages((prev) => [...prev, sent])
      loadConversations()
    } catch {
      setInputMessage(textToSend)
    } finally {
      setIsSending(false)
    }
  }

  // Only render on desktop and when authenticated
  if (!isAuthenticated) return null

  return (
    <div className="hidden md:block fixed bottom-4 right-6 z-40">
      {!isOpen ? (
        /* Collapsed Floating Pill Launcher */
        <button
          type="button"
          onClick={() => {
            setIsOpen(true)
            loadConversations()
          }}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-card hover:bg-accent border border-border shadow-xl hover:shadow-2xl transition duration-200 group text-foreground font-medium text-xs select-none"
        >
          <div className="relative">
            <MessageCircle className="w-4 h-4 text-primary group-hover:scale-110 transition" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
          </div>
          <span>Tin nhắn</span>
        </button>
      ) : (
        /* Expanded Floating Mini Chat Window */
        <div className="w-[330px] h-[460px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between shrink-0 select-none">
            {activeConv ? (
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveConv(null)}
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={activePartner?.avatarUrl || "/profile.jpg"}
                    alt={activePartner?.username || "partner"}
                    className="w-6 h-6 rounded-full object-cover border border-border shrink-0"
                  />
                  <span className="text-xs font-semibold truncate">
                    {activePartner?.username || "Trò chuyện"}
                  </span>
                </div>
              </div>
            ) : isNewChatOpen ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(false)}
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold">Tin nhắn mới</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold">Tin nhắn</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              {!activeConv && !isNewChatOpen && (
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(true)}
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
                  title="Soạn tin nhắn mới"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
                title="Thu nhỏ"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setActiveConv(null)
                  setIsNewChatOpen(false)
                }}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
                title="Đóng"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          {activeConv ? (
            /* Active Conversation View */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4">
                    <p className="text-[11px] text-muted-foreground">
                      Hãy gửi lời chào đến {activePartner?.username || "bạn bè"}! 👋
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[78%] px-3 py-1.5 rounded-2xl text-xs break-words ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-xs"
                              : "bg-muted text-foreground rounded-bl-xs"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-muted-foreground px-1 mt-0.5">
                          <TimeAgo date={msg.createdAt} />
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer */}
              <form
                onSubmit={handleSendMessage}
                className="p-2 border-t border-border bg-card/50 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  placeholder="Nhắn tin..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 bg-muted/60 text-foreground px-3 py-1.5 rounded-full text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/40 transition"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="p-1.5 rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : isNewChatOpen ? (
            /* New Chat User Search View */
            <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm tài khoản để nhắn tin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/60 pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/40"
                  autoFocus
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {isSearching ? (
                  <div className="py-6 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleStartChatWithUser(u)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-accent cursor-pointer transition select-none"
                    >
                      <img
                        src={u.avatarUrl || "/profile.jpg"}
                        alt={u.username}
                        className="w-8 h-8 rounded-full object-cover border border-border"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{u.username}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {u.displayName || "Người dùng Snapgram"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : searchQuery.trim() ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Không tìm thấy người dùng
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Nhập tên người dùng để bắt đầu trò chuyện
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Conversations List View */
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-xs font-medium">Chưa có cuộc trò chuyện nào</p>
                  <p className="text-[10px] text-muted-foreground">
                    Bấm vào biểu tượng người dùng ở trên để gửi tin nhắn mới!
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-accent cursor-pointer transition select-none group"
                  >
                    <div className="relative">
                      <img
                        src={conv.avatarUrl || "/profile.jpg"}
                        alt={conv.name || "conversation"}
                        className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold truncate">
                          {conv.name || `Hội thoại #${conv.id.slice(0, 4)}`}
                        </p>
                        {conv.updatedAt && (
                          <span className="text-[9px] text-muted-foreground shrink-0">
                            <TimeAgo date={conv.updatedAt} />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {conv.lastMessage?.content || "Bắt đầu cuộc trò chuyện..."}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
