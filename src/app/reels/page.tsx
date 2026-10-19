"use client"

import React, { useCallback, useEffect, useState } from "react"
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
import { toast } from "sonner"
import type { PostResponse } from "@/types/content.type"

interface ReelItem {
  id: string
  author: {
    username: string
    avatar: string
  }
  caption: string
  audio: string
  videoThumbnail: string
  initialLikes: number
  commentsCount: number
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
    : `user_${(p.authorId || "snap").slice(0, 6)}`
  const avatar = isMe && currentAvatar ? currentAvatar : "/profile.jpg"
  const mediaUrl =
    p.mediaItems?.[0]?.mediaUrl || p.mediaUrl || "/auth-image-1.webp"

  return {
    id: p.id,
    author: {
      username,
      avatar,
    },
    caption: p.caption || "Khoảnh khắc thước phim Snapgram 🎬",
    audio: `Âm thanh gốc - ${username}`,
    videoThumbnail: mediaUrl,
    initialLikes: p.likeCount ?? 0,
    commentsCount: p.commentCount ?? 0,
    isReal: true,
  }
}

export default function ReelsPage() {
  const { user, isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [reels, setReels] = useState<ReelItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLikedMap, setIsLikedMap] = useState<Record<string, boolean>>({})
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>({})
  const [isBookmarkedMap, setIsBookmarkedMap] = useState<Record<string, boolean>>({})
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)

  const loadReelsFromApi = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await contentService.getExplorePosts(0, 30)
      const items = res.content || []
      const reelPosts = items.filter((p) => p.contentType === "REEL")
      const listToUse = reelPosts.length > 0 ? reelPosts : items
      if (listToUse.length > 0) {
        const mapped = listToUse.map((p) =>
          mapPostToReelItem(p, user?.id, user?.username, user?.avatarUrl)
        )
        setReels(mapped)
      } else {
        setReels([])
      }
    } catch {
      setReels([])
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, user?.username, user?.avatarUrl])

  useEffect(() => {
    loadReelsFromApi()
  }, [loadReelsFromApi])

  const currentReel = reels[currentIndex]

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

    if (currentReel?.isReal) {
      try {
        if (nextLiked) {
          await contentService.interactPost(reelId, { type: "LIKE" })
        } else {
          await contentService.unlikePost(reelId)
        }
      } catch {
        // Keep optimistic
      }
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

    if (currentReel?.isReal) {
      try {
        if (nextSaved) {
          await contentService.savePost(reelId)
          await contentService.interactPost(reelId, { type: "SAVE" }).catch(() => {})
          toast.success("Đã lưu vào danh mục của bạn!")
        } else {
          await contentService.unsavePost(reelId)
          toast.success("Đã bỏ lưu Reel.")
        }
      } catch {
        // Keep optimistic
      }
    } else {
      toast.success(nextSaved ? "Đã lưu vào danh mục của bạn!" : "Đã bỏ lưu Reel.")
    }
  }

  const handleShareReel = (reelId: string) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/reel/${reelId}` : ""
    if (currentReel?.isReal && isAuthenticated) {
      contentService.interactPost(reelId, { type: "SHARE" }).catch(() => {})
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
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
            <img
              src={currentReel.videoThumbnail}
              alt={currentReel.caption}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              onClick={() => setIsPlaying((p) => !p)}
            />

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
                  {user?.username?.toLowerCase() !== currentReel.author.username?.toLowerCase() && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) openLoginModal()
                      }}
                      className="text-xs font-semibold px-3 py-1 rounded-md border border-white/40 hover:bg-white/20 transition backdrop-blur-sm"
                    >
                      Theo dõi
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

            {/* Comment Button (links to /p/[id]) */}
            <div className="flex flex-col items-center gap-1">
              <Link
                href={`/p/${currentReel.id}`}
                className="p-3 rounded-full hover:bg-muted/80 transition"
                aria-label="Xem bình luận"
              >
                <MessageCircle className="w-7 h-7 -rotate-90 text-foreground" />
              </Link>
              <span className="text-[11px] font-semibold">
                {currentReel.commentsCount.toLocaleString("vi-VN")}
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
        </div>

        <Navbot />
      </div>
    </div>
  )
}
