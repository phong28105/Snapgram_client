"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { contentService } from "@/services/content.service"
import { toast } from "sonner"
import { Check, Sparkles } from "lucide-react"
import type { StoryResponse, HighlightResponse } from "@/types/content.type"

interface CreateHighlightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (newHighlight: HighlightResponse) => void
}

export function CreateHighlightDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateHighlightDialogProps) {
  const [name, setName] = useState("")
  const [availableStories, setAvailableStories] = useState<StoryResponse[]>([])
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName("")
      setSelectedStoryIds([])
      setIsLoadingStories(true)
      contentService
        .getStoryFeed(0, 50)
        .then((res) => {
          setAvailableStories(res.content || [])
        })
        .catch(() => {
          setAvailableStories([])
        })
        .finally(() => {
          setIsLoadingStories(false)
        })
    }
  }, [open])

  const toggleSelectStory = (id: string) => {
    setSelectedStoryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên cho Tin nổi bật!")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await contentService.createHighlight({
        name: name.trim(),
        storyIds: selectedStoryIds,
        coverStoryId: selectedStoryIds[0],
      })
      toast.success("Đã tạo Tin nổi bật mới!")
      onSuccess(res)
      onOpenChange(false)
    } catch {
      toast.error("Không thể tạo Tin nổi bật.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Tạo Tin nổi bật mới</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="highlight-name" className="text-xs font-medium">
              Tên tin nổi bật
            </Label>
            <Input
              id="highlight-name"
              placeholder="Ví dụ: Kỷ niệm, Du lịch, Coding..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Chọn story để đưa vào bộ sưu tập ({selectedStoryIds.length} đã chọn)
            </Label>
            {isLoadingStories ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Đang tải story của bạn...
              </div>
            ) : availableStories.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                Bạn chưa có story nào gần đây. Bạn vẫn có thể tạo tin nổi bật và thêm story sau!
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto p-1">
                {availableStories.map((s) => {
                  const isSelected = selectedStoryIds.includes(s.id)
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSelectStory(s.id)}
                      className={`relative aspect-[9/16] rounded-lg overflow-hidden border-2 cursor-pointer transition select-none group ${
                        isSelected ? "border-primary" : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={s.mediaUrl || "/profile.jpg"}
                        alt={s.caption || "story"}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow"
                            : "bg-black/50 text-white/70"
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCreate}
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Xong"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
