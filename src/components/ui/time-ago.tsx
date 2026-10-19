import { formatDistanceToNow, isValid } from "date-fns"
import { vi } from "date-fns/locale"

export const TimeAgo = ({ date, className }: { date?: string | null; className?: string }) => {
  if (!date) return null
  const parsed = new Date(date)
  if (!isValid(parsed)) return null
  return (
    <span className={className || ""}>
      {formatDistanceToNow(parsed, { addSuffix: true, locale: vi })}
    </span>
  )
}

export default TimeAgo
