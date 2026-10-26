"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { notificationService } from "@/services/notification.service"

const FALLBACK_MESSAGE = "Bạn có thông báo mới"
const NOTIFICATION_EVENT = "snapgram:notification-received"
const POLL_INTERVAL_MS = 60_000
/** Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (cap) */
const BACKOFF_STEPS_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000]

export interface NotificationsContextValue {
  unreadCount: number
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>
  refreshUnreadCount: () => Promise<void>
}

/**
 * Giá trị mặc định an toàn khi hook được dùng ngoài NotificationsProvider:
 * không crash, chỉ là không có dữ liệu realtime.
 */
const noopSetUnreadCount: React.Dispatch<React.SetStateAction<number>> = () => {}
const noopRefreshUnreadCount = async (): Promise<void> => {}

const DEFAULT_CONTEXT_VALUE: NotificationsContextValue = {
  unreadCount: 0,
  setUnreadCount: noopSetUnreadCount,
  refreshUnreadCount: noopRefreshUnreadCount,
}

export const NotificationsContext =
  createContext<NotificationsContextValue | null>(null)

/**
 * Đọc text hiển thị của thông báo theo thứ tự ưu tiên:
 * 1. data.payload.message (payload là object)
 * 2. data.messageText
 * 3. data.payload là string JSON → JSON.parse(...).message
 * 4. "Bạn có thông báo mới"
 */
function extractNotificationMessage(data: unknown): string {
  try {
    if (!data || typeof data !== "object") return FALLBACK_MESSAGE

    const record = data as Record<string, unknown>
    const payload = record.payload

    if (payload && typeof payload === "object") {
      const payloadMessage = (payload as Record<string, unknown>).message
      if (typeof payloadMessage === "string" && payloadMessage.trim() !== "") {
        return payloadMessage
      }
    }

    if (typeof record.messageText === "string" && record.messageText.trim() !== "") {
      return record.messageText
    }

    if (typeof payload === "string") {
      try {
        const parsed: unknown = JSON.parse(payload)
        if (parsed && typeof parsed === "object") {
          const parsedMessage = (parsed as Record<string, unknown>).message
          if (typeof parsedMessage === "string" && parsedMessage.trim() !== "") {
            return parsedMessage
          }
        }
      } catch {
        // payload không phải JSON hợp lệ → fallback
      }
    }

    return FALLBACK_MESSAGE
  } catch {
    return FALLBACK_MESSAGE
  }
}

/** http:// → ws://, https:// → wss:// ; giữ nguyên nếu đã là ws(s). */
function toWsBaseUrl(rawUrl: string): string {
  const url = rawUrl.trim().replace(/\/+$/, "")

  if (url.startsWith("ws://") || url.startsWith("wss://")) return url
  if (url.startsWith("https://")) {
    return `wss://${url.slice("https://".length)}`
  }
  if (url.startsWith("http://")) {
    return `ws://${url.slice("http://".length)}`
  }
  if (url.startsWith("//")) {
    const protocol =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "wss:"
        : "ws:"
    return `${protocol}${url}`
  }
  return `ws://${url}`
}

/**
 * WS base URL: ưu tiên NEXT_PUBLIC_API_URL (cùng host/port với REST gateway),
 * fallback về window.location khi env không có.
 */
function resolveWsBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (configured) return toWsBaseUrl(configured)

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    return `${protocol}//${window.location.host}`
  }

  return "ws://localhost:8080"
}

function buildNotificationWsUrl(userId: string): string {
  const base = resolveWsBaseUrl()
  // Browsers không set được header trong WebSocket handshake → truyền userId qua query.
  const separator = base.includes("?") ? "&" : "?"
  return `${base}/ws/notifications${separator}userId=${encodeURIComponent(userId)}`
}

/**
 * Provider DUY NHẤT cho realtime notification của app.
 * - 1 WebSocket cho toàn app
 * - polling unread-count dự phòng mỗi 60s
 * - reconnect exponential backoff (cap 30s)
 * - cleanup khi logout/unmount
 */
export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const userId = user?.id ?? null

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch {
      // Giữ nguyên số hiện tại; lần poll sau sẽ cập nhật
    }
  }, [isAuthenticated])

  // Polling dự phòng khi WebSocket đứt: poll ngay 1 lần khi mount + mỗi 60s.
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }

    let cancelled = false

    void refreshUnreadCount()

    const timer = setInterval(() => {
      if (cancelled) return
      void refreshUnreadCount()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [isAuthenticated, refreshUnreadCount])

  // WebSocket: connection duy nhất, reconnect backoff, cleanup.
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setUnreadCount(0)
      return
    }
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return

    let active = true
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let attempt = 0

    const scheduleReconnect = () => {
      if (!active || reconnectTimer) return
      const delay =
        BACKOFF_STEPS_MS[Math.min(attempt, BACKOFF_STEPS_MS.length - 1)]
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
        ws = new WebSocket(buildNotificationWsUrl(userId))
      } catch {
        // Không tạo được socket → thử lại theo backoff
        scheduleReconnect()
        return
      }

      socket = ws

      ws.onopen = () => {
        // Kết nối lại thành công → reset backoff
        attempt = 0
      }

      ws.onmessage = (event: MessageEvent) => {
        if (!active) return

        let data: unknown = null
        try {
          data = JSON.parse(event.data as string)
        } catch {
          data = null
        }

        setUnreadCount((prev) => prev + 1)

        // Tin nhắn đã có UI chat realtime riêng (ChatProvider) → chỉ tăng badge,
        // không bắn toast để tránh thông báo trùng.
        const notificationType =
          data && typeof data === "object"
            ? (data as Record<string, unknown>).type
            : null
        if (notificationType !== "MESSAGE") {
          const message = extractNotificationMessage(data)
          toast.info(message, {
            description: "Xem trong mục Thông báo",
          })
        }

        try {
          window.dispatchEvent(
            new CustomEvent(NOTIFICATION_EVENT, { detail: data })
          )
        } catch {
          // Bỏ qua lỗi dispatch event
        }
      }

      ws.onerror = () => {
        // onclose sẽ chạy sau onerror → chỉ reconnect trong onclose để tránh 2 timer
        try {
          ws.close()
        } catch {
          // Bỏ qua
        }
      }

      ws.onclose = () => {
        socket = null
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      active = false
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      if (socket) {
        const current = socket
        socket = null
        current.onopen = null
        current.onmessage = null
        current.onerror = null
        current.onclose = null
        try {
          current.close()
        } catch {
          // Bỏ qua
        }
      }
    }
  }, [isAuthenticated, userId])

  const value = useMemo<NotificationsContextValue>(
    () => ({ unreadCount, setUnreadCount, refreshUnreadCount }),
    [unreadCount, refreshUnreadCount]
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

/**
 * Đọc context. Nếu chưa mount provider → trả giá trị mặc định an toàn.
 */
export function useNotificationsContext(): NotificationsContextValue {
  return useContext(NotificationsContext) ?? DEFAULT_CONTEXT_VALUE
}
