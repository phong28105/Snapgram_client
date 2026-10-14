"use client"

import React, { useState } from "react"
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
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
import { toast } from "sonner"

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
}

const mockReels: ReelItem[] = [
  {
    id: "reel-1",
    author: {
      username: "street_vibes",
      avatar: "/profile.jpg",
    },
    caption: "Nhịp sống về đêm qua ống kính góc rộng 🌃✨ #snapgram #reels #nightlife",
    audio: "Âm thanh gốc - street_vibes · Lo-fi Chill Beats",
    videoThumbnail: "/auth-image-1.webp",
    initialLikes: 14200,
    commentsCount: 382,
  },
  {
    id: "reel-2",
    author: {
      username: "travel_addict",
      avatar: "/profile.jpg",
    },
    caption: "Bình minh trên đỉnh Tà Xùa. Biển mây bồng bềnh tuyệt đẹp! ☁️🏔️",
    audio: "Âm thanh gốc - travel_addict · Acoustic Morning",
    videoThumbnail: "/auth-image-2.webp",
    initialLikes: 28900,
    commentsCount: 512,
  },
  {
    id: "reel-3",
    author: {
      username: "coffee_artisan",
      avatar: "/profile.jpg",
    },
    caption: "Quy trình pha một tách Latte Art hoàn hảo buổi sáng ☕🎨",
    audio: "Coffee House Vibes · Morning Jazz",
    videoThumbnail: "/profile.jpg",
    initialLikes: 9400,
    commentsCount: 124,
  },
]

export default function ReelsPage() {
  const { isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLikedMap, setIsLikedMap] = useState<Record<string, boolean>>({})
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>({})
  const [isBookmarkedMap, setIsBookmarkedMap] = useState<Record<string, boolean>>({})
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)

  const currentReel = mockReels[currentIndex]

  const handleToggleLike = (reelId: string, initialLikes: number) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }

    const currentLiked = isLikedMap[reelId] || false
    const currentLikes = likesCountMap[reelId] ?? initialLikes

    setIsLikedMap((prev) => ({ ...prev, [reelId]: !currentLiked }))
    setLikesCountMap((prev) => ({
      ...prev,
      [reelId]: currentLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
    }))
  }

  const handleToggleBookmark = (reelId: string) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    const currentBookmarked = isBookmarkedMap[reelId] || false
    setIsBookmarkedMap((prev) => ({ ...prev, [reelId]: !currentBookmarked }))
    if (!currentBookmarked) {
      toast.success("Đã lưu vào danh mục của bạn")
    }
  }

  const handleNext = () => {
    if (currentIndex < mockReels.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
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
                  <img
                    src={currentReel.author.avatar}
                    alt={currentReel.author.username}
                    className="w-8 h-8 rounded-full object-cover border border-white/60 p-0.5"
                  />
                  <span className="font-semibold text-xs tracking-tight">
                    {currentReel.author.username}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-semibold px-2.5 py-1 rounded-md border border-white/40 hover:bg-white/20 transition backdrop-blur-sm"
                  >
                    Theo dõi
                  </button>
                </div>
              </div>

              {/* Caption */}
              <p className="text-xs leading-relaxed line-clamp-2 text-white/90">
                {currentReel.caption}
              </p>

              {/* Audio ticker */}
              <div className="flex items-center gap-2 text-[11px] text-white/80">
                <Music2 className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                <span className="truncate">{currentReel.audio}</span>
              </div>
            </div>
          </div>

          {/* Right Action Column */}
          <div className="flex flex-col items-center gap-5 shrink-0 text-foreground pb-4">
            {/* Like */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => handleToggleLike(currentReel.id, currentReel.initialLikes)}
                className="p-3 rounded-full hover:bg-muted/80 active:scale-125 transition duration-150"
              >
                <Heart
                  className={`w-7 h-7 transition-colors ${
                    isLiked ? "text-rose-500 fill-rose-500" : "text-foreground"
                  }`}
                />
              </button>
              <span className="text-[11px] font-semibold">{likesCount.toLocaleString("vi-VN")}</span>
            </div>

            {/* Comment */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) openLoginModal()
                  else toast.info("Xem chi tiết bình luận cho reel này")
                }}
                className="p-3 rounded-full hover:bg-muted/80 transition"
              >
                <MessageCircle className="w-7 h-7 -rotate-90 text-foreground" />
              </button>
              <span className="text-[11px] font-semibold">{currentReel.commentsCount}</span>
            </div>

            {/* Share */}
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: currentReel.author.username,
                    url: window.location.href,
                  }).catch(() => {})
                } else {
                  toast.success("Đã sao chép liên kết bài viết!")
                }
              }}
              className="p-3 rounded-full hover:bg-muted/80 transition text-foreground"
            >
              <Send className="w-6 h-6 -rotate-12" />
            </button>

            {/* Bookmark */}
            <button
              type="button"
              onClick={() => handleToggleBookmark(currentReel.id)}
              className="p-3 rounded-full hover:bg-muted/80 transition"
            >
              <Bookmark
                className={`w-6 h-6 transition-colors ${
                  isBookmarked ? "text-foreground fill-foreground" : "text-foreground"
                }`}
              />
            </button>

            {/* Navigation Up / Down buttons */}
            <div className="flex flex-col gap-1 pt-2">
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
                disabled={currentIndex === mockReels.length - 1}
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
