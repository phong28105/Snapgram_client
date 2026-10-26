"use client"

import React from "react"
import { Check, Loader2 } from "lucide-react"
import type { ActiveUpload } from "@/hooks/use-media-upload"

interface UploadProgressCardProps {
  upload: ActiveUpload | null
  /** Nhãn hiển thị, mặc định "Đang tải ảnh lên…". */
  label?: string
  compact?: boolean
}

/**
 * Thẻ tiến trình upload: thumbnail xem trước + thanh % + phần trăm.
 * Hiện ngay khi người dùng chọn ảnh để họ biết ảnh đang được tải lên.
 */
export function UploadProgressCard({
  upload,
  label = "Đang tải ảnh lên…",
  compact = false,
}: UploadProgressCardProps) {
  if (!upload) return null

  const done = upload.progress >= 100
  const size = compact ? "w-10 h-10" : "w-12 h-12"

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border border-border bg-card/95 px-2.5 py-2 shadow-sm ${
        compact ? "" : "w-full"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={`relative ${size} rounded-lg overflow-hidden shrink-0 bg-muted`}>
        <img
          src={upload.previewUrl}
          alt="Xem trước ảnh đang tải"
          className="w-full h-full object-cover"
        />
        {!done && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium truncate">
            {done ? "Đã tải xong" : label}
          </p>
          <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
            {done ? <Check className="w-3 h-3 text-emerald-500" /> : `${upload.progress}%`}
          </span>
        </div>

        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-200 ${
              done ? "bg-emerald-500" : "bg-primary"
            }`}
            style={{ width: `${Math.max(3, upload.progress)}%` }}
          />
        </div>

        {!compact && (
          <p className="text-[10px] text-muted-foreground truncate">{upload.fileName}</p>
        )}
      </div>
    </div>
  )
}

export default UploadProgressCard
