interface NotificationBadgeProps {
  count: number
  /** Kích thước badge: dùng cho icon lớn (sidebar) hay nhỏ (navbar mobile). */
  size?: "sm" | "md"
  className?: string
}

/**
 * Badge số lượng thông báo chưa đọc, gắn ở góc trên-phải của icon
 * (cùng phong cách với badge Tin nhắn trong sidebar).
 */
export function NotificationBadge({
  count,
  size = "md",
  className = "",
}: NotificationBadgeProps) {
  if (count <= 0) return null

  const label = count > 99 ? "99+" : String(count)

  const sizeClasses =
    size === "sm"
      ? "h-[15px] min-w-[15px] px-[3px] text-[9px]"
      : "h-[17px] min-w-[17px] px-1 text-[10px]"

  return (
    <span
      aria-hidden
      className={`z-10 pointer-events-none absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-rose-500 font-semibold leading-none text-white ring-2 ring-background ${sizeClasses} ${className}`}
    >
      {label}
    </span>
  )
}

export default NotificationBadge
