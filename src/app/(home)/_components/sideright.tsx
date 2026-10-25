"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { siderightFooterLists } from "@/data"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { userService } from "@/services/user.service"
import { feedService } from "@/services/feed.service"
import { contentService } from "@/services/content.service"
import type { UserProfileResponse } from "@/types/user.type"

const Sideright = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [suggestions, setSuggestions] = useState<UserProfileResponse[]>([])
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let active = true

    const loadSuggestions = async () => {
      try {
        let followedIds = new Set<string>()

        if (isAuthenticated) {
          try {
            const fRes = await contentService.getFollowing(0, 100)
            followedIds = new Set((fRes.content || []).map((f) => f.followingId))
          } catch {
            // Ignore
          }
        }

        let suggestedProfiles: UserProfileResponse[] = []

        if (isAuthenticated) {
          try {
            const feedSuggestions = await feedService.getSuggestedUsers(10)
            if (feedSuggestions && feedSuggestions.length > 0) {
              const uids = feedSuggestions.map((s) => s.userId).filter((id) => !followedIds.has(id))
              if (uids.length > 0) {
                suggestedProfiles = await userService.getUsersBatch(uids)
              }
            }
          } catch {
            // Fallback to search
          }
        }

        if (suggestedProfiles.length === 0) {
          const searchRes = await userService.searchUsers("", 0, 15)
          suggestedProfiles = searchRes.content || []
        }

        if (!active) return

        // Loại bỏ chính mình, những người ĐÃ theo dõi, và các tài khoản không phải USER khỏi danh sách gợi ý
        const filtered = suggestedProfiles.filter(
          (item) =>
            item.id !== user?.id &&
            item.username?.toLowerCase() !== user?.username?.toLowerCase() &&
            (!item.id || !followedIds.has(item.id)) &&
            (!item.role || item.role.toUpperCase() === "USER")
        )

        const list = filtered.slice(0, 5)
        setSuggestions(list)

        const nextMap: Record<string, boolean> = {}
        list.forEach((s) => {
          if (s.id && followedIds.has(s.id)) {
            nextMap[s.username] = true
          }
        })
        setFollowedMap((prev) => ({ ...prev, ...nextMap }))
      } catch {
        if (active) setSuggestions([])
      }
    }

    loadSuggestions()

    const handleFollowUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId?: string; username?: string; following?: boolean }>
      if (customEvent.detail?.username && typeof customEvent.detail.following === "boolean") {
        setFollowedMap((prev) => ({
          ...prev,
          [customEvent.detail.username!]: customEvent.detail.following!,
        }))
      }
    }

    window.addEventListener("snapgram:follow-updated", handleFollowUpdated)

    return () => {
      active = false
      window.removeEventListener("snapgram:follow-updated", handleFollowUpdated)
    }
  }, [user?.id, user?.username, isAuthenticated])

  const handleToggleFollow = async (sug: UserProfileResponse) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }

    if (
      (sug.id && user?.id && sug.id === user.id) ||
      (sug.username && user?.username && sug.username.toLowerCase() === user.username.toLowerCase())
    ) {
      toast.error("Bạn không thể tự theo dõi chính mình.")
      return
    }

    const currentFollowing = Boolean(followedMap[sug.username])
    const nextState = !currentFollowing
    setFollowedMap((prev) => ({ ...prev, [sug.username]: nextState }))

    const isRealUuid = sug.id && !sug.id.startsWith("s")
    if (isRealUuid) {
      try {
        if (nextState) {
          const res = await contentService.followUser(sug.id)
          if (res.status === "PENDING") {
            toast.info(`Đã gửi yêu cầu theo dõi @${sug.username}`)
          } else {
            toast.success(`Đã theo dõi @${sug.username}`)
          }
        } else {
          await contentService.unfollowUser(sug.id)
          toast.success(`Đã hủy theo dõi @${sug.username}`)
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("snapgram:follow-updated", {
              detail: { userId: sug.id, username: sug.username, following: nextState },
            })
          )
        }
      } catch (err: any) {
        // Nếu lỗi 409 (đã theo dõi từ trước), giữ nguyên trạng thái đang theo dõi
        const status = err?.response?.status
        const msg = err?.response?.data?.message || err?.message || ""
        if (nextState && (status === 409 || msg.includes("Already following"))) {
          setFollowedMap((prev) => ({ ...prev, [sug.username]: true }))
          toast.success(`Đang theo dõi @${sug.username}`)
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("snapgram:follow-updated", {
                detail: { userId: sug.id, username: sug.username, following: true },
              })
            )
          }
        } else {
          // Rollback optimistic update on real error
          setFollowedMap((prev) => ({ ...prev, [sug.username]: currentFollowing }))
          toast.error("Không thể cập nhật theo dõi.")
        }
      }
    } else {
      if (nextState) {
        toast.success(`Đã theo dõi @${sug.username}`)
      } else {
        toast.success(`Đã hủy theo dõi @${sug.username}`)
      }
    }
  }

  return (
    <aside className="max-[1160px]:hidden ps-16 pt-8 w-[319px]">
      <div className="flex flex-col space-y-6">
        {/* Current user account or login prompt */}
        {isAuthenticated && user ? (
          <div className="flex flex-row items-center justify-between w-full">
            <Link
              href="/profile"
              className="flex flex-row items-center gap-x-3 hover:opacity-80 transition min-w-0"
            >
              <img
                src={user.avatarUrl || "/profile.jpg"}
                alt={user.username || "profile"}
                className="w-[44px] h-[44px] object-cover rounded-full border border-border shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <h6 className="text-xs font-bold tracking-tight truncate">{user.username}</h6>
                <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                  {user.displayName || user.email}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={openLoginModal}
              className="font-semibold text-blue-500 text-xs hover:opacity-80 transition duration-75 shrink-0"
            >
              Chuyển
            </button>
          </div>
        ) : !isLoading ? (
          <div className="flex flex-row items-center justify-between w-full p-3 rounded-xl border border-border bg-card/60">
            <div className="flex flex-col">
              <h6 className="text-xs font-bold">Đăng nhập Snapgram</h6>
              <span className="text-[11px] text-muted-foreground">
                Để xem thêm bài viết & tương tác
              </span>
            </div>
            <button
              type="button"
              onClick={openLoginModal}
              className="font-semibold text-xs text-primary hover:underline transition"
            >
              Đăng nhập
            </button>
          </div>
        ) : null}

        {/* Suggested for you */}
        {suggestions.length > 0 && (
          <div className="flex flex-col space-y-4">
            <div className="flex flex-row justify-between items-center">
              <h5 className="text-xs text-muted-foreground font-semibold">
                Gợi ý cho bạn
              </h5>
              <Link
                href="/explore"
                className="text-xs text-foreground font-semibold tracking-tight hover:text-muted-foreground duration-75 transition"
              >
                Xem tất cả
              </Link>
            </div>

            {suggestions.map((sug) => {
              const isFollowed = Boolean(followedMap[sug.username])
              return (
                <div
                  key={sug.id || sug.username}
                  className="flex flex-row justify-between items-center gap-2"
                >
                  <Link
                    href={`/u/${sug.username}`}
                    className="flex flex-row items-center gap-x-3 min-w-0 hover:opacity-85 transition"
                  >
                    <img
                      src={sug.avatarUrl || "/profile.jpg"}
                      alt={sug.username}
                      className="w-[38px] h-[38px] object-cover rounded-full border border-border shrink-0"
                    />
                    <div className="min-w-0">
                      <h6 className="text-xs font-semibold tracking-tight truncate">
                        {sug.username}
                      </h6>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {sug.displayName || "Gợi ý cho bạn"}
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(sug)}
                    className={`font-semibold text-xs transition duration-75 shrink-0 ${
                      isFollowed
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-blue-500 hover:opacity-80"
                    }`}
                  >
                    {isFollowed ? "Đang theo dõi" : "Theo dõi"}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-10">
        <div className="flex flex-col space-y-4">
          <ul className="flex flex-row flex-wrap gap-x-1">
            {siderightFooterLists.map((list, listIndex) => (
              <li
                key={list}
                className="cursor-pointer hover:underline text-muted-foreground text-xs"
              >
                {list}
                {listIndex !== siderightFooterLists.length - 1 ? " ·" : ""}
              </li>
            ))}
          </ul>

          <h6 className="text-muted-foreground text-xs uppercase">
            &copy; 2026 Snapgram
          </h6>
        </div>
      </footer>
    </aside>
  )
}

export default Sideright
