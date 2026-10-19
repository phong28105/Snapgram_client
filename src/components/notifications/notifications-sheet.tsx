"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Check, Heart, MessageCircle, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { contentService } from "@/services/content.service"
import { getErrorMessage } from "@/lib/api"
import type { FollowResponse } from "@/types/content.type"

interface NotificationItem {
  id: string
  type: "like" | "comment" | "follow"
  username: string
  avatar: string
  message: string
  time: string
  postId?: string
  postThumb?: string
  isRead?: boolean
}

const initialNotifications: NotificationItem[] = [
  {
    id: "n1",
    type: "like",
    username: "minh_anh",
    avatar: "/profile.jpg",
    message: "đã thích bài viết của bạn.",
    time: "15 phút",
    postId: "post-1",
    postThumb: "/profile.jpg",
    isRead: false,
  },
  {
    id: "n2",
    type: "comment",
    username: "hoang_nam",
    avatar: "/profile.jpg",
    message: "đã bình luận: \"Màu ảnh cực kỳ cuốn luôn! 🔥\"",
    time: "2 giờ",
    postId: "post-2",
    postThumb: "/auth-image-1.webp",
    isRead: false,
  },
  {
    id: "n3",
    type: "follow",
    username: "linh_chi",
    avatar: "/profile.jpg",
    message: "đã bắt đầu theo dõi bạn.",
    time: "1 ngày",
    isRead: true,
  },
  {
    id: "n4",
    type: "like",
    username: "street_vibes",
    avatar: "/profile.jpg",
    message: "và 12 người khác đã thích thước phim của bạn.",
    time: "3 ngày",
    postId: "post-3",
    postThumb: "/auth-image-2.webp",
    isRead: true,
  },
]

interface NotificationsSheetProps {
  children: React.ReactNode
}

export function NotificationsSheet({ children }: NotificationsSheetProps) {
  const { isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications)
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({})
  const [pendingRequests, setPendingRequests] = useState<FollowResponse[]>([])

  useEffect(() => {
    if (!open || !isAuthenticated) return
    contentService
      .getPendingFollowRequests(0, 20)
      .then((res) => setPendingRequests(res.content || []))
      .catch(() => setPendingRequests([]))
  }, [open, isAuthenticated])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !isAuthenticated) {
      openLoginModal()
      return
    }
    setOpen(nextOpen)
  }

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
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
            className="text-xs font-semibold text-primary hover:underline mr-6"
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
                  const shortUser = `user_${req.followerId.slice(0, 8)}`
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <Link
                        href={`/u/${req.followerId}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 min-w-0"
                      >
                        <img
                          src="/profile.jpg"
                          alt={shortUser}
                          className="w-9 h-9 rounded-full object-cover border border-border"
                        />
                        <div className="text-xs min-w-0">
                          <p className="font-semibold truncate">{shortUser}</p>
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

          {/* Activity Notifications */}
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/50 transition ${
                !item.isRead ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Link
                  href={`/u/${item.username}`}
                  onClick={() => setOpen(false)}
                  className="relative shrink-0"
                >
                  <img
                    src={item.avatar}
                    alt={item.username}
                    className="w-10 h-10 rounded-full object-cover border border-border"
                  />
                  <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-background border border-border">
                    {item.type === "like" && (
                      <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                    )}
                    {item.type === "comment" && (
                      <MessageCircle className="w-2.5 h-2.5 text-primary fill-primary" />
                    )}
                    {item.type === "follow" && (
                      <UserPlus className="w-2.5 h-2.5 text-emerald-500" />
                    )}
                  </span>
                </Link>

                <div className="text-xs leading-snug min-w-0 flex-1">
                  <Link
                    href={`/u/${item.username}`}
                    onClick={() => setOpen(false)}
                    className="font-semibold hover:underline mr-1"
                  >
                    {item.username}
                  </Link>
                  <span className="text-foreground/90">{item.message}</span>
                  <span className="text-muted-foreground ml-1.5 text-[11px]">
                    {item.time}
                  </span>
                </div>
              </div>

              {item.type === "follow" ? (
                <Button
                  type="button"
                  size="sm"
                  variant={followedMap[item.username] ? "secondary" : "default"}
                  onClick={() =>
                    setFollowedMap((prev) => ({
                      ...prev,
                      [item.username]: !prev[item.username],
                    }))
                  }
                  className="h-8 text-xs px-3 shrink-0"
                >
                  {followedMap[item.username] ? "Đang theo dõi" : "Theo dõi lại"}
                </Button>
              ) : item.postId && item.postThumb ? (
                <Link
                  href={`/p/${item.postId}`}
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0 border border-border"
                >
                  <img
                    src={item.postThumb}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
