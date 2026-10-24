"use client"

import { useNotificationsContext } from "@/components/providers/notifications-provider"

/**
 * Wrapper mỏng của NotificationsContext.
 *
 * Hook này KHÔNG mở WebSocket riêng — connection duy nhất nằm trong
 * NotificationsProvider (mount 1 lần ở src/app/(home)/layout.tsx).
 * Giữ nguyên API cũ để navbar/sidebar chỉ cần đổi import nếu muốn.
 */
export function useNotifications() {
  return useNotificationsContext()
}
