"use client"

import React, { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, FileVideo, Image, Loader2, Smile } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { mediaService } from "@/services/media.service"
import { getErrorMessage } from "@/lib/api"
import { VerifiedBadge } from "@/components/ui/verified-badge"

interface CreatePostProps {
  children: React.ReactNode
}

const CreatePost: React.FC<CreatePostProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleOpenChange = (open: boolean) => {
    if (open && !isAuthenticated) {
      openLoginModal()
      return
    }
    setIsOpen(open)
    if (!open) {
      // Reset after closing
      setTimeout(() => {
        setSelectedFile(null)
        setPreviewUrl(null)
        setCaption("")
      }, 200)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
    }
  }

  const handleShare = async () => {
    if (!previewUrl || !selectedFile) return
    setIsSubmitting(true)

    try {
      // Nếu file > 5MB hoặc là video thì ưu tiên Presigned Upload, ngược lại dùng Direct Multipart Upload
      if (selectedFile.size > 5 * 1024 * 1024 || selectedFile.type.startsWith("video/")) {
        await mediaService.uploadViaPresigned(selectedFile)
      } else {
        await mediaService.upload(selectedFile)
      }
      toast.success("Tải media và chia sẻ bài viết thành công!")
      setIsOpen(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      setCaption("")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể tải media lên máy chủ."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={`p-0 bg-card text-card-foreground border-border overflow-hidden transition-all duration-200 ${
          previewUrl
            ? "max-w-3xl sm:max-w-4xl h-[80vh] max-h-[600px]"
            : "max-w-md sm:max-w-lg h-[460px]"
        }`}
      >
        <DialogTitle className="sr-only">Tạo bài viết mới</DialogTitle>

        {/* Top Header */}
        <DialogHeader className="h-11 px-4 border-b border-border/70 flex flex-row items-center justify-between shrink-0">
          {previewUrl ? (
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null)
                setPreviewUrl(null)
              }}
              className="text-muted-foreground hover:text-foreground transition p-1 -ml-1"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-5" />
          )}

          <h4 className="text-foreground text-sm font-semibold tracking-tight">
            {previewUrl ? "Tạo bài viết mới" : "Chọn ảnh hoặc video"}
          </h4>

          {previewUrl ? (
            <button
              type="button"
              onClick={handleShare}
              disabled={isSubmitting}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition flex items-center gap-1 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang chia sẻ...</span>
                </>
              ) : (
                "Chia sẻ"
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
        </DialogHeader>

        {/* Modal Body */}
        {!previewUrl ? (
          /* Step 1: File Selection Area */
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
                  Hỗ trợ định dạng JPG, PNG, MP4 hoặc WebP
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  onChange={handleFileChange}
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
          /* Step 2: Preview & Caption Compose Area */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Media Preview */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[280px]">
              <img
                src={previewUrl}
                alt="Preview upload"
                className="w-full h-full object-contain max-h-[550px]"
              />
            </div>

            {/* Right: Caption Form */}
            <div className="w-full md:w-[320px] lg:w-[360px] border-t md:border-t-0 md:border-l border-border/70 flex flex-col bg-card">
              {/* Author Row */}
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
                    size={13}
                  />
                </span>
              </div>

              {/* Caption Textarea */}
              <div className="flex-1 p-3.5 flex flex-col">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Viết chú thích..."
                  rows={6}
                  maxLength={2200}
                  className="w-full bg-transparent resize-none border-none outline-none text-xs text-foreground placeholder:text-muted-foreground leading-relaxed flex-1"
                />

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-muted-foreground">
                  <Smile className="w-4 h-4 hover:text-foreground cursor-pointer transition" />
                  <span className="text-[10px]">{caption.length}/2,200</span>
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
