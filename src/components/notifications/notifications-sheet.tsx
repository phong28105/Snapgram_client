"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Check, Heart, MessageCircle, UserPlus, X, Bell, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { contentService } from "@/services/content.service"
import { notificationService } from "@/services/notification.service"
import { userService } from "@/services/user.service"
import { getErrorMessage } from "@/lib/api"
import { TimeAgo } from "@/components/ui/time-ago"
import type { FollowResponse } from "@/types/content.type"
import type { NotificationResponse } from "@/types/notification.type"
import type { UserProfileResponse } from "@/types/user.type"

interface NotificationsSheetProps {
  children: React.ReactNode
}

function parseNotificationMessage(item: NotificationResponse): string {
  if (item.payload) {
    if (typeof item.payload === "string") {
      try {
        const parsed = JSON.parse(item.payload)
        if (parsed.message) return parsed.message
      } catch {
        return item.payload
      }
    } else if (typeof item.payload === "object" && (item.payload as any).message) {
      return (item.payload as any).message
    }
  }

  switch (item.type) {
    case "LIKE":
      return "đã thích bài viết của bạn."
    case "COMMENT":
      return "đã bình luận về bài viết của bạn."
    case "REPLY":
      return "đã trả lời bình luận của bạn."
    case "FOLLOW":
      return "đã bắt đầu theo dõi bạn."
    case "MENTION":
      return "đã nhắc đến bạn trong một bài viết."
    case "MESSAGE":
      return "đã gửi cho bạn một tin nhắn."
    case "REPORT_RESOLVED":
      return "báo cáo của bạn đã được giải quyết."
    default:
      return "có hoạt động mới liên quan đến bạn."
  }
}

