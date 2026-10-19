"use client"

import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { contentService } from "@/services/content.service"
import { getErrorMessage } from "@/lib/api"
import type { ContentVisibility, PostResponse } from "@/types/content.type"

interface EditPostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string
  initialCaption?: string
  initialTags?: string
  initialVisibility?: ContentVisibility
  onUpdated?: (updated: PostResponse) => void
  onDeleted?: (postId: string) => void
}

export function EditPostDialog({
  open,
  onOpenChange,
  postId,
  initialCaption = "",
  initialTags = "",
  initialVisibility = "PUBLIC",
  onUpdated,
  onDeleted,
}: EditPostDialogProps) {
  const [caption, setCaption] = useState(initialCaption)
  const [tags, setTags] = useState(initialTags)
  const [visibility, setVisibility] = useState<ContentVisibility>(initialVisibility)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      setCaption(initialCaption)
      setTags(initialTags)
      setVisibility(initialVisibility || "PUBLIC")
    }
  }, [open, initialCaption, initialTags, initialVisibility])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const updated = await contentService.updatePost(postId, {
        caption: caption.trim(),
        tags: tags.trim() || undefined,
        visibility,
      })
      toast.success("Đã cập nhật bài viết!")
      onUpdated?.(updated)
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể cập nhật bài viết."))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await contentService.deletePost(postId)
      toast.success("Đã xóa bài viết.")
      onDeleted?.(postId)
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa bài viết."))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Chỉnh sửa bài viết</DialogTitle>
          <DialogDescription className="text-xs">
            Cập nhật chú thích, gắn thẻ hoặc quyền hiển thị của bài đăng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Chú thích (Caption)</Label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={2200}
              rows={4}
              placeholder="Viết chú thích cho bài viết..."
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-primary resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {caption.length}/2200
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Thẻ (Tags)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ví dụ: photography, travel, lifestyle"
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Quyền hiển thị</Label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs outline-none focus:border-primary"
            >
              <option value="PUBLIC">Công khai (Public)</option>
              <option value="FOLLOWERS">Người theo dõi (Followers)</option>
              <option value="PRIVATE">Chỉ mình tôi (Private)</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting || isSaving}
              onClick={handleDelete}
              className="text-xs gap-1.5"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Xóa bài viết
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving || isDeleting}
                className="text-xs"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
