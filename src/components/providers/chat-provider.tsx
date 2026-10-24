"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useAuth } from "@/hooks/use-auth"
import { chatService } from "@/services/chat.service"
import type {
  ChatTypingState,
  ChatWsEnvelope,
} from "@/types/chat.type"

const POLL_INTERVAL_MS = 60_000
const BACKOFF_STEPS_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000]
const TYPING_TTL_MS = 4_000

export interface ChatContextValue {
  /** Tổng số tin chưa đọc (badge ở sidebar/navbot). */
  unreadTotal: number
  refreshUnread: () => Promise<void>
  /** Hội thoại đang mở — dùng để không tăng unread và không toast trùng. */
  activeConversationId: string | null
  setActiveConversationId: (id: string | null) => void
  /** Sự kiện realtime gần nhất, kèm số thứ tự để consumer phát hiện thay đổi. */
  lastEvent: { seq: number; envelope: ChatWsEnvelope } | null
  /** Ai đang nhập trong từng hội thoại. */
  typingByConversation: Record<string, ChatTypingState[]>
  /** Gửi trạng thái đang nhập qua WebSocket (fallback REST nếu socket chưa mở). */
  sendTyping: (conversationId: string, typing: boolean) => void
  connected: boolean
}

const noopAsync = async (): Promise<void> => {}
const noop = () => {}

const DEFAULT_VALUE: ChatContextValue = {
  unreadTotal: 0,
  refreshUnread: noopAsync,
  activeConversationId: null,
  setActiveConversationId: noop,
  lastEvent: null,
  typingByConversation: {},
  sendTyping: noop,
  connected: false,
}

export const ChatContext = createContext<ChatContextValue | null>(null)

function toWsBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "")
  if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) return trimmed
  if (trimmed.startsWith("https://")) return `wss://${trimmed.slice("https://".length)}`
  if (trimmed.startsWith("http://")) return `ws://${trimmed.slice("http://".length)}`
  return `ws://${trimmed}`
}

function resolveWsBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (configured) return toWsBaseUrl(configured)

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    return `${protocol}//${window.location.host}`
  }

  return "ws://localhost:8080"
}

function buildChatWsUrl(userId: string, username?: string): string {
  const base = resolveWsBaseUrl()
  const separator = base.includes("?") ? "&" : "?"
  const params = new URLSearchParams({ userId })
  if (username) params.set("username", username)
  return `${base}/ws/chat${separator}${params.toString()}`
}

