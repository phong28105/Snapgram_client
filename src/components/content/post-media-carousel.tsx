"use client"

import React, { useRef, useState } from "react"
import Link from "next/link"
import { safePoster } from "@/lib/media"
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Volume2,
  VolumeX,
} from "lucide-react"

export interface CarouselMediaItem {
  id?: string
  mediaUrl: string
  thumbnailUrl?: string
  mediaType?: "IMAGE" | "VIDEO" | string
}

interface PostMediaCarouselProps {
  items: CarouselMediaItem[]
  alt?: string
  className?: string
  aspectRatioClassName?: string
  onDoubleTap?: () => void
  showHeartPop?: boolean
  linkHref?: string
  objectFit?: "cover" | "contain"
}

export function PostMediaCarousel({
  items,
  alt = "Post media",
  className = "",
  aspectRatioClassName = "aspect-square",
  onDoubleTap,
  showHeartPop = false,
  linkHref,
  objectFit = "cover",
}: PostMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [loadedMediaMap, setLoadedMediaMap] = useState<Record<string, boolean>>({})
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const mediaList = items.length > 0 ? items : [{ mediaUrl: "/profile.jpg" }]
  const currentMedia = mediaList[currentIndex] || mediaList[0]

  const isVideo =
    currentMedia.mediaType === "VIDEO" ||
    currentMedia.mediaUrl.endsWith(".mp4") ||
    currentMedia.mediaUrl.endsWith(".mov") ||
    currentMedia.mediaUrl.endsWith(".webm")

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => Math.min(mediaList.length - 1, prev + 1))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mediaList.length <= 1) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      mediaList.length <= 1
    ) {
      return
    }
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null

    // Chỉ chuyển slide nếu vuốt ngang rõ rệt hơn vuốt dọc (tránh ngắt cuộn trang)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0 && currentIndex < mediaList.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else if (deltaX > 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1)
      }
    }
  }

  const handleToggleMute = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMuted((prev) => !prev)
  }

  const renderMedia = () => {
    if (isVideo) {
      return (
        <video
          key={currentMedia.mediaUrl}
          src={currentMedia.mediaUrl}
          poster={safePoster(currentMedia.thumbnailUrl, currentMedia.mediaUrl)}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          controls
          className={`w-full h-full ${
            objectFit === "contain" ? "object-contain" : "object-cover"
          }`}
        />
      )
    }

    const isLoaded = Boolean(loadedMediaMap[currentMedia.mediaUrl])

    const imgElement = (
      <div className="relative w-full h-full overflow-hidden bg-muted/40">
        {!isLoaded && (
          <div className="absolute inset-0 bg-muted/60 animate-pulse pointer-events-none" />
        )}
        <img
          src={currentMedia.mediaUrl}
          alt={`${alt} (${currentIndex + 1})`}
          loading="lazy"
          onLoad={() =>
            setLoadedMediaMap((prev) => ({
              ...prev,
              [currentMedia.mediaUrl]: true,
            }))
          }
          className={`w-full h-full ${
            objectFit === "contain" ? "object-contain" : "object-cover"
          } select-none transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    )

    if (linkHref) {
      return (
        <Link href={linkHref} scroll={false} className="w-full h-full block">
          {imgElement}
        </Link>
      )
    }

    return imgElement
  }

  return (
    <div
      className={`relative w-full ${aspectRatioClassName} rounded-md overflow-hidden bg-muted/40 select-none touch-pan-y ${className}`}
      onDoubleClick={onDoubleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Current media */}
      <div className="w-full h-full flex items-center justify-center">
        {renderMedia()}
      </div>

      {/* Double tap heart popup */}
      {showHeartPop && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-in fade-in zoom-in-50 duration-200">
          <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl animate-pulse" />
        </div>
      )}

      {/* Slide Badge 1/N */}
      {mediaList.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/70 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md z-10 pointer-events-none">
          {currentIndex + 1}/{mediaList.length}
        </div>
      )}

      {/* Video Mute Button if video */}
      {isVideo && (
        <button
          type="button"
          onClick={handleToggleMute}
          className="absolute bottom-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md z-10 transition"
          aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}

      {/* Left Navigation Arrow */}
      {mediaList.length > 1 && currentIndex > 0 && (
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-sm z-10 transition shadow-md"
          aria-label="Ảnh trước"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {mediaList.length > 1 && currentIndex < mediaList.length - 1 && (
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-sm z-10 transition shadow-md"
          aria-label="Ảnh sau"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Dots Indicator */}
      {mediaList.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
          {mediaList.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
