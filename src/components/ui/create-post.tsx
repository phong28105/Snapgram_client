"use client"

import React, { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileVideo,
  Image,
  Loader2,
  Plus,
  Smile,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { mediaService } from "@/services/media.service"
import { contentService } from "@/services/content.service"
import { getErrorMessage } from "@/lib/api"
import { isVideoMedia } from "@/lib/media"
import type { ContentVisibility, PostContentType, PostMediaRequest } from "@/types/content.type"

interface CreatePostProps {
  children: React.ReactNode
}

interface MediaFileItem {
  id: string
  file: File
  previewUrl: string
  isVideo: boolean
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu)
  if (!matches) return []
  return Array.from(new Set(matches.map((tag) => tag.replace(/^#/, ""))))
}

const CreatePost: React.FC<CreatePostProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [isOpen, setIsOpen] = useState(false)
  const [mediaList, setMediaList] = useState<MediaFileItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [caption, setCaption] = useState("")
  const [tags, setTags] = useState("")
  const [visibility, setVisibility] = useState<ContentVisibility>("PUBLIC")
  const [contentType, setContentType] = useState<PostContentType>("POST")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const addMoreInputRef = useRef<HTMLInputElement | null>(null)

  const resetForm = () => {
    mediaList.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
    setMediaList([])
    setCurrentIndex(0)
    setCaption("")
    setTags("")
    setVisibility("PUBLIC")
    setContentType("POST")
  }

  const handleOpenChange = (open: boolean) => {
    if (open && !isAuthenticated) {
      openLoginModal()
      return
    }
    setIsOpen(open)
    if (!open) {
      setTimeout(resetForm, 200)
    }
  }

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return

    const availableSlots = 10 - mediaList.length
    if (availableSlots <= 0) {
      toast.warning("Bạn chỉ có thể chọn tối đa 10 tệp ảnh hoặc video.")
      return
    }

    const filesToAdd = files.slice(0, availableSlots)
    const newItems: MediaFileItem[] = filesToAdd.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video/"),
    }))

    const combined = [...mediaList, ...newItems]
    setMediaList(combined)

    if (combined.length > 1) {
      setContentType("CAROUSEL")
    } else if (combined[0]?.isVideo) {
      setContentType("REEL")
    } else {
      setContentType("POST")
    }
  }

  const handleInitialFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFilesSelected(files)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAddMoreFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFilesSelected(files)
    if (addMoreInputRef.current) addMoreInputRef.current.value = ""
  }

  const handleRemoveItem = (indexToRemove: number) => {
    const item = mediaList[indexToRemove]
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)

    const updated = mediaList.filter((_, i) => i !== indexToRemove)
    setMediaList(updated)

    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1))
    }

    if (updated.length > 1) {
      setContentType("CAROUSEL")
    } else if (updated[0]?.isVideo) {
      setContentType("REEL")
    } else {
      setContentType("POST")
    }
  }

  const handlePrevSlide = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNextSlide = () => {
    setCurrentIndex((prev) => Math.min(mediaList.length - 1, prev + 1))
  }

  const handleShare = async () => {
    if (mediaList.length === 0) return
    setIsSubmitting(true)

    try {
      // Upload trực tiếp từng media qua API /api/media/upload (hỗ trợ tới 50MB cả ảnh và video)
      const uploadedRequests: PostMediaRequest[] = []

      for (let i = 0; i < mediaList.length; i++) {
        const item = mediaList[i]
        const mediaRes = await mediaService.upload(item.file)
        // Backend không sinh poster cho video -> không được fallback về URL file video.
        const isVideo = isVideoMedia(mediaRes.url, item.isVideo ? "VIDEO" : "IMAGE")
        uploadedRequests.push({
          mediaId: mediaRes.id,
          mediaUrl: mediaRes.url,
          thumbnailUrl: isVideo ? undefined : mediaRes.thumbnailUrl || undefined,
          mediaType: isVideo ? "VIDEO" : "IMAGE",
          sortOrder: i,
          width: mediaRes.width,
          height: mediaRes.height,
          durationSec: mediaRes.durationSec,
        })
      }

      const cover = uploadedRequests[0]
      const hashtags = extractHashtags(caption)
      const postType: PostContentType =
        mediaList.length > 1
          ? "CAROUSEL"
          : mediaList[0].isVideo
          ? "REEL"
          : "POST"

      await contentService.createPost({
        contentType: postType,
        caption: caption.trim() || undefined,
        mediaId: cover.mediaId,
        mediaUrl: cover.mediaUrl,
        mediaList: uploadedRequests,
        tags: tags.trim() || undefined,
        visibility,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
      })

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("snapgram:post-created"))
      }

      toast.success("Đã đăng bài viết mới thành công!")
      setIsOpen(false)
      resetForm()
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể đăng bài viết lên máy chủ."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasMedia = mediaList.length > 0
  const currentItem = mediaList[currentIndex]

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        hideCloseButton
        className={`p-0 bg-card text-card-foreground border-border overflow-hidden transition-all duration-200 ${
          hasMedia
            ? "max-w-3xl sm:max-w-4xl h-[84vh] max-h-[660px]"
            : "max-w-md sm:max-w-lg h-[460px]"
        }`}
      >
        <DialogTitle className="sr-only">Tạo bài viết mới</DialogTitle>

        {/* Top Header */}
        <DialogHeader className="h-11 px-4 border-b border-border/70 flex flex-row items-center justify-between shrink-0">
          {hasMedia ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-muted-foreground hover:text-foreground transition p-1 -ml-1"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-7" />
          )}

          <h4 className="text-foreground text-sm font-semibold tracking-tight">
            {hasMedia
              ? mediaList.length > 1
                ? `Bài viết nhiều ảnh/video (${mediaList.length})`
                : "Tạo bài viết mới"
              : "Chọn ảnh hoặc video"}
          </h4>

          {hasMedia ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShare}
                disabled={isSubmitting}
                className="px-3 py-1 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-95 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang chia sẻ...</span>
                  </>
                ) : (
                  <span>Chia sẻ</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </DialogHeader>

        {/* Modal Body */}
        {!hasMedia ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="relative">
                <Image className="w-16 h-16 text-muted-foreground -rotate-6 -translate-x-3 translate-y-2 opacity-80" />
                <FileVideo className="w-16 h-16 text-muted-foreground rotate-6 translate-x-3 bg-card p-1 rounded opacity-80" />
              </div>

              <div>
                <h3 className="text-foreground text-base font-medium">
                  Kéo ảnh và video vào đây
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Hỗ trợ chọn nhiều ảnh và video (tối đa 10 tệp)
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  multiple
                  onChange={handleInitialFileInput}
                  hidden
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg text-xs hover:opacity-90 active:scale-95 transition"
                >
                  Chọn từ máy tính
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Media Preview Carousel */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[260px] select-none">
              {currentItem?.isVideo ? (
                <video
                  key={currentItem.id}
                  src={currentItem.previewUrl}
                  controls
                  className="w-full h-full object-contain max-h-[560px]"
                />
              ) : (
                <img
                  key={currentItem?.id}
                  src={currentItem?.previewUrl}
                  alt={`Preview ${currentIndex + 1}`}
                  className="w-full h-full object-contain max-h-[560px]"
                />
              )}

              {/* Indicator 1 / N */}
              {mediaList.length > 1 && (
                <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
                  {currentIndex + 1} / {mediaList.length}
                </div>
              )}

              {/* Action Buttons on Media: Remove current slide */}
              <button
                type="button"
                onClick={() => handleRemoveItem(currentIndex)}
                title="Xóa tệp này"
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Add more button */}
              {mediaList.length < 10 && (
                <>
                  <input
                    type="file"
                    ref={addMoreInputRef}
                    accept="image/*,video/*"
                    multiple
                    onChange={handleAddMoreFileInput}
                    hidden
                  />
                  <button
                    type="button"
                    onClick={() => addMoreInputRef.current?.click()}
                    title="Thêm ảnh hoặc video"
                    className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[11px] font-semibold transition backdrop-blur-sm z-10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </>
              )}

              {/* Navigation Left Arrow */}
              {mediaList.length > 1 && currentIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  title="Ảnh trước"
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Navigation Right Arrow */}
              {mediaList.length > 1 && currentIndex < mediaList.length - 1 && (
                <button
                  type="button"
                  onClick={handleNextSlide}
                  title="Ảnh tiếp theo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Dots Pagination */}
              {mediaList.length > 1 && (
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
                  {mediaList.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        idx === currentIndex
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: Caption & Metadata Form */}
            <div className="w-full md:w-[320px] lg:w-[360px] border-t md:border-t-0 md:border-l border-border/70 flex flex-col bg-card overflow-y-auto">
              <div className="p-3.5 border-b border-border/40 flex items-center gap-3">
                <img
                  src={user?.avatarUrl || "/profile.jpg"}
                  alt={user?.username || "profile"}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="inline-flex items-center gap-1 text-xs font-semibold">
                  {user?.username || "me"}
                  <VerifiedBadge
                    verified={user?.verified}
                    verifiedUntil={user?.verifiedUntil}
                    size={12}
                  />
                </span>
              </div>

              <div className="flex-1 p-3.5 flex flex-col gap-3">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Viết chú thích... (thêm #hashtag để dễ tìm kiếm)"
                  rows={5}
                  maxLength={2200}
                  className="w-full bg-transparent resize-none border-none outline-none text-xs text-foreground placeholder:text-muted-foreground leading-relaxed flex-1"
                />

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-muted-foreground">
                  <Smile className="w-4 h-4 hover:text-foreground cursor-pointer transition" />
                  <span className="text-[10px]">{caption.length}/2,200</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Loại nội dung
                    </label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none focus:border-primary"
                    >
                      <option value="POST">Bài viết (Post)</option>
                      <option value="CAROUSEL">Nhiều ảnh/video (Carousel)</option>
                      <option value="REEL">Thước phim (Reel)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Quyền hiển thị
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none focus:border-primary"
                    >
                      <option value="PUBLIC">Công khai (Public)</option>
                      <option value="FOLLOWERS">Người theo dõi (Followers)</option>
                      <option value="PRIVATE">Chỉ mình tôi (Private)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Thẻ chủ đề (Tags)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Nhiếp ảnh, Du lịch, Ẩm thực..."
                      className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CreatePost
