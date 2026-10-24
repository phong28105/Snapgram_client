"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, UserMinus } from "lucide-react"
import { toast } from "sonner"
import { contentService } from "@/services/content.service"
import { userService } from "@/services/user.service"
import { getErrorMessage } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import type { FollowResponse } from "@/types/content.type"
import type { UserProfileResponse } from "@/types/user.type"

interface FollowListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "followers" | "following"
  userId?: string
}

export function FollowListDialog({
  open,
  onOpenChange,
  mode,
  userId,
}: FollowListDialogProps) {
  const { user: currentUser } = useAuth()
  const [items, setItems] = useState<FollowResponse[]>([])
  const [userMap, setUserMap] = useState<Record<string, UserProfileResponse>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    setIsLoading(true)

    const fetcher =
      mode === "followers"
        ? contentService.getFollowers(0, 30, userId)
        : contentService.getFollowing(0, 30, userId)

    fetcher
      .then(async (res) => {
        if (!active) return
        const list = res.content || []
        setItems(list)

        // Batch tải thông tin profile của tất cả user trong danh sách bằng POST /api/users/batch
        const targetIds = Array.from(
          new Set(
            list.map((item) =>
              mode === "followers" ? item.followerId : item.followingId
            )
          )
        )

        if (targetIds.length > 0) {
          try {
            const profiles = await userService.getUsersBatch(targetIds)
            if (active) {
              const map: Record<string, UserProfileResponse> = {}
              profiles.forEach((prof) => {
                map[prof.id] = prof
              })
              setUserMap((prev) => ({ ...prev, ...map }))
            }
          } catch {
            // Ignore batch load error
          }
        }
      })
      .catch(() => {
        if (!active) return
        setItems([])
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, mode, userId])

  const handleUnfollow = async (targetUserId: string) => {
    setUnfollowingId(targetUserId)
    try {
      await contentService.unfollowUser(targetUserId)
      setItems((prev) =>
        prev.filter((item) =>
          mode === "following"
            ? item.followingId !== targetUserId
            : item.followerId !== targetUserId
        )
      )
      toast.success("Đã hủy theo dõi.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể hủy theo dõi."))
    } finally {
      setUnfollowingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-4 py-3 border-b border-border/60">
          <DialogTitle className="text-sm font-bold text-center">
            {mode === "followers" ? "Người theo dõi" : "Đang theo dõi"}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 px-4 text-center text-xs text-muted-foreground">
              {mode === "followers"
                ? "Chưa có người theo dõi nào."
                : "Chưa theo dõi tài khoản nào."}
            </div>
          ) : (
            items.map((item) => {
              const targetUserId =
                mode === "followers" ? item.followerId : item.followingId
              const profile = userMap[targetUserId]
              const username = profile?.username || `user_${targetUserId.slice(0, 8)}`
              const displayName = profile?.displayName || username
              const avatarUrl = profile?.avatarUrl || "/profile.jpg"

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition"
                >
                  <Link
                    href={`/u/${profile?.username || targetUserId}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{username}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {displayName}
                      </p>
                    </div>
                  </Link>

                  {!userId && mode === "following" && targetUserId !== currentUser?.id && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={unfollowingId === targetUserId}
                      onClick={() => handleUnfollow(targetUserId)}
                      className="h-7 text-xs px-2.5 gap-1"
                    >
                      {unfollowingId === targetUserId ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserMinus className="w-3 h-3" />
                      )}
                      <span>Hủy</span>
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
