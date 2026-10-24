"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Film,
  Heart,
  MessageCircle,
  Music2,
  Play,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react"
import Sidebar from "@/app/(home)/_components/sidebar"
import Navbot from "@/app/(home)/_components/navbot"
import Navbar from "@/app/(home)/_components/navbar"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { contentService } from "@/services/content.service"
import { CommentPanel } from "@/components/content/comment-panel"
import { safePoster } from "@/lib/media"
import { toast } from "sonner"
import type { PostResponse } from "@/types/content.type"

/** Số reel tải mỗi lần (lazy load) */
const REELS_PAGE_SIZE = 6

interface ReelItem {  id: string
  authorId?: string
  author: {
    username: string
    avatar: string
  }
  caption: string
  audio: string
  videoThumbnail: string
  videoUrl: string
  initialLikes: number
  commentsCount: number
  likedByMe: boolean
  savedByMe: boolean
  isReal?: boolean
}

function mapPostToReelItem(
  p: PostResponse,
  currentUserId?: string,
  currentUsername?: string,
  currentAvatar?: string
): ReelItem {
  const isMe = Boolean(currentUserId && p.authorId === currentUserId)
  const username = isMe
    ? currentUsername || "me"
    : p.authorUsername || p.authorId || "snapgram_user"
  const avatar = isMe && currentAvatar
    ? currentAvatar
    : p.authorAvatarUrl || "/profile.jpg"
  const rawMediaUrl = p.mediaItems?.[0]?.mediaUrl || p.mediaUrl || ""
  const rawThumb = p.mediaItems?.[0]?.thumbnailUrl
  const poster = safePoster(rawThumb, rawMediaUrl)
  const mediaUrl = rawMediaUrl || "/auth-image-1.webp"

  return {
    id: p.id,
    authorId: p.authorId,
    author: {
      username,
      avatar,
    },
    caption: p.caption || "Khoảnh khắc thước phim Snapgram 🎬",
    audio: `Âm thanh gốc - ${username}`,
    videoThumbnail: poster ?? "",
    videoUrl: mediaUrl,
    initialLikes: p.likeCount ?? 0,
    commentsCount: p.commentCount ?? 0,
    likedByMe: Boolean(p.likedByMe),
    savedByMe: Boolean(p.savedByMe),
    isReal: true,
  }
}

