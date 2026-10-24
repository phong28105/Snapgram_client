"use client"

import React, { use, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Bookmark,
  ChevronLeft,
  Heart,
  MessageCircle,
  Music2,
  Play,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react"
import SnapgramLogo from "@/components/logo/SnapgramLogo"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { contentService } from "@/services/content.service"
import { safePoster } from "@/lib/media"
import { toast } from "sonner"
import type { PostResponse } from "@/types/content.type"

export default function ReelPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const reelId = resolvedParams?.id || "reel-1"

  const { user, isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [postData, setPostData] = useState<PostResponse | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowPending, setIsFollowPending] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const isRealUuid = !reelId.startsWith("reel-") && !reelId.startsWith("post-")

  const loadReel = useCallback(async () => {
    if (!isRealUuid) return
    try {
      const p = await contentService.getPost(reelId)
      setPostData(p)
      setIsLiked(Boolean(p.likedByMe))
      setLikesCount(p.likeCount ?? 0)
      setIsBookmarked(Boolean(p.savedByMe))

      if (isAuthenticated) {
        contentService
          .interactPost(reelId, { type: "VIEW", watchTimeRatio: 0.9 })
          .catch(() => {})

        // Nạp trạng thái follow thật thay vì mặc định false
        if (p.authorId) {
          contentService
            .getFollowStatus(p.authorId)
            .then((st) => setIsFollowing(Boolean(st.following)))
            .catch(() => {})
        }
      }
    } catch {
      // Fallback
    }
  }, [reelId, isRealUuid, isAuthenticated])

  useEffect(() => {
    loadReel()
  }, [loadReel])

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    action()
  }

  const handleToggleLike = () => {
    requireAuth(async () => {
      const prevLiked = isLiked
      const prevCount = likesCount
      const next = !isLiked
      setIsLiked(next)
      setLikesCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)))

      if (isRealUuid) {
        try {
          if (next) {
            await contentService.interactPost(reelId, { type: "LIKE" })
          } else {
            await contentService.unlikePost(reelId)
          }
        } catch {
          setIsLiked(prevLiked)
          setLikesCount(prevCount)
          toast.error("Không thể cập nhật lượt thích.")
        }
      }
    })
  }

  const handleToggleFollow = () => {
    requireAuth(async () => {
      const authorId = postData?.authorId
      if (!authorId || isFollowPending) return
      const wasFollowing = isFollowing
      const next = !wasFollowing
      setIsFollowing(next)
      setIsFollowPending(true)
      try {
        if (next) {
          await contentService.followUser(authorId)
        } else {
          await contentService.unfollowUser(authorId)
        }
      } catch {
        setIsFollowing(wasFollowing)
        toast.error(
          next ? "Không thể theo dõi người dùng này." : "Không thể bỏ theo dõi."
        )
      } finally {
        setIsFollowPending(false)
      }
    })
  }

  const handleToggleBookmark = () => {
    requireAuth(async () => {
      const prev = isBookmarked
      const next = !isBookmarked
      setIsBookmarked(next)
      if (isRealUuid) {
        try {
          if (next) {
            await contentService.savePost(reelId)
            toast.success("Đã lưu vào danh mục của bạn!")
          } else {
            await contentService.unsavePost(reelId)
            toast.success("Đã bỏ lưu Reel.")
          }
        } catch {
          setIsBookmarked(prev)
          toast.error("Không thể cập nhật trạng thái lưu.")
        }
      } else {
        toast.success(next ? "Đã lưu vào danh mục của bạn!" : "Đã bỏ lưu Reel.")
      }
    })
  }

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    if (isRealUuid && isAuthenticated) {
      contentService.interactPost(reelId, { type: "SHARE" }).catch(() => {})
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Snapgram Reel", url })
        return
      } catch {
        // huỷ -> fallback copy
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard && url) {
      navigator.clipboard.writeText(url).catch(() => {})
      toast.success("Đã sao chép liên kết Reel!")
    }
  }

  const authorName =
    postData?.authorId && user?.id === postData.authorId
      ? user.username
      : postData?.authorUsername || postData?.authorId || "street_vibes"
  const authorAvatar =
    postData?.authorId && user?.id === postData.authorId && user.avatarUrl
      ? user.avatarUrl
      : postData?.authorAvatarUrl || "/profile.jpg"
  const mediaUrl =
    postData?.mediaItems?.[0]?.mediaUrl ||
    postData?.mediaUrl ||
    "/auth-image-1.webp"
  const mediaPoster = safePoster(
    postData?.mediaItems?.[0]?.thumbnailUrl,
    mediaUrl
  )

  // Đồng bộ trạng thái play/pause của state với thẻ <video>
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (isPlaying) {
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [isPlaying, mediaUrl])

  const caption =
    postData?.caption ??
    `Nhịp sống về đêm qua ống kính góc rộng (${reelId}) 🌃✨ #snapgram #reels`

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border/60 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/reels"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Reels</span>
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <SnapgramLogo className="w-24 h-auto text-foreground" />
        </div>

        <div>
          {isAuthenticated ? (
            <span className="text-xs text-muted-foreground">@{user?.username}</span>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </header>

      {/* Main Reel Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="flex items-center gap-4">
          <div
            className="relative w-[340px] sm:w-[380px] h-[620px] sm:h-[680px] rounded-2xl overflow-hidden bg-black shadow-2xl flex items-center justify-center select-none"
            onDoubleClick={handleToggleLike}
          >
            <video
              ref={videoRef}
              src={mediaUrl}
              poster={mediaPoster}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
              onClick={() => setIsPlaying((p) => !p)}
            />

            {!isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                <div className="p-4 rounded-full bg-black/60 text-white backdrop-blur-sm">
                  <Play className="w-8 h-8 fill-white" />
                </div>
              </div>
            )}

            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white space-y-3 z-10">
              <div className="flex items-center gap-2.5">
                <Link href={`/u/${authorName}`}>
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="w-8 h-8 rounded-full object-cover border border-white/60 p-0.5"
                  />
                </Link>
                <Link href={`/u/${authorName}`} className="font-semibold text-xs hover:underline">
                  {authorName}
                </Link>
                {user?.username?.toLowerCase() !== authorName.toLowerCase() && (
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    disabled={isFollowPending}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition backdrop-blur-sm disabled:opacity-60 ${
                      isFollowing
                        ? "border-white/40 bg-white/15 text-white hover:bg-white/25"
                        : "border-white/40 text-white hover:bg-white/20"
                    }`}
                  >
                    {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                  </button>
                )}
              </div>
              <p className="text-xs leading-relaxed text-white/90">
                {caption}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-white/80">
                <Music2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Âm thanh gốc - {authorName}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 shrink-0 text-foreground">
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleToggleLike}
                className="p-3 rounded-full hover:bg-muted/80 active:scale-125 transition"
              >
                <Heart className={`w-7 h-7 ${isLiked ? "text-rose-500 fill-rose-500" : "text-foreground"}`} />
              </button>
              <span className="text-[11px] font-semibold">{likesCount.toLocaleString("vi-VN")}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <Link
                href={`/p/${reelId}`}
                className="p-3 rounded-full hover:bg-muted/80 transition"
              >
                <MessageCircle className="w-7 h-7 -rotate-90" />
              </Link>
              <span className="text-[11px] font-semibold">{(postData?.commentCount ?? 0).toLocaleString("vi-VN")}</span>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="p-3 rounded-full hover:bg-muted/80 transition"
            >
              <Send className="w-6 h-6 -rotate-12" />
            </button>

            <button
              type="button"
              onClick={handleToggleBookmark}
              className="p-3 rounded-full hover:bg-muted/80 transition"
            >
              <Bookmark className={`w-6 h-6 ${isBookmarked ? "fill-foreground" : ""}`} />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
