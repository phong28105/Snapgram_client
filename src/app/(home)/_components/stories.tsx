"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Loader2,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { contentService } from "@/services/content.service"
import { userService } from "@/services/user.service"
import { mediaService } from "@/services/media.service"
import { getErrorMessage } from "@/lib/api"
import { toast } from "sonner"
import type { ContentVisibility, StoryViewerResponse } from "@/types/content.type"
import type { UserProfileResponse } from "@/types/user.type"

interface StoryItem {
  id: string
  authorId?: string
  username: string
  avatar: string
  media: string
  mediaType?: string
  caption?: string
  timeAgo: string
  viewedByMe?: boolean
  isReal?: boolean
}

export default function Stories() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { openLoginModal } = useLoginModal()

  const containerRef = useRef<HTMLUListElement | null>(null)
  const storyFileInputRef = useRef<HTMLInputElement | null>(null)

  const [stories, setStories] = useState<StoryItem[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(true)
  const [isAtStart, setIsAtStart] = useState(true)
  const [isAtEnd, setIsAtEnd] = useState(false)

  // Story Viewer Modal State
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [replyText, setReplyText] = useState("")

  // Create Story Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [storyFile, setStoryFile] = useState<File | null>(null)
  const [storyPreview, setStoryPreview] = useState<string | null>(null)
  const [storyCaption, setStoryCaption] = useState("")
  const [storyVisibility, setStoryVisibility] = useState<ContentVisibility>("PUBLIC")
  const [isUploadingStory, setIsUploadingStory] = useState(false)

  // Story Viewers Modal State
  const [isViewersOpen, setIsViewersOpen] = useState(false)
  const [viewers, setViewers] = useState<StoryViewerResponse[]>([])
  const [viewerProfileMap, setViewerProfileMap] = useState<Record<string, UserProfileResponse>>({})
  const [isLoadingViewers, setIsLoadingViewers] = useState(false)

  const loadStoryFeed = useCallback(async () => {
    setIsLoadingStories(true)
    try {
      const res = await contentService.getStoryFeed(0, 20)
      if (res.content && res.content.length > 0) {
        const mapped: StoryItem[] = res.content.map((s) => ({
          id: s.id,
          authorId: s.authorId,
          username:
            s.authorId === user?.id
              ? user?.username || "Tin của bạn"
              : s.authorUsername || s.authorId || "Người dùng",
          avatar:
            s.authorId === user?.id && user?.avatarUrl
              ? user.avatarUrl
              : s.authorAvatarUrl || "/profile.jpg",
          media: s.mediaUrl || "/auth-image-1.webp",
          mediaType: s.mediaType,
          caption: s.caption,
          timeAgo: "Mới đây",
          viewedByMe: s.viewedByMe,
          isReal: true,
        }))
        setStories(mapped)
      } else {
        setStories([])
      }
    } catch {
      setStories([])
    } finally {
      setIsLoadingStories(false)
    }
  }, [user?.id, user?.username, user?.avatarUrl])

  useEffect(() => {
    if (!authLoading) {
      loadStoryFeed()
    }
  }, [authLoading, loadStoryFeed])

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
      setIsAtEnd(
        container.scrollLeft + container.clientWidth >= container.scrollWidth - 5
      )
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
    if (activeStoryIndex === null || isPaused || isViewersOpen) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < stories.length - 1) {
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
  }, [activeStoryIndex, isPaused, isViewersOpen, stories.length])

  const openStory = (index: number) => {
    setActiveStoryIndex(index)
    setProgress(0)
    setIsPaused(false)
    const target = stories[index]
    if (target?.isReal && isAuthenticated) {
      contentService.viewStory(target.id).catch(() => {})
      setStories((prev) =>
        prev.map((s, idx) => (idx === index ? { ...s, viewedByMe: true } : s))
      )
    }
  }

  const closeStory = () => {
    setActiveStoryIndex(null)
    setProgress(0)
    setIsViewersOpen(false)
  }

  const nextStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
      openStory(activeStoryIndex + 1)
    } else {
      closeStory()
    }
  }

  const prevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      openStory(activeStoryIndex - 1)
    }
  }

  const handleOpenCreateStory = () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    setIsCreateOpen(true)
  }

  const handleStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStoryFile(file)
    setStoryPreview(URL.createObjectURL(file))
  }

  const handlePublishStory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storyFile || !storyPreview) return

    setIsUploadingStory(true)
    try {
      const isVideo = storyFile.type.startsWith("video/")
      const mediaRes =
        storyFile.size > 5 * 1024 * 1024 || isVideo
          ? await mediaService.uploadViaPresigned(storyFile)
          : await mediaService.upload(storyFile)

      const created = await contentService.createStory({
        mediaId: mediaRes.id,
        mediaUrl: mediaRes.url || storyPreview,
        mediaType: isVideo ? "VIDEO" : "IMAGE",
        caption: storyCaption.trim() || undefined,
        visibility: storyVisibility,
      })

      const newStoryItem: StoryItem = {
        id: created.id,
        authorId: created.authorId || user?.id,
        username: user?.username || "Tin của bạn",
        avatar: user?.avatarUrl || "/profile.jpg",
        media: created.mediaUrl || mediaRes.url || storyPreview,
        mediaType: created.mediaType,
        caption: created.caption,
        timeAgo: "Vừa xong",
        viewedByMe: true,
        isReal: true,
      }

      setStories((prev) => [newStoryItem, ...prev])
      toast.success("Đã đăng tin (Story) thành công!")
      setIsCreateOpen(false)
      setStoryFile(null)
      setStoryPreview(null)
      setStoryCaption("")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể đăng Story."))
    } finally {
      setIsUploadingStory(false)
    }
  }

  const handleDeleteStory = async (storyId: string) => {
    try {
      await contentService.deleteStory(storyId)
      setStories((prev) => prev.filter((s) => s.id !== storyId))
      closeStory()
      toast.success("Đã xóa tin của bạn.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa tin này."))
    }
  }

  const handleOpenViewers = async (storyId: string) => {
    setIsPaused(true)
    setIsViewersOpen(true)
    setIsLoadingViewers(true)
    try {
      const res = await contentService.getStoryViewers(storyId, 0, 30)
      const list = res.content || []
      setViewers(list)

      const viewerIds = Array.from(new Set(list.map((v) => v.viewerId).filter(Boolean)))
      if (viewerIds.length > 0) {
        try {
          const profiles = await userService.getUsersBatch(viewerIds)
          const pMap: Record<string, UserProfileResponse> = {}
          profiles.forEach((p) => {
            pMap[p.id] = p
          })
          setViewerProfileMap((prev) => ({ ...prev, ...pMap }))
        } catch {
          // Ignore
        }
      }
    } catch {
      setViewers([])
    } finally {
      setIsLoadingViewers(false)
    }
  }

  const activeStory =
    activeStoryIndex !== null ? stories[activeStoryIndex] : null
  const isMyActiveStory = Boolean(
    activeStory?.isReal &&
      user?.id &&
      activeStory.authorId === user.id
  )

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
        {/* Add Your Story button */}
        <li
          onClick={handleOpenCreateStory}
          className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group select-none"
        >
          <div className="relative p-[2px] rounded-full border border-dashed border-border group-hover:border-primary transition">
            <img
              src={user?.avatarUrl || "/profile.jpg"}
              alt="Tin của bạn"
              className="w-14 h-14 object-cover rounded-full bg-background p-0.5"
            />
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background shadow">
              <Plus className="w-3 h-3" />
            </span>
          </div>
          <span className="text-[11px] font-normal tracking-tight truncate max-w-[64px]">
            Tin của bạn
          </span>
        </li>

        {/* Story Feed Items */}
        {authLoading || isLoadingStories ? (
          Array.from({ length: 5 }).map((_, i) => (
            <li
              key={`story-skel-${i}`}
              className="shrink-0 flex flex-col items-center gap-1.5 animate-pulse select-none"
            >
              <div className="w-[62px] h-[62px] rounded-full bg-muted/70 p-[2px]" />
              <div className="h-2.5 w-12 bg-muted/60 rounded" />
            </li>
          ))
        ) : (
          stories.map((story, index) => (
            <li
              key={story.id}
              onClick={() => openStory(index)}
              className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer select-none group"
            >
              <div
                className={`p-[2px] rounded-full transition group-hover:scale-105 duration-200 ${
                  story.viewedByMe
                    ? "bg-border"
                    : "bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600"
                }`}
              >
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
          ))
        )}
      </ul>

      {/* Story Viewer Dialog */}
      {activeStory && (
        <Dialog open onOpenChange={(open) => !open && closeStory()}>
          <DialogContent className="p-0 bg-transparent border-none max-w-sm sm:max-w-md h-[85vh] max-h-[720px] shadow-none flex items-center justify-center">
            <DialogTitle className="sr-only">
              Xem tin của {activeStory.username}
            </DialogTitle>

            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between">
              {/* Media Display */}
              {activeStory.mediaType === "VIDEO" ? (
                <video
                  src={activeStory.media}
                  autoPlay
                  playsInline
                  muted={false}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeStory.media}
                  alt={activeStory.username}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Progress Bar & Header Overlay */}
              <div className="relative z-10 p-3 bg-gradient-to-b from-black/70 to-transparent space-y-2">
                {/* Progress Indicators */}
                <div className="flex items-center gap-1 w-full">
                  {stories.map((s, idx) => (
                    <div
                      key={s.id}
                      className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden"
                    >
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
                    <span className="font-semibold text-xs">
                      {activeStory.username}
                    </span>
                    <span className="text-[10px] text-white/70">
                      {activeStory.timeAgo}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isMyActiveStory && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenViewers(activeStory.id)}
                          title="Danh sách người xem"
                          className="text-white/85 hover:text-white p-1"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStory(activeStory.id)}
                          title="Xóa tin này"
                          className="text-white/85 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsPaused((p) => !p)}
                      className="text-white/80 hover:text-white p-1"
                    >
                      {isPaused ? (
                        <Play className="w-4 h-4 fill-white" />
                      ) : (
                        <Pause className="w-4 h-4 fill-white" />
                      )}
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

              {/* Caption & Bottom Reply Bar */}
              <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent space-y-2">
                {activeStory.caption && (
                  <p className="text-xs text-white text-center px-2 drop-shadow">
                    {activeStory.caption}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Gửi tin nhắn cho ${activeStory.username}...`}
                    className="flex-1 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-xs text-white placeholder:text-white/60 border border-white/30 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && replyText.trim()) {
                        toast.success(
                          `Đã gửi phản hồi đến ${activeStory.username}`
                        )
                        setReplyText("")
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      toast.success("Đã bày tỏ cảm xúc ❤️")
                    }}
                    className="p-2 rounded-full hover:bg-white/20 text-white transition"
                  >
                    <Heart className="w-6 h-6 hover:fill-rose-500 hover:text-rose-500 transition" />
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Story Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Đăng tin mới (Story 24h)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePublishStory} className="space-y-4">
            <input
              type="file"
              ref={storyFileInputRef}
              accept="image/*,video/*"
              onChange={handleStoryFileChange}
              hidden
            />

            {!storyPreview ? (
              <div
                onClick={() => storyFileInputRef.current?.click()}
                className="h-56 rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-muted/30"
              >
                <Plus className="w-8 h-8 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  Chọn ảnh hoặc video cho Story của bạn
                </p>
              </div>
            ) : (
              <div className="relative h-64 rounded-xl overflow-hidden bg-black">
                {storyFile?.type.startsWith("video/") ? (
                  <video
                    src={storyPreview}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={storyPreview}
                    alt="Story preview"
                    className="w-full h-full object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setStoryFile(null)
                    setStoryPreview(null)
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <Input
              value={storyCaption}
              onChange={(e) => setStoryCaption(e.target.value)}
              placeholder="Thêm chú thích ngắn cho Story..."
              className="text-xs h-9"
            />

            <div className="flex items-center justify-between gap-2">
              <select
                value={storyVisibility}
                onChange={(e) => setStoryVisibility(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-2.5 text-xs outline-none"
              >
                <option value="PUBLIC">Công khai</option>
                <option value="FOLLOWERS">Người theo dõi</option>
              </select>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!storyFile || isUploadingStory}
                  className="text-xs"
                >
                  {isUploadingStory ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : null}
                  Đăng tin
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Story Viewers Dialog */}
      <Dialog open={isViewersOpen} onOpenChange={setIsViewersOpen}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <span>Người đã xem tin ({viewers.length})</span>
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
            {isLoadingViewers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : viewers.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Chưa có người xem nào.
              </p>
            ) : (
              viewers.map((v) => {
                const prof = viewerProfileMap[v.viewerId]
                const username = prof?.username || `user_${v.viewerId.slice(0, 6)}`
                const avatar = prof?.avatarUrl || "/profile.jpg"
                const displayName = prof?.displayName || username

                return (
                  <div
                    key={v.viewerId}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={avatar}
                        alt={username}
                        className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{username}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {displayName}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {v.viewedAt
                        ? new Date(v.viewedAt).toLocaleTimeString("vi-VN")
                        : "Đã xem"}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
