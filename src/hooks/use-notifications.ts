"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { notificationService } from "@/services/notification.service"
import { toast } from "sonner"

export function useNotifications() {
  const { user, isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch {
      // Ignore
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshUnreadCount()
  }, [refreshUnreadCount])

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      return
    }

    const baseWsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== "undefined"
        ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:8080/ws/notifications`
        : "ws://localhost:8080/ws/notifications")

    // Browsers cannot set custom headers on WebSocket handshakes -> pass userId as query param
    const wsUrl = `${baseWsUrl}${baseWsUrl.includes("?") ? "&" : "?"}userId=${encodeURIComponent(user.id)}`

    let isSubscribed = true
    let socket: WebSocket | null = null

    try {
      socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.onopen = () => {
        // Connected
      }

      socket.onmessage = (event) => {
        if (!isSubscribed) return
        try {
          const data = JSON.parse(event.data)
          setUnreadCount((prev) => prev + 1)

          const message =
            typeof data.payload === "string"
              ? JSON.parse(data.payload)?.message || "Bạn có thông báo mới"
              : data.payload?.message || "Bạn có thông báo mới"

          toast.info(message, {
            description: "Xem trong mục Thông báo",
          })

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("snapgram:notification-received", { detail: data })
            )
          }
        } catch {
          setUnreadCount((prev) => prev + 1)
        }
      }

      socket.onerror = () => {
        // Fail silently and rely on HTTP polling
      }
    } catch {
      // Ignore websocket connection error
    }

    return () => {
      isSubscribed = false
      if (socket) {
        socket.close()
      }
    }
  }, [isAuthenticated, user?.id])

  return {
    unreadCount,
    setUnreadCount,
    refreshUnreadCount,
  }
}