export default function ReelsPage() {
  const { user, isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [reels, setReels] = useState<ReelItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isLikedMap, setIsLikedMap] = useState<Record<string, boolean>>({})
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>({})
  const [isBookmarkedMap, setIsBookmarkedMap] = useState<Record<string, boolean>>({})
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({})
  const [pendingFollow, setPendingFollow] = useState<Record<string, boolean>>({})
  const [commentsCountMap, setCommentsCountMap] = useState<Record<string, number>>({})
  const [showComments, setShowComments] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)

  const loadReelsFromApi = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await contentService.getReels(0, REELS_PAGE_SIZE)
      const items = res.content || []
      if (items.length > 0) {
        const mapped = items.map((p) =>
          mapPostToReelItem(p, user?.id, user?.username, user?.avatarUrl)
        )
        setReels(mapped)
        setPage(0)
        setHasMore(!res.last && (res.totalPages ?? 1) > 1)

        // Khởi tạo state từ dữ liệu server (trước đây luôn reset về false)
        setIsLikedMap(Object.fromEntries(mapped.map((r) => [r.id, r.likedByMe])))
        setLikesCountMap(Object.fromEntries(mapped.map((r) => [r.id, r.initialLikes])))
        setIsBookmarkedMap(Object.fromEntries(mapped.map((r) => [r.id, r.savedByMe])))
        setCommentsCountMap(
          Object.fromEntries(mapped.map((r) => [r.id, r.commentsCount]))
        )

        // Nạp trạng thái follow cho từng tác giả (chỉ khi đã đăng nhập)
        const authorIds = Array.from(
          new Set(mapped.map((r) => r.authorId).filter(Boolean))
        ) as string[]
        if (isAuthenticated && authorIds.length > 0) {
          const entries = await Promise.all(
            authorIds.map(async (authorId) => {
              try {
                const st = await contentService.getFollowStatus(authorId)
                return [authorId, Boolean(st.following)] as const
              } catch {
                return [authorId, false] as const
              }
            })
          )
          setFollowMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
        }
      } else {
        setReels([])
        setHasMore(false)
      }
    } catch {
      setReels([])
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, user?.username, user?.avatarUrl, isAuthenticated])

  /**
   * Tải thêm reel khi người dùng tới gần cuối danh sách (lazy load).
   * Mỗi lần chỉ lấy thêm REELS_PAGE_SIZE reel để không chặn UI.
   */
  const loadMoreReels = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const nextPage = page + 1
    try {
      const res = await contentService.getReels(nextPage, REELS_PAGE_SIZE)
      const items = res.content || []
      if (items.length > 0) {
        const mapped = items.map((p) =>
          mapPostToReelItem(p, user?.id, user?.username, user?.avatarUrl)
        )
        setReels((prev) => [...prev, ...mapped])
        setIsLikedMap((prev) => ({
          ...prev,
          ...Object.fromEntries(mapped.map((r) => [r.id, r.likedByMe])),
        }))
        setLikesCountMap((prev) => ({
          ...prev,
          ...Object.fromEntries(mapped.map((r) => [r.id, r.initialLikes])),
        }))
        setIsBookmarkedMap((prev) => ({
          ...prev,
          ...Object.fromEntries(mapped.map((r) => [r.id, r.savedByMe])),
        }))
        setCommentsCountMap((prev) => ({
          ...prev,
          ...Object.fromEntries(mapped.map((r) => [r.id, r.commentsCount])),
        }))
        setPage(nextPage)

        if (isAuthenticated) {
          const authorIds = Array.from(
            new Set(mapped.map((r) => r.authorId).filter(Boolean))
          ) as string[]
          const missing = authorIds.filter((id) => !(id in followMap))
          if (missing.length > 0) {
            const entries = await Promise.all(
              missing.map(async (authorId) => {
                try {
                  const st = await contentService.getFollowStatus(authorId)
                  return [authorId, Boolean(st.following)] as const
                } catch {
                  return [authorId, false] as const
                }
              })
            )
            setFollowMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
          }
        }
      }
      setHasMore(!res.last && items.length > 0)
    } catch {
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [
    isLoadingMore,
    hasMore,
    page,
    user?.id,
    user?.username,
    user?.avatarUrl,
    isAuthenticated,
    followMap,
  ])

  useEffect(() => {
    loadReelsFromApi()
  }, [loadReelsFromApi])

  const currentReel = reels[currentIndex]

  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isPlaying, currentReel?.id])

  // Gửi VIEW interaction khi chuyển đến reel mới
  useEffect(() => {
    if (currentReel?.isReal && isAuthenticated) {
      contentService
        .interactPost(currentReel.id, { type: "VIEW", watchTimeRatio: 0.9 })
        .catch(() => {})
    }
  }, [currentReel?.id, currentReel?.isReal, isAuthenticated])

  const handleToggleLike = async (reelId: string, initialLikes: number) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }

    const currentLiked = isLikedMap[reelId] || false
    const currentLikes = likesCountMap[reelId] ?? initialLikes

    const nextLiked = !currentLiked
    setIsLikedMap((prev) => ({ ...prev, [reelId]: nextLiked }))
    setLikesCountMap((prev) => ({
      ...prev,
      [reelId]: nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
    }))

    try {
      if (nextLiked) {
        await contentService.interactPost(reelId, { type: "LIKE" })
      } else {
        await contentService.unlikePost(reelId)
      }
    } catch {
      // Revert khi API lỗi để UI không lệch server
      setIsLikedMap((prev) => ({ ...prev, [reelId]: currentLiked }))
      setLikesCountMap((prev) => ({ ...prev, [reelId]: currentLikes }))
      toast.error("Không thể cập nhật lượt thích.")
    }
  }

  const handleToggleFollow = async (authorId?: string) => {
    if (!authorId) return
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    if (pendingFollow[authorId]) return

    const wasFollowing = followMap[authorId] || false
    const next = !wasFollowing
    setFollowMap((prev) => ({ ...prev, [authorId]: next }))
    setPendingFollow((prev) => ({ ...prev, [authorId]: true }))

    try {
      if (next) {
        await contentService.followUser(authorId)
      } else {
        await contentService.unfollowUser(authorId)
      }
    } catch {
      setFollowMap((prev) => ({ ...prev, [authorId]: wasFollowing }))
      toast.error(
        next ? "Không thể theo dõi người dùng này." : "Không thể bỏ theo dõi."
      )
    } finally {
      setPendingFollow((prev) => ({ ...prev, [authorId]: false }))
    }
  }

  const handleToggleBookmark = async (reelId: string) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    const currentBookmarked = isBookmarkedMap[reelId] || false
    const nextSaved = !currentBookmarked
    setIsBookmarkedMap((prev) => ({ ...prev, [reelId]: nextSaved }))

    try {
      if (nextSaved) {
        await contentService.savePost(reelId)
        contentService.interactPost(reelId, { type: "SAVE" }).catch(() => {})
        toast.success("Đã lưu vào danh mục của bạn!")
      } else {
        await contentService.unsavePost(reelId)
        toast.success("Đã bỏ lưu Reel.")
      }
    } catch {
      setIsBookmarkedMap((prev) => ({ ...prev, [reelId]: currentBookmarked }))
      toast.error("Không thể cập nhật trạng thái lưu.")
    }
  }

  const handleShareReel = async (reelId: string) => {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/reel/${reelId}` : ""
    if (isAuthenticated) {
      contentService.interactPost(reelId, { type: "SHARE" }).catch(() => {})
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Snapgram Reel", url })
        return
      } catch {
        // Người dùng huỷ chia sẻ -> fallback copy
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard && url) {
      navigator.clipboard.writeText(url).catch(() => {})
      toast.success("Đã sao chép liên kết Reel!")
    }
  }

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  // Lazy load: khi còn cách cuối danh sách 2 reel thì tải thêm
  useEffect(() => {
    if (!isLoading && hasMore && currentIndex >= reels.length - 2) {
      loadMoreReels()
    }
  }, [currentIndex, reels.length, hasMore, isLoading, loadMoreReels])

  // Điều hướng bằng bàn phím (↑/↓ hoặc j/k)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return
      if ((e.key === "ArrowDown" || e.key === "j") && currentIndex < reels.length - 1) {
        e.preventDefault()
        setCurrentIndex((prev) => prev + 1)
      } else if ((e.key === "ArrowUp" || e.key === "k") && currentIndex > 0) {
        e.preventDefault()
        setCurrentIndex((prev) => prev - 1)
      } else if (e.key === "m") {
        setIsMuted((m) => !m)
      } else if (e.key === " ") {
        e.preventDefault()
        setIsPlaying((p) => !p)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [currentIndex, reels.length])

  // Đồng bộ lại like/comment/save khi quay lại tab (ví dụ vừa comment ở trang khác)
  useEffect(() => {
    const syncCurrentReel = async () => {
      const reel = reels[currentIndex]
      if (!reel?.isReal) return
      try {
        const p = await contentService.getPost(reel.id)
        setIsLikedMap((prev) => ({ ...prev, [reel.id]: Boolean(p.likedByMe) }))
        setLikesCountMap((prev) => ({ ...prev, [reel.id]: p.likeCount ?? 0 }))
        setIsBookmarkedMap((prev) => ({ ...prev, [reel.id]: Boolean(p.savedByMe) }))
        setCommentsCountMap((prev) => ({ ...prev, [reel.id]: p.commentCount ?? 0 }))
      } catch {
        // bỏ qua, giữ số liệu hiện tại
      }
    }
    const onFocus = () => {
      if (document.visibilityState === "visible") syncCurrentReel()
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [currentIndex, reels])

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 py-4 px-2 sm:px-4">
          <Navbar />
          <div className="relative w-[340px] sm:w-[380px] h-[640px] sm:h-[720px] rounded-2xl bg-muted animate-pulse my-auto flex items-center justify-center">
            <Film className="w-12 h-12 text-muted-foreground/40 animate-pulse" />
          </div>
          <Navbot />
        </div>
      </div>
    )
  }

  if (!currentReel) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 py-4 px-2 sm:px-4">
          <Navbar />
          <div className="text-center space-y-4 my-auto px-4">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mx-auto text-muted-foreground">
              <Film className="w-8 h-8 opacity-70" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Chưa có Thước phim nào
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Hiện tại chưa có thước phim nào được tải lên. Hãy là người đầu tiên chia sẻ thước phim của bạn!
              </p>
            </div>
          </div>
          <Navbot />
        </div>
      </div>
    )
  }

  const isLiked = isLikedMap[currentReel.id] || false
  const likesCount = likesCountMap[currentReel.id] ?? currentReel.initialLikes
  const isBookmarked = isBookmarkedMap[currentReel.id] || false
  const commentsCount =
    commentsCountMap[currentReel.id] ?? currentReel.commentsCount
  const isOwnReel = Boolean(user?.id && currentReel.authorId === user.id)
  const isFollowingAuthor = Boolean(
    currentReel.authorId && followMap[currentReel.authorId]
  )
  const isFollowPending = Boolean(
    currentReel.authorId && pendingFollow[currentReel.authorId]
  )

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Reels Container */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 py-4 px-2 sm:px-4">
        <Navbar />

        <div className="flex items-center gap-4 my-auto">
          {/* Reel Video Card */}
          <div className="relative w-[340px] sm:w-[380px] h-[640px] sm:h-[720px] rounded-2xl overflow-hidden bg-black shadow-2xl flex items-center justify-center select-none group">
            {/* Visual Media Background */}
            <video
              key={currentReel.id}
              ref={videoRef}
              src={currentReel.videoUrl}
              poster={currentReel.videoThumbnail || undefined}
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              onClick={() => setIsPlaying((p) => !p)}
            />

            {/* Preload metadata của reel kế tiếp để chuyển reel mượt hơn */}
            {reels[currentIndex + 1] && (
              <video
                key={`pre-${reels[currentIndex + 1].id}`}
                src={reels[currentIndex + 1].videoUrl}
                preload="metadata"
                muted
                playsInline
                className="hidden"
                aria-hidden
              />
            )}

            {/* Play/Pause Center Indicator */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                <div className="p-4 rounded-full bg-black/60 text-white backdrop-blur-sm animate-in zoom-in-75 duration-150">
                  <Play className="w-8 h-8 fill-white" />
                </div>
              </div>
            )}

            {/* Top Bar inside Reel */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                aria-label="Bật/Tắt âm thanh"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Bottom Overlay: Author & Caption */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white space-y-3 z-10">
              {/* Author Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Link href={`/u/${currentReel.author.username}`}>
                    <img
                      src={currentReel.author.avatar}
                      alt={currentReel.author.username}
                      className="w-8 h-8 rounded-full object-cover border border-white/60 p-0.5"
                    />
                  </Link>
                  <Link
                    href={`/u/${currentReel.author.username}`}
                    className="font-semibold text-xs tracking-tight hover:underline"
                  >
                    {currentReel.author.username}
                  </Link>
                  {!isOwnReel && (
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(currentReel.authorId)}
                      disabled={isFollowPending}
                      className={`text-xs font-semibold px-3 py-1 rounded-md border transition backdrop-blur-sm disabled:opacity-60 ${
                        isFollowingAuthor
                          ? "border-white/40 bg-white/15 text-white hover:bg-white/25"
                          : "border-white/40 text-white hover:bg-white/20"
                      }`}
                    >
                      {isFollowingAuthor ? "Đang theo dõi" : "Theo dõi"}
                    </button>
                  )}
                </div>
              </div>

              {/* Caption */}
              <p className="text-xs leading-relaxed text-white/90 line-clamp-2">
                {currentReel.caption}
              </p>

              {/* Audio Label */}
              <div className="flex items-center gap-2 text-[11px] text-white/80">
                <Music2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{currentReel.audio}</span>
              </div>
            </div>
          </div>

          {/* Reel Interaction Buttons (Floating beside the card) */}
          <div className="flex flex-col items-center gap-5 shrink-0 text-foreground">
            {/* Like Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => handleToggleLike(currentReel.id, currentReel.initialLikes)}
                className="p-3 rounded-full hover:bg-muted/80 active:scale-125 transition duration-150"
                aria-label="Thích thước phim"
              >
                <Heart
                  className={`w-7 h-7 transition-colors ${
                    isLiked ? "text-rose-500 fill-rose-500" : "text-foreground"
                  }`}
                />
              </button>
              <span className="text-[11px] font-semibold">
                {likesCount.toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Comment Button (mở panel bình luận ngay trong reel) */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => setShowComments((v) => !v)}
                className={`p-3 rounded-full transition ${
                  showComments ? "bg-muted" : "hover:bg-muted/80"
                }`}
                aria-label="Xem bình luận"
                aria-expanded={showComments}
              >
                <MessageCircle className="w-7 h-7 -rotate-90 text-foreground" />
              </button>
              <span className="text-[11px] font-semibold">
                {commentsCount.toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Share Button */}
            <button
              type="button"
              onClick={() => handleShareReel(currentReel.id)}
              className="p-3 rounded-full hover:bg-muted/80 transition"
              aria-label="Chia sẻ thước phim"
            >
              <Send className="w-6 h-6 -rotate-12 text-foreground" />
            </button>

            {/* Bookmark Button */}
            <button
              type="button"
              onClick={() => handleToggleBookmark(currentReel.id)}
              className="p-3 rounded-full hover:bg-muted/80 transition"
              aria-label="Lưu thước phim"
            >
              <Bookmark
                className={`w-6 h-6 transition-colors ${
                  isBookmarked ? "text-foreground fill-foreground" : "text-foreground"
                }`}
              />
            </button>

            {/* Navigation Up/Down */}
            <div className="flex flex-col gap-1 border-t border-border pt-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="p-2 rounded-full hover:bg-muted disabled:opacity-30 transition"
                aria-label="Reel trước"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                type="button"
                disabled={currentIndex === reels.length - 1}
                onClick={handleNext}
                className="p-2 rounded-full hover:bg-muted disabled:opacity-30 transition"
                aria-label="Reel tiếp theo"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Panel bình luận: cột phải trên desktop, bottom sheet trên mobile */}
          {showComments && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setShowComments(false)}
                aria-hidden
              />
              <CommentPanel
                key={currentReel.id}
                postId={currentReel.id}
                postAuthorId={currentReel.authorId}
                initialCount={commentsCount}
                onCountChange={(next) =>
                  setCommentsCountMap((prev) => ({
                    ...prev,
                    [currentReel.id]: next,
                  }))
                }
                onClose={() => setShowComments(false)}
                className="fixed inset-x-0 bottom-0 z-50 h-[65vh] rounded-t-2xl lg:static lg:inset-auto lg:z-auto lg:h-[640px] sm:lg:h-[720px] lg:w-[340px] lg:rounded-2xl"
              />
            </>
          )}
        </div>

        <Navbot />
      </div>
    </div>
  )
}
