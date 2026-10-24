"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
import { chatService } from "@/services/chat.service"
import { useMediaUpload } from "@/hooks/use-media-upload"
import { UploadProgressCard } from "@/components/ui/upload-progress-card"
import { MediaPicker, type PickedMedia } from "@/components/ui/media-picker"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { getErrorMessage } from "@/lib/api"
import { formatClock } from "@/lib/time"
import type { ChatConversation, ChatMessage } from "@/types/chat.type"

interface ChatThreadProps {
  conversationId: string
  onBack?: () => void
  /** Hiện nút quay lại cả trên desktop (dùng trong cửa sổ chat nổi). */
  backAlwaysVisible?: boolean
}

const NEAR_BOTTOM_PX = 140

/**
 * Thêm/cập nhật một tin nhắn mà không tạo bản trùng.
 *
 * Vì sao cần: khi mình gửi tin, tin được thêm optimistic (id tạm) rồi server trả về
 * bản thật, ĐỒNG THỜI WebSocket cũng broadcast chính tin đó cho mình. Nếu event WS
 * tới trước khi REST kịp trả, id thật chưa có trong danh sách → phải nhận ra bubble
 * đang "sending" cùng người gửi + nội dung để thay thế, tránh 2 bubble trùng id.
 */
function upsertMessage(list: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const byId = list.findIndex((m) => m.id === incoming.id)
  if (byId >= 0) {
    const next = [...list]
    next[byId] = { ...incoming, status: "sent" }
    return next
  }

  const pendingIndex = list.findIndex(
    (m) =>
      m.status === "sending" &&
      m.senderId === incoming.senderId &&
      m.content === incoming.content
  )
  if (pendingIndex >= 0) {
    const next = [...list]
    next[pendingIndex] = { ...incoming, status: "sent" }
    return next
  }

  return [...list, { ...incoming, status: "sent" }]
}