/**
 * Provider realtime cho chat:
 * - 1 WebSocket /ws/chat dùng chung toàn app
 * - badge tổng tin chưa đọc + polling dự phòng 60s
 * - trạng thái "đang nhập" tự hết hạn sau 4s
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const userId = user?.id ?? null

  const [unreadTotal, setUnreadTotal] = useState(0)
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null)
  const [lastEvent, setLastEvent] = useState<{ seq: number; envelope: ChatWsEnvelope } | null>(null)
  const [typingByConversation, setTypingByConversation] = useState<
    Record<string, ChatTypingState[]>
  >({})
  const [connected, setConnected] = useState(false)

  const socketRef = useRef<WebSocket | null>(null)
  const activeConversationRef = useRef<string | null>(null)
  const seqRef = useRef(0)

  const setActiveConversationId = useCallback((id: string | null) => {
    activeConversationRef.current = id
    setActiveConversationIdState(id)
  }, [])

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadTotal(0)
      return
    }
    try {
      setUnreadTotal(await chatService.getUnreadCount())
    } catch {
      // giữ số hiện tại, lần poll sau cập nhật
    }
  }, [isAuthenticated])

  // Polling dự phòng
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadTotal(0)
      return
    }
    let cancelled = false
    void refreshUnread()
    const timer = setInterval(() => {
      if (!cancelled) void refreshUnread()
    }, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [isAuthenticated, refreshUnread])

  // WebSocket
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setConnected(false)
      return
    }
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return

    let active = true
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let attempt = 0

    const scheduleReconnect = () => {
      if (!active || reconnectTimer) return
      const delay = BACKOFF_STEPS_MS[Math.min(attempt, BACKOFF_STEPS_MS.length - 1)]
      attempt += 1
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, delay)
    }

    const connect = () => {
      if (!active) return

      let ws: WebSocket
      try {
        ws = new WebSocket(buildChatWsUrl(userId, user?.username))
      } catch {
        scheduleReconnect()
        return
      }

      socketRef.current = ws

      ws.onopen = () => {
        if (!active) return
        attempt = 0
        setConnected(true)
        // Đồng bộ lại sau khi (re)connect để không lỡ tin trong lúc đứt
        void refreshUnread()
      }

      ws.onmessage = (event) => {
        if (!active) return
        let envelope: ChatWsEnvelope
        try {
          envelope = JSON.parse(event.data) as ChatWsEnvelope
        } catch {
          return
        }
        if (!envelope?.type) return

        seqRef.current += 1
        setLastEvent({ seq: seqRef.current, envelope })

        if (envelope.type === "TYPING") {
          const data = envelope.data
          if (!data?.conversationId || !data.userId) return
          const conversationId = data.conversationId
          const typing = data.typing !== false
          const userIdValue = data.userId

          setTypingByConversation((prev) => {
            const current = prev[conversationId] ?? []
            const withoutUser = current.filter((t) => t.userId !== userIdValue)
            if (!typing) {
              return { ...prev, [conversationId]: withoutUser }
            }
            return {
              ...prev,
              [conversationId]: [
                ...withoutUser,
                {
                  userId: userIdValue,
                  username: data.username,
                  updatedAt: Date.now(),
                },
              ],
            }
          })
          return
        }

        if (envelope.type === "MESSAGE_CREATED") {
          const conversationId = envelope.data?.conversationId
          const senderId = envelope.data?.message?.senderId
          // Tin của chính mình hoặc đang mở đúng hội thoại → không tăng badge
          if (!conversationId) return
          if (conversationId === activeConversationRef.current) return
          if (senderId && senderId === userId) return
          setUnreadTotal((prev) => prev + 1)
        }
      }

      ws.onclose = () => {
        if (!active) return
        setConnected(false)
        scheduleReconnect()
      }

      ws.onerror = () => {
        try {
          ws.close()
        } catch {
          // ignore
        }
      }
    }

    connect()

    return () => {
      active = false
      setConnected(false)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      const socket = socketRef.current
      socketRef.current = null
      if (socket) {
        socket.onclose = null
        socket.onerror = null
        try {
          socket.close()
        } catch {
          // ignore
        }
      }
    }
  }, [isAuthenticated, userId, user?.username, refreshUnread])

  // Dọn trạng thái "đang nhập" hết hạn
  useEffect(() => {
    const timer = setInterval(() => {
      setTypingByConversation((prev) => {
        const now = Date.now()
        let changed = false
        const next: Record<string, ChatTypingState[]> = {}
        for (const [conversationId, list] of Object.entries(prev)) {
          const alive = list.filter((t) => now - t.updatedAt < TYPING_TTL_MS)
          if (alive.length !== list.length) changed = true
          if (alive.length > 0) next[conversationId] = alive
        }
        return changed ? next : prev
      })
    }, 1_000)
    return () => clearInterval(timer)
  }, [])

  const sendTyping = useCallback(
    (conversationId: string, typing: boolean) => {
      const socket = socketRef.current
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({ type: "TYPING", conversationId, typing })
        )
        return
      }
      // Socket chưa mở → fallback REST để vẫn có typing indicator
      void chatService
        .typing(conversationId, { typing, username: user?.username })
        .catch(() => {})
    },
    [user?.username]
  )

  const value = useMemo<ChatContextValue>(
    () => ({
      unreadTotal,
      refreshUnread,
      activeConversationId,
      setActiveConversationId,
      lastEvent,
      typingByConversation,
      sendTyping,
      connected,
    }),
    [
      unreadTotal,
      refreshUnread,
      activeConversationId,
      setActiveConversationId,
      lastEvent,
      typingByConversation,
      sendTyping,
      connected,
    ]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext(): ChatContextValue {
  return useContext(ChatContext) ?? DEFAULT_VALUE
}
