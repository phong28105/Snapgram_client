"use client"

import React, { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Heart, Pause, Play, Send, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface StoryItem {
  id: string
  username: string
  avatar: string
  media: string
  timeAgo: string
}

const mockStories: StoryItem[] = [
  {
    id: "s1",
    username: "alex_dev",
    avatar: "/profile.jpg",
    media: "/auth-image-1.webp",
    timeAgo: "2 giờ trước",
  },
  {
    id: "s2",
    username: "sarah_travel",
    avatar: "/profile.jpg",
    media: "/auth-image-2.webp",
    timeAgo: "4 giờ trước",
  },
  {
    id: "s3",
    username: "coffee_vibes",
    avatar: "/profile.jpg",
    media: "/profile.jpg",
    timeAgo: "6 giờ trước",
  },
  {
    id: "s4",
    username: "khoi_nguyen",
    avatar: "/profile.jpg",
    media: "/auth-image-1.webp",
    timeAgo: "8 giờ trước",
  },
  {
    id: "s5",
    username: "huyen_tran",
    avatar: "/profile.jpg",
    media: "/auth-image-2.webp",
    timeAgo: "11 giờ trước",
  },
  {
    id: "s6",
    username: "street_photo",
    avatar: "/profile.jpg",
    media: "/profile.jpg",
    timeAgo: "14 giờ trước",
  },
]

export default function Stories() {
  const { user } = useAuth()
  const containerRef = useRef<HTMLUListElement | null>(null)
  const [isAtStart, setIsAtStart] = useState(true)
  const [isAtEnd, setIsAtEnd] = useState(false)

  // Story Viewer Modal State
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [replyText, setReplyText] = useState("")

  const handleScroll = (type: "next" | "prev") => {
    if (!containerRef?.current) return
    containerRef.current.scrollBy({
      left: type === "next" ? 280 : -280,
      behavior: "smooth",
    })
  }

  const checkScrollPosition = () => {
    if (containerRef.current) {
      const container = containerRef.current
      setIsAtStart(container.scrollLeft <= 5)
      setIsAtEnd(container.scrollLeft + container.clientWidth >= container.scrollWidth - 5)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      checkScrollPosition()
      container.addEventListener("scroll", checkScrollPosition)
      return () => container.removeEventListener("scroll", checkScrollPosition)
    }
  }, [])

  // Auto-advance timer for story
  useEffect(() => {
    if (activeStoryIndex === null || isPaused) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < mockStories.length - 1) {
            setActiveStoryIndex((curr) => (curr !== null ? curr + 1 : null))
            return 0
          } else {
            setActiveStoryIndex(null)
            return 0
          }
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [activeStoryIndex, isPaused])

  const openStory = (index: number) => {
    setActiveStoryIndex(index)
    setProgress(0)
    setIsPaused(false)
  }

  const closeStory = () => {
    setActiveStoryIndex(null)
    setProgress(0)
  }

  const nextStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex < mockStories.length - 1) {
      setActiveStoryIndex((curr) => (curr !== null ? curr + 1 : null))
      setProgress(0)
    } else {
      closeStory()
    }
  }

  const prevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex((curr) => (curr !== null ? curr - 1 : null))
      setProgress(0)
    }
  }

  const activeStory = activeStoryIndex !== null ? mockStories[activeStoryIndex] : null

  return (
    <div className="relative w-full">
      {/* Scroll Controls */}
      {!isAtStart && (
        <button
          onClick={() => handleScroll("prev")}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background p-1 rounded-full text-foreground shadow-md transition"
          aria-label="Story trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {!isAtEnd && (
        <button
          onClick={() => handleScroll("next")}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background p-1 rounded-full text-foreground shadow-md transition"
          aria-label="Story tiếp theo"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Stories Horizontal Tray */}
      <ul
        ref={containerRef}
        className="w-full flex items-center gap-4 px-2 py-3 overflow-x-auto scrollbar-none whitespace-nowrap"
      >
        {/* Your Story item */}
        <li
          onClick={() => openStory(0)}
          className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group select-none"
        >
          <div className="relative p-[2px] rounded-full border border-dashed border-border group-hover:border-primary transition">
            <img
              src={user?.avatarUrl || "/profile.jpg"}
              alt="Tin của bạn"
              className="w-14 h-14 object-cover rounded-full bg-background p-0.5"
            />
          </div>
          <span className="text-[11px] font-normal tracking-tight truncate max-w-[64px]">
            Tin của bạn
          </span>
        </li>

        {/* Following Stories */}
        {mockStories.map((story, index) => (
          <li
            key={story.id}
            onClick={() => openStory(index)}
            className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer select-none group"
          >
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 transition group-hover:scale-105 duration-200">
              <img
                src={story.avatar}
                alt={story.username}
                className="w-14 h-14 object-cover rounded-full bg-background p-0.5"
              />
            </div>
            <span className="text-[11px] font-light tracking-tight truncate max-w-[64px]">
              {story.username}
            </span>
          </li>
        ))}
      </ul>

      {/* Story Viewer Dialog */}
      {activeStory && (
        <Dialog open onOpenChange={(open) => !open && closeStory()}>
          <DialogContent className="p-0 bg-transparent border-none max-w-sm sm:max-w-md h-[85vh] max-h-[720px] shadow-none flex items-center justify-center">
            <DialogTitle className="sr-only">Xem tin của {activeStory.username}</DialogTitle>

            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between">
              {/* Media Display */}
              <img
                src={activeStory.media}
                alt={activeStory.username}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Progress Bar & Header Overlay */}
              <div className="relative z-10 p-3 bg-gradient-to-b from-black/70 to-transparent space-y-2">
                {/* Progress Indicators */}
                <div className="flex items-center gap-1 w-full">
                  {mockStories.map((s, idx) => (
                    <div key={s.id} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-100 ease-linear"
                        style={{
                          width:
                            idx < activeStoryIndex!
                              ? "100%"
                              : idx === activeStoryIndex
                              ? `${progress}%`
                              : "0%",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Author Info Bar */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <img
                      src={activeStory.avatar}
                      alt={activeStory.username}
                      className="w-8 h-8 rounded-full object-cover border border-white/60 p-0.5"
                    />
                    <span className="font-semibold text-xs">{activeStory.username}</span>
                    <span className="text-[10px] text-white/70">{activeStory.timeAgo}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPaused((p) => !p)}
                      className="text-white/80 hover:text-white p-1"
                    >
                      {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
                    </button>
                    <button
                      type="button"
                      onClick={closeStory}
                      className="text-white/80 hover:text-white p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tap Left/Right Navigation overlay */}
              <div className="absolute inset-0 z-0 flex">
                <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
                <div className="w-2/3 h-full cursor-pointer" onClick={nextStory} />
              </div>

              {/* Bottom Reply Bar */}
              <div className="relative z-10 p-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Gửi tin nhắn cho ${activeStory.username}...`}
                  className="flex-1 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-xs text-white placeholder:text-white/60 border border-white/30 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && replyText.trim()) {
                      toast.success(`Đã gửi tin nhắn đến ${activeStory.username}`)
                      setReplyText("")
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Đã bày tỏ cảm xúc ❤️`)
                  }}
                  className="p-2 rounded-full hover:bg-white/20 text-white transition"
                >
                  <Heart className="w-6 h-6 hover:fill-rose-500 hover:text-rose-500 transition" />
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
