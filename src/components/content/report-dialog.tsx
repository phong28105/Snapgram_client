"use client"

import React, { useState } from "react"
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
import { AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { contentService } from "@/services/content.service"
import { getErrorMessage } from "@/lib/api"
import type { ReportTargetType } from "@/types/content.type"

const REPORT_REASONS = [
  "Nội dung spam hoặc lừa đảo",
  "Ngôn từ gây thù ghét hoặc quấy rối",
  "Hình ảnh nhạy cảm hoặc bạo lực",
  "Vi phạm bản quyền / sở hữu trí tuệ",
  "Thông tin sai sự thật",
  "Lý do khác",
]

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetType: ReportTargetType
  targetId: string
  targetLabel?: string
}

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetLabel,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0])
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason.trim()) return

    setIsSubmitting(true)
    try {
      await contentService.createReport({
        targetType,
        targetId,
        reason: selectedReason,
        description: description.trim() || undefined,
      })
      toast.success("Đã gửi báo cáo vi phạm. Cảm ơn bạn đã giúp bảo vệ cộng đồng!")
      onOpenChange(false)
      setDescription("")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể gửi báo cáo lúc này."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const typeLabel =
    targetType === "POST"
      ? "bài viết"
      : targetType === "COMMENT"
      ? "bình luận"
      : "tài khoản"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Báo cáo {typeLabel}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {targetLabel
              ? `Bạn đang báo cáo ${typeLabel} của ${targetLabel}.`
              : `Hãy chọn lý do bạn muốn báo cáo ${typeLabel} này.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Lý do báo cáo</Label>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    selectedReason === reason
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-primary"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Mô tả chi tiết (tùy chọn)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cung cấp thêm thông tin nếu cần..."
              className="text-xs h-9"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
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
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              className="text-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Gửi báo cáo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