export function ChatThread({ conversationId, onBack, backAlwaysVisible = false }: ChatThreadProps) {
  const { user } = useAuth()
  const { lastEvent, typingByConversation, sendTyping, setActiveConversationId, refreshUnread } =
    useChat()

  const [conversation, setConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { uploading, upload } = useMediaUpload()
  const isUploading = Boolean(uploading)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nearBottomRef = useRef(true)

  const partner = conversation?.partner
  const partnerName = partner?.username || partner?.displayName || "Trò chuyện"
  const partnerAvatar = partner?.avatarUrl || "/profile.jpg"

  /** Đánh dấu đang mở hội thoại này để provider không tăng badge. */
  useEffect(() => {
    setActiveConversationId(conversationId)
    return () => setActiveConversationId(null)
  }, [conversationId, setActiveConversationId])

  const markRead = useCallback(
    async (lastMessageId?: string) => {
      try {
        await chatService.markRead(conversationId, lastMessageId)
        void refreshUnread()
      } catch {
        // không chặn UI nếu lỗi đánh dấu đã đọc
      }
    },
    [conversationId, refreshUnread]
  )

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [conv, page] = await Promise.all([
        chatService.getConversation(conversationId),
        chatService.getMessages(conversationId, { size: 30 }),
      ])
      setConversation(conv)
      setMessages(page.content || [])
      setHasMore(Boolean(page.hasMore))
      setNextCursor(page.nextCursor)
      void markRead()
    } catch (err) {
      toast.error(getErrorMessage(err, "Không tải được hội thoại."))
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, markRead])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  // Cuộn xuống cuối khi mở hội thoại
  useEffect(() => {
    if (!isLoading) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" })
        nearBottomRef.current = true
      })
    }
  }, [isLoading, conversationId])

  // Nhận sự kiện realtime
  useEffect(() => {
    if (!lastEvent) return
    const { envelope } = lastEvent
    const data = envelope.data
    if (!data || data.conversationId !== conversationId) return

    if (envelope.type === "MESSAGE_CREATED" && data.message) {
      const incoming = data.message
      setMessages((prev) => upsertMessage(prev, incoming))

      // Đang mở hội thoại → coi như đã đọc
      if (incoming.senderId !== user?.id) {
        void markRead(incoming.id)
      }

      if (nearBottomRef.current) {
        requestAnimationFrame(() =>
          bottomRef.current?.scrollIntoView({ behavior: "smooth" })
        )
      }
      return
    }

    if (envelope.type === "MESSAGE_DELETED" && data.messageId) {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId))
      return
    }

    if (envelope.type === "READ_RECEIPT") {
      setConversation((prev) =>
        prev ? { ...prev, lastReadMessageId: data.lastReadMessageId } : prev
      )
    }
  }, [lastEvent, conversationId, user?.id, markRead])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    nearBottomRef.current = distance < NEAR_BOTTOM_PX
  }

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return
    setIsLoadingMore(true)
    const el = scrollRef.current
    const previousHeight = el?.scrollHeight ?? 0
    try {
      const page = await chatService.getMessages(conversationId, {
        before: nextCursor,
        size: 30,
      })
      setMessages((prev) => [...(page.content || []), ...prev])
      setHasMore(Boolean(page.hasMore))
      setNextCursor(page.nextCursor)
      // Giữ nguyên vị trí đọc sau khi chèn tin cũ lên đầu
      requestAnimationFrame(() => {
        if (!el) return
        el.scrollTop = el.scrollHeight - previousHeight
      })
    } catch {
      toast.error("Không tải được tin nhắn cũ.")
    } finally {
      setIsLoadingMore(false)
    }
  }

  const notifyTyping = (typing: boolean) => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    sendTyping(conversationId, typing)
    if (typing) {
      typingTimerRef.current = setTimeout(() => {
        sendTyping(conversationId, false)
      }, 2_500)
    }
  }

  /** Gửi một tin nhắn (text hoặc media) với optimistic update. */
  const sendPayload = async (payload: {
    content: string
    type: string
    mediaUrl?: string
  }) => {
    if (isSending) return

    const tempId = `temp-${Date.now()}`
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: user?.id || "",
      type: payload.type,
      content: payload.content,
      mediaUrl: payload.mediaUrl,
      createdAt: new Date().toISOString(),
      status: "sending",
    }

    setMessages((prev) => [...prev, optimistic])
    setIsSending(true)
    notifyTyping(false)

    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    )

    try {
      const saved = await chatService.sendMessage(conversationId, payload)
      setMessages((prev) => {
        // Bỏ bubble tạm; nếu WS đã thêm bản thật thì chỉ cập nhật, không thêm lần nữa
        const withoutTemp = prev.filter((m) => m.id !== tempId)
        const alreadyThere = withoutTemp.findIndex((m) => m.id === saved.id)
        if (alreadyThere >= 0) {
          const next = [...withoutTemp]
          next[alreadyThere] = { ...saved, status: "sent" }
          return next
        }
        return [...withoutTemp, { ...saved, status: "sent" }]
      })
      setConversation((prev) =>
        prev ? { ...prev, lastMessage: saved, updatedAt: saved.createdAt } : prev
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: "failed" as const } : m
        )
      )
      toast.error(getErrorMessage(err, "Không gửi được tin nhắn."))
    } finally {
      setIsSending(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isSending) return
    setInput("")
    await sendPayload({ content: text, type: "TEXT" })
  }

  /** Gửi ảnh / sticker / GIF đã chọn từ MediaPicker. */
  const handlePickMedia = async (picked: PickedMedia) => {
    if (isSending || isUploading) return

    if (picked.kind === "STICKER") {
      await sendPayload({ content: picked.emoji, type: "STICKER" })
      return
    }

    if (picked.kind === "GIF") {
      await sendPayload({ content: "", type: "GIF", mediaUrl: picked.url })
      return
    }

    // Ảnh: upload lên media-service (có tiến trình) trước, rồi gửi URL
    try {
      const url = await upload(picked.file)
      await sendPayload({ content: "", type: "IMAGE", mediaUrl: url })
    } catch (err) {
      toast.error(getErrorMessage(err, "Không tải được ảnh lên."))
    }
  }

  const handleDelete = async (message: ChatMessage) => {
    if (message.status === "sending") return
    try {
      await chatService.deleteMessage(conversationId, message.id)
      setMessages((prev) => prev.filter((m) => m.id !== message.id))
    } catch (err) {
      toast.error(getErrorMessage(err, "Không xoá được tin nhắn."))
    }
  }

  const typingUsers = useMemo(() => {
    const list = typingByConversation[conversationId] ?? []
    return list.filter((t) => t.userId !== user?.id)
  }, [typingByConversation, conversationId, user?.id])

  const lastOwnReadIndex = useMemo(() => {
    if (!conversation?.lastReadMessageId) return -1
    return messages.findIndex((m) => m.id === conversation.lastReadMessageId)
  }, [conversation?.lastReadMessageId, messages])

  return (
    <div className="flex flex-col min-h-0 flex-1 bg-background">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`p-1.5 -ml-1 rounded-md hover:bg-accent transition ${
              backAlwaysVisible ? "" : "md:hidden"
            }`}
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <Link href={partner?.username ? `/u/${partner.username}` : "#"} className="shrink-0">
          <img
            src={partnerAvatar}
            alt={partnerName}
            className="w-9 h-9 rounded-full object-cover border border-border"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 min-w-0">
            <p className="text-sm font-semibold truncate">{partnerName}</p>
            <VerifiedBadge
              verified={partner?.verified}
              verifiedUntil={partner?.verifiedUntil}
              size={13}
            />
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {typingUsers.length > 0
              ? "đang nhập…"
              : partner?.displayName || "Hoạt động gần đây"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 min-h-0"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-1 px-6">
            <p className="text-sm font-medium">Chưa có tin nhắn nào</p>
            <p className="text-[11px] text-muted-foreground">
              Hãy gửi lời chào đến {partnerName}.
            </p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="text-[11px] text-primary hover:underline disabled:opacity-50"
                >
                  {isLoadingMore ? "Đang tải…" : "Tải tin nhắn cũ hơn"}
                </button>
              </div>
            )}

            {messages.map((message, index) => {
              const isMe = message.senderId === user?.id
              const isSeen = isMe && index === lastOwnReadIndex
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="group flex items-center gap-1 max-w-[80%]">
                    {isMe && message.status !== "sending" && (
                      <button
                        type="button"
                        onClick={() => handleDelete(message)}
                        className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                        title="Xoá tin nhắn"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    {message.type === "STICKER" ? (
                      /* Sticker: emoji cỡ lớn, không có nền bubble */
                      <span
                        className={`text-5xl leading-none select-none ${
                          message.status === "failed" ? "opacity-60" : ""
                        }`}
                      >
                        {message.content}
                      </span>
                    ) : message.mediaUrl &&
                      (message.type === "IMAGE" || message.type === "GIF") ? (
                      /* Ảnh / GIF: hiển thị ảnh, kèm chú thích nếu có */
                      <div className="space-y-1">
                        <a
                          href={message.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={message.mediaUrl}
                            alt="media"
                            loading="lazy"
                            className={`max-w-[230px] max-h-[300px] rounded-xl object-cover border border-border ${
                              message.status === "failed"
                                ? "opacity-60 ring-1 ring-destructive"
                                : ""
                            }`}
                          />
                        </a>
                        {message.content && (
                          <div
                            className={`px-3 py-1.5 rounded-2xl text-xs break-words whitespace-pre-wrap ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                          >
                            {message.content}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`px-3 py-1.5 rounded-2xl text-xs break-words whitespace-pre-wrap ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        } ${message.status === "failed" ? "opacity-60 ring-1 ring-destructive" : ""}`}
                      >
                        {message.content}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground px-1 mt-0.5">
                    {message.status === "sending"
                      ? "Đang gửi…"
                      : message.status === "failed"
                        ? "Gửi lỗi"
                        : formatClock(message.createdAt)}
                    {isSeen && " · Đã xem"}
                  </span>
                </div>
              )
            })}
          </>
        )}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
            </span>
            {typingUsers[0]?.username || partnerName} đang nhập…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {uploading && (
        <div className="px-2.5 pt-2">
          <UploadProgressCard upload={uploading} compact />
        </div>
      )}
      <form
        onSubmit={handleSend}
        className="p-2.5 border-t border-border flex items-center gap-2 shrink-0"
      >
        <MediaPicker onPick={handlePickMedia} disabled={isSending || isUploading} />
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            if (e.target.value.trim()) notifyTyping(true)
          }}
          onBlur={() => notifyTyping(false)}
          placeholder="Nhắn tin…"
          className="flex-1 bg-muted/60 px-3.5 py-2 rounded-full text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/40 transition"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending || isUploading}
          className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition shrink-0"
          aria-label="Gửi"
        >
          {isSending || isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  )
}

export default ChatThread
