import { IconRosetteDiscountCheckFilled } from "@tabler/icons-react"

import { formatBlueTickExpiry } from "@/lib/verified"
import { cn } from "@/lib/utils"

interface VerifiedBadgeProps {
  verified?: boolean
  verifiedUntil?: string | null
  size?: number
  className?: string
}

/**
 * Huy hiệu tích xanh hiển thị ngay sau username.
 * Chỉ render khi `verified === true` (BE đã tính theo verified_until tại thời điểm đọc).
 */
export function VerifiedBadge({
  verified,
  verifiedUntil,
  size = 16,
  className,
}: VerifiedBadgeProps) {
  if (!verified) return null

  const expiry = formatBlueTickExpiry(verifiedUntil)
  const label = expiry
    ? `Tài khoản đã xác minh · Hiệu lực đến ${expiry}`
    : "Tài khoản đã xác minh"

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("inline-flex shrink-0 items-center align-middle", className)}
    >
      <IconRosetteDiscountCheckFilled
        size={size}
        className="text-sky-500"
        fillRule="evenodd"
        aria-hidden="true"
      />
    </span>
  )
}
