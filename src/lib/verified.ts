/**
 * Catalog phía FE cho sản phẩm Blue Tick.
 * BE hiện chưa có endpoint trả catalog; giá/thời hạn phải khớp
 * `ConfigPaymentCatalog` (199.000 VND) và `payment.grants.BLUE_TICK` (30 ngày).
 */
export const BLUE_TICK_PRODUCT = {
  productCode: "BLUE_TICK",
  name: "Snapgram Verified",
  price: 199_000,
  currency: "VND",
  durationDays: 30,
} as const

export const BLUE_TICK_BENEFITS = [
  "Huy hiệu tích xanh hiển thị cạnh tên tài khoản",
  "Tăng độ tin cậy với người theo dõi",
  "Hỗ trợ ưu tiên từ Snapgram",
  "Mỗi lần thanh toán cộng thêm 30 ngày vào hạn hiện tại",
] as const

/** Định dạng hạn Blue Tick theo kiểu Việt Nam, trả null nếu không hợp lệ. */
export function formatBlueTickExpiry(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date)
}

/** Định dạng giá VND, ví dụ 199000 -> "199.000 ₫". */
export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`
}
