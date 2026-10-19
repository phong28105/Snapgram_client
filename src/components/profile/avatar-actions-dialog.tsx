"use client"

import React, { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, Loader2, Trash2, Upload, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/api"
import { mediaService } from "@/services/media.service"
import { userService } from "@/services/user.service"
import type { UserProfileResponse } from "@/types/user.type"

interface AvatarActionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  avatarUrl: string
  username: string
  canEdit?: boolean
  onUpdated?: (updated: UserProfileResponse) => void
}

export function AvatarActionsDialog({
  open,
  onOpenChange,
  avatarUrl,
  username,
  canEdit = false,
  onUpdated,
}: AvatarActionsDialogProps) {
  const [isViewingPhoto, setIsViewingPhoto] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setTimeout(() => setIsViewingPhoto(false), 150)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUpdating(true)
    try {
      const media = await mediaService.upload(file)
      const updated = await userService.updateProfile({ avatarUrl: media.url })
      onUpdated?.(updated)
      toast.success("Đã cập nhật ảnh đại diện mới!")
      handleClose(false)
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể tải ảnh đại diện lên."))
    } finally {
      setIsUpdating(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUpdating(true)
    try {
      const updated = await userService.updateProfile({ avatarUrl: "" })
      onUpdated?.(updated)
      toast.success("Đã gỡ ảnh đại diện hiện tại.")
      handleClose(false)
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể gỡ ảnh đại diện."))
    } finally {
      setIsUpdating(false)
    }
  }

  // Nếu là tài khoản của người khác (không có quyền sửa) -> mở thẳng chế độ xem ảnh lớn
  const showPhotoViewer = !canEdit || isViewingPhoto

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={
          showPhotoViewer
            ? "sm:max-w-[520px] p-0 bg-black/95 border-border/40 overflow-hidden rounded-2xl"
            : "sm:max-w-[380px] p-0 bg-card border-border overflow-hidden rounded-2xl"
        }
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Ảnh đại diện của {username}</DialogTitle>
        </DialogHeader>

        {showPhotoViewer ? (
          <div className="relative flex flex-col items-center justify-center p-4 min-h-[380px]">
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsViewingPhoto(false)}
                className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition backdrop-blur-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại
              </button>
            )}

            <img
              src={avatarUrl || "/profile.jpg"}
              alt={username}
              className="w-72 h-72 sm:w-96 sm:h-96 rounded-full object-cover border-2 border-white/20 shadow-2xl select-none"
            />

            <p className="mt-4 text-xs font-medium text-white/80">@{username}</p>
          </div>
        ) : (
          <div className="flex flex-col text-center divide-y divide-border/60">
            {/* Preview Header */}
            <div className="p-6 flex flex-col items-center gap-3">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border border-border">
                <img
                  src={avatarUrl || "/profile.jpg"}
                  alt={username}
                  className="w-full h-full object-cover"
                />
                {isUpdating && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Ảnh đại diện</h3>
                <p className="text-xs text-muted-foreground mt-0.5">@{username}</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Xem ảnh đại diện */}
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => setIsViewingPhoto(true)}
              className="w-full py-3.5 px-4 text-sm font-medium text-foreground hover:bg-muted/60 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              Xem ảnh đại diện
            </button>

            {/* Tải ảnh mới lên */}
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-4 text-sm font-semibold text-primary hover:bg-muted/60 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Tải ảnh mới lên
            </button>

            {/* Gỡ ảnh hiện tại */}
            {avatarUrl && avatarUrl !== "/profile.jpg" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleRemoveAvatar}
                className="w-full py-3.5 px-4 text-sm font-semibold text-destructive hover:bg-muted/60 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Gỡ ảnh hiện tại
              </button>
            )}

            {/* Hủy */}
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleClose(false)}
              className="w-full py-3.5 px-4 text-sm text-muted-foreground hover:bg-muted/60 transition"
            >
              Hủy
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
