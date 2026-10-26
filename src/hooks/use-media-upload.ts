"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { mediaService } from "@/services/media.service"

export interface ActiveUpload {
  fileName: string
  /** URL blob để xem trước ngay lập tức. */
  previewUrl: string
  /** 0–100 */
  progress: number
}

/**
 * Upload ảnh lên media-service kèm tiến trình thật (axios onUploadProgress).
 *
 * Dùng cho chat và bình luận: gọi `upload(file)` → hiển thị preview + %,
 * trả về URL khi xong. Tự revoke blob URL khi hoàn tất/huỷ.
 */
export function useMediaUpload() {
  const [uploading, setUploading] = useState<ActiveUpload | null>(null)
  const previewRef = useRef<string | null>(null)
  const activeRef = useRef(false)

  const cleanupPreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }
  }, [])

  useEffect(() => cleanupPreview, [cleanupPreview])

  const upload = useCallback(
    async (file: File): Promise<string> => {
      const previewUrl = URL.createObjectURL(file)
      previewRef.current = previewUrl
      activeRef.current = true
      setUploading({ fileName: file.name, previewUrl, progress: 0 })

      try {
        const media = await mediaService.upload(file, (percent) => {
          if (!activeRef.current) return
          setUploading((prev) => (prev ? { ...prev, progress: percent } : prev))
        })
        if (!media?.url) {
          throw new Error("Không nhận được URL ảnh từ media-service")
        }
        return media.url
      } finally {
        activeRef.current = false
        // Giữ preview thêm một nhịp để người dùng thấy đã xong
        setTimeout(() => {
          setUploading(null)
          cleanupPreview()
        }, 350)
      }
    },
    [cleanupPreview]
  )

  const dismiss = useCallback(() => {
    activeRef.current = false
    setUploading(null)
    cleanupPreview()
  }, [cleanupPreview])

  return { uploading, upload, dismiss }
}
