/**
 * Badge nhỏ đánh dấu bình luận được viết bởi chính tác giả bài viết.
 * Giúp người đọc phân biệt chủ bài với người bình luận thường.
 */
export function AuthorBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-primary/10 px-1.5 py-[1px] text-[9px] font-semibold leading-none text-primary align-middle ${className}`}
      title="Tác giả bài viết"
    >
      Tác giả
    </span>
  )
}

export default AuthorBadge
