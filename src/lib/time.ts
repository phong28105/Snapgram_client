/**
 * Tiện ích thời gian cho chat.
 *
 * Server có thể trả `createdAt` ở 2 dạng:
 *  - ISO string: "2026-10-24T15:50:41.794Z"  (REST, Jackson 3)
 *  - số epoch GIÂY: 1792857041.794             (WebSocket, Jackson 2 mặc định)
 * Nếu đưa thẳng số giây vào `new Date(...)` sẽ bị hiểu là mili-giây → ra năm 1970.
 * `toEpochMs` chuẩn hoá cả hai về mili-giây.
 */
export type TimeInput = string | number | null | undefined

export function toEpochMs(value: TimeInput): number | null {
  if (value === null || value === undefined) return null

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null
    return value < 1e12 ? Math.round(value * 1000) : Math.round(value)
  }

  const trimmed = value.trim()
  if (!trimmed) return null

  // Chuỗi số thuần (một số gateway serialize Instant thành chuỗi số)
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const numeric = Number(trimmed)
    if (!Number.isFinite(numeric)) return null
    return numeric < 1e12 ? Math.round(numeric * 1000) : Math.round(numeric)
  }

  const parsed = new Date(trimmed).getTime()
  return Number.isNaN(parsed) ? null : parsed
}

/** Giờ:phút theo giờ Việt Nam, trả chuỗi rỗng nếu không parse được. */
export function formatClock(value: TimeInput): string {
  const ms = toEpochMs(value)
  if (ms === null) return ""
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(ms))
}

/** Thời gian tương đối ngắn gọn: "vừa xong", "5 phút", "3 giờ", "2 ngày". */
export function formatRelativeTime(value: TimeInput): string {
  const ms = toEpochMs(value)
  if (ms === null) return ""

  const diffSec = Math.floor((Date.now() - ms) / 1000)
  if (diffSec < 60) return "vừa xong"
  const min = Math.floor(diffSec / 60)
  if (min < 60) return `${min} phút`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} giờ`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day} ngày`
  const week = Math.floor(day / 7)
  if (week < 5) return `${week} tuần`
  return new Date(ms).toLocaleDateString("vi-VN")
}
