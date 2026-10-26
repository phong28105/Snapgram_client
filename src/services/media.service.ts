import axios from "axios"
import { apiClient } from "@/lib/api"
import type {
  MediaResponse,
  PageMediaResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
} from "@/types/media.type"

export const mediaService = {
  /**
   * GET /api/media/me — Danh sách media của tôi
   */
  async getMyMedia(page = 0, size = 20): Promise<PageMediaResponse> {
    const res = await apiClient.get<PageMediaResponse>("/api/media/me", {
      params: { page, size },
    })
    return res.data
  },

  /**
   * POST /api/media/upload — Direct Upload (Multipart)
   * `onProgress` nhận phần trăm 0–100 để hiển thị tiến trình cho người dùng.
   */
  async upload(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<MediaResponse> {
    const formData = new FormData()
    formData.append("file", file)
    const res = await apiClient.post<MediaResponse>("/api/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (!onProgress) return
        const total = event.total ?? file.size
        if (!total) return
        // Giữ 99% cho tới khi server trả về để không "nhảy" 100% quá sớm
        onProgress(Math.min(99, Math.round((event.loaded * 100) / total)))
      },
    })
    onProgress?.(100)
    return res.data
  },

  /**
   * POST /api/media/presigned — Tạo Presigned URL
   */
  async createPresignedUpload(payload: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    const res = await apiClient.post<PresignedUrlResponse>("/api/media/presigned", payload)
    return res.data
  },

  /**
   * PUT {uploadUrl} — Upload file binary trực tiếp lên MinIO bằng Presigned URL
   */
  async uploadFileToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    })
  },

  /**
   * POST /api/media/{id}/confirm — Xác nhận Presigned Upload
   */
  async confirmPresignedUpload(id: string): Promise<MediaResponse> {
    const res = await apiClient.post<MediaResponse>(`/api/media/${id}/confirm`)
    return res.data
  },

  /**
   * Luồng Presigned Upload trọn gói (tạo URL -> PUT MinIO -> confirm)
   * Tự động fallback sang Direct Upload (/api/media/upload) nếu presigned upload gặp lỗi mạng hoặc DNS.
   */
  async uploadViaPresigned(file: File): Promise<MediaResponse> {
    try {
      const presigned = await this.createPresignedUpload({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      })
      await this.uploadFileToPresignedUrl(presigned.uploadUrl, file)
      return await this.confirmPresignedUpload(presigned.mediaId)
    } catch (err) {
      console.warn("Presigned upload failed, falling back to direct upload:", err)
      return await this.upload(file)
    }
  },

  /**
   * GET /api/media/{id} — Lấy chi tiết media
   */
  async getMedia(id: string): Promise<MediaResponse> {
    const res = await apiClient.get<MediaResponse>(`/api/media/${id}`)
    return res.data
  },

  /**
   * DELETE /api/media/{id} — Xóa media
   */
  async deleteMedia(id: string): Promise<void> {
    await apiClient.delete(`/api/media/${id}`)
  },
}
