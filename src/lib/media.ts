/**
 * Helper dùng chung cho việc quyết định render media dạng ảnh hay video.
 *
 * Backend `media-service` không sinh poster cho video nên với video
 * `thumbnailUrl` thường là null (hoặc tệ hơn: bị gán nhầm thành chính URL file
 * video). Hai helper dưới đây giúp mọi nơi trong app xử lý thống nhất.
 */

const VIDEO_FILE_PATTERN = /\.(mp4|mov|webm|m4v)(\?.*)?$/i

/** URL có phải là file video (theo phần mở rộng) hay không. */
export function isVideoUrl(url?: string): boolean {
  if (!url) return false
  return VIDEO_FILE_PATTERN.test(url)
}

/**
 * True nếu media là video: `mediaType` là "VIDEO" (hoặc mime `video/*`),
 * hoặc URL trỏ tới file video.
 */
export function isVideoMedia(mediaUrl?: string, mediaType?: string): boolean {
  if (mediaType) {
    const normalized = mediaType.toLowerCase()
    if (normalized === "video" || normalized.startsWith("video/")) return true
  }
  return isVideoUrl(mediaUrl)
}

/**
 * Trả về poster hợp lệ cho media:
 * - `undefined` nếu thumbnailUrl rỗng
 * - `undefined` nếu thumbnailUrl trùng mediaUrl (dữ liệu cũ bị gán nhầm)
 * - `undefined` nếu thumbnailUrl chính là file video
 * - ngược lại trả về thumbnailUrl
 */
export function safePoster(
  thumbnailUrl?: string | null,
  mediaUrl?: string
): string | undefined {
  if (!thumbnailUrl) return undefined
  if (mediaUrl && thumbnailUrl === mediaUrl) return undefined
  if (isVideoUrl(thumbnailUrl)) return undefined
  return thumbnailUrl
}