export function NotificationsSheet({ children }: NotificationsSheetProps) {
  const { isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [userProfileMap, setUserProfileMap] = useState<Record<string, UserProfileResponse>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<FollowResponse[]>([])
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({})

  const loadNotificationsData = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)

    try {
      const [notifRes, followReqRes] = await Promise.all([
        notificationService.getNotifications(false, 0, 30),
        contentService.getPendingFollowRequests(0, 20).catch(() => ({ content: [] })),
      ])

      const notifs = (notifRes.content || []).map((n) => ({
        ...n,
        // Backend có thể trả key `read` thay vì `isRead`
        isRead: n.isRead ?? n.read ?? false,
      }))
      const pending = followReqRes.content || []

      setNotifications(notifs)
      setPendingRequests(pending)

      // Collect all user IDs to batch fetch profiles
      const userIdsToFetch = new Set<string>()
      notifs.forEach((n) => {
        if (n.actorId) userIdsToFetch.add(n.actorId)
      })
      pending.forEach((p) => {
        if (p.followerId) userIdsToFetch.add(p.followerId)
      })

      if (userIdsToFetch.size > 0) {
        const profiles = await userService.getUsersBatch(Array.from(userIdsToFetch))
        const pMap: Record<string, UserProfileResponse> = {}
        profiles.forEach((p) => {
          pMap[p.id] = p
        })
        setUserProfileMap((prev) => ({ ...prev, ...pMap }))
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (open && isAuthenticated) {
      loadNotificationsData()
    }
  }, [open, isAuthenticated, loadNotificationsData])

  // Listen to WebSocket notification events
  useEffect(() => {
    const handleNewNotification = () => {
      loadNotificationsData()
    }
    window.addEventListener("snapgram:notification-received", handleNewNotification)
    return () => {
      window.removeEventListener("snapgram:notification-received", handleNewNotification)
    }
  }, [loadNotificationsData])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !isAuthenticated) {
      openLoginModal()
      return
    }
    setOpen(nextOpen)
  }

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      await notificationService.markAllAsRead()
      toast.success("Đã đánh dấu tất cả là đã đọc.")
    } catch {
      // Ignored
    }
  }

  const handleNotificationClick = async (item: NotificationResponse) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      )
      notificationService.markAsRead(item.id).catch(() => {})
    }
    setOpen(false)
  }

  const handleAcceptRequest = async (followId: string) => {
    try {
      await contentService.acceptFollowRequest(followId)
      setPendingRequests((prev) => prev.filter((r) => r.id !== followId))
      toast.success("Đã chấp nhận yêu cầu theo dõi!")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể chấp nhận yêu cầu."))
    }
  }

  const handleRejectRequest = async (followId: string) => {
    try {
      await contentService.rejectFollowRequest(followId)
      setPendingRequests((prev) => prev.filter((r) => r.id !== followId))
      toast.success("Đã từ chối yêu cầu theo dõi.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể từ chối yêu cầu."))
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="left"
        className="w-full sm:max-w-[390px] p-0 bg-white dark:bg-zinc-900 border-r border-border flex flex-col"
      >
        <SheetHeader className="px-5 py-4 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-base font-bold">Thông báo</SheetTitle>
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-semibold text-primary hover:underline mr-6 cursor-pointer"
          >
            Đánh dấu đã đọc
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {/* Pending Follow Requests Section */}
          {pendingRequests.length > 0 && (
            <div className="p-4 bg-muted/30 space-y-3">
              <h5 className="text-xs font-bold text-foreground">
                Yêu cầu theo dõi ({pendingRequests.length})
              </h5>
              <div className="space-y-2.5">
                {pendingRequests.map((req) => {
                  const followerProfile = userProfileMap[req.followerId]
                  const username = followerProfile?.username || req.followerId
                  const avatar = followerProfile?.avatarUrl || "/profile.jpg"

                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <Link
                        href={`/u/${username}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 min-w-0"
                      >
                        <img
                          src={avatar}
                          alt={username}
                          className="w-9 h-9 rounded-full object-cover border border-border"
                        />
                        <div className="text-xs min-w-0">
                          <p className="font-semibold truncate">@{username}</p>
                          <p className="text-[11px] text-muted-foreground">
                            muốn theo dõi bạn
                          </p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAcceptRequest(req.id)}
                          className="h-7 px-2.5 text-xs gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Xác nhận
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(req.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Đang tải thông báo...</span>
            </div>
          )}

          {/* Empty Notifications State */}
          {!isLoading && notifications.length === 0 && pendingRequests.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Chưa có thông báo nào</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Khi có lượt thích, bình luận hoặc người theo dõi mới, bạn sẽ thấy ở đây.
                </p>
              </div>
            </div>
          )}

          {/* Activity Notifications */}
          {notifications.map((item) => {
            const actorProfile = item.actorId ? userProfileMap[item.actorId] : null
            const username = actorProfile?.username || item.actorId || "Snapgram"
            const avatar = actorProfile?.avatarUrl || "/profile.jpg"
            const message = parseNotificationMessage(item)
            const targetPostId =
              item.targetType === "POST" || item.targetType === "COMMENT"
                ? item.targetId
                : undefined

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/50 transition ${
                  !item.isRead ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Link
                    href={`/u/${username}`}
                    onClick={() => handleNotificationClick(item)}
                    className="relative shrink-0"
                  >
                    <img
                      src={avatar}
                      alt={username}
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                    <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-background border border-border">
                      {item.type === "LIKE" && (
                        <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                      )}
                      {item.type === "COMMENT" && (
                        <MessageCircle className="w-2.5 h-2.5 text-primary fill-primary" />
                      )}
                      {item.type === "REPLY" && (
                        <MessageCircle className="w-2.5 h-2.5 text-sky-500 fill-sky-500" />
                      )}
                      {item.type === "FOLLOW" && (
                        <UserPlus className="w-2.5 h-2.5 text-emerald-500" />
                      )}
                      {item.type !== "LIKE" && item.type !== "COMMENT" && item.type !== "REPLY" && item.type !== "FOLLOW" && (
                        <Bell className="w-2.5 h-2.5 text-amber-500" />
                      )}
                    </span>
                  </Link>

                  <div className="text-xs leading-snug min-w-0 flex-1">
                    <Link
                      href={`/u/${username}`}
                      onClick={() => handleNotificationClick(item)}
                      className="font-semibold hover:underline mr-1"
                    >
                      @{username}
                    </Link>
                    <span className="text-foreground/90">{message}</span>
                    <span className="text-muted-foreground ml-1.5 text-[11px] block mt-0.5">
                      <TimeAgo date={item.createdAt} />
                    </span>
                  </div>
                </div>

                {item.type === "FOLLOW" && item.actorId ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={followedMap[username] ? "secondary" : "default"}
                    onClick={async () => {
                      const next = !followedMap[username]
                      setFollowedMap((prev) => ({ ...prev, [username]: next }))
                      try {
                        if (next) {
                          await contentService.followUser(item.actorId!)
                          toast.success(`Đã theo dõi @${username}`)
                        } else {
                          await contentService.unfollowUser(item.actorId!)
                          toast.success(`Đã hủy theo dõi @${username}`)
                        }
                      } catch {
                        setFollowedMap((prev) => ({ ...prev, [username]: !next }))
                      }
                    }}
                    className="h-7 text-xs px-2.5 shrink-0"
                  >
                    {followedMap[username] ? "Đang theo dõi" : "Theo dõi lại"}
                  </Button>
                ) : targetPostId ? (
                  <Link
                    href={`/p/${targetPostId}`}
                    onClick={() => handleNotificationClick(item)}
                    className="text-xs font-medium text-primary hover:underline shrink-0 px-2 py-1 bg-muted/60 rounded"
                  >
                    Xem bài viết
                  </Link>
                ) : null}
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
