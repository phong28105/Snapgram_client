"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Heart, Loader2, Send, Smile, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { contentService } from "@/services/content.service"
import { AuthorBadge } from "@/components/content/author-badge"
import { getErrorMessage } from "@/lib/api"
import type { CommentResponse } from "@/types/content.type"

interface CommentItem {
  id: string
  authorId?: string
  username: string
  avatar: string
  text: string
  createdAt: string
  likeCount: number
  likedByMe: boolean
  parentCommentId?: string
  replyCount?: number
}

function mapComment(
  c: CommentResponse,
  currentUserId?: string,
  currentUsername?: string,
  currentAvatar?: string
): CommentItem {
  const isMe = Boolean(currentUserId && c.authorId === currentUserId)
  return {
    id: c.id,
    authorId: c.authorId,
    username: isMe
      ? currentUsername || "me"
      : c.authorUsername || c.authorId || "snapgram_user",
    avatar:
      isMe && currentAvatar ? currentAvatar : c.authorAvatarUrl || "/profile.jpg",
    text: c.content,
    createdAt: c.createdAt || new Date().toISOString(),
    likeCount: c.likeCount ?? 0,
    likedByMe: Boolean(c.likedByMe),
    parentCommentId: c.parentCommentId,
    replyCount: c.replyCount,
  }
}

interface CommentPanelProps {
  postId: string
  /** ID tác giả bài viết — để hiện badge "Tác giả" và cho phép họ xoá bình luận */
  postAuthorId?: string
  /** Số bình luận ban đầu, dùng cho tiêu đề trước khi tải xong */
  initialCount?: number
  /** Gọi khi số lượng bình luận thay đổi (thêm/xoá) để đồng bộ badge bên ngoài */
  onCountChange?: (count: number) => void
  onClose?: () => void
  className?: string
}

/**
 * Panel bình luận dùng riêng cho Reels: xem, trả lời, thích, xoá bình luận
 * ngay trong trang reel (không cần điều hướng sang /p/[id]).
 */
export function CommentPanel({
  postId,
  postAuthorId,
  initialCount = 0,
  onCountChange,
  onClose,
  className = "",
}: CommentPanelProps) {
  const { user, isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [comments, setComments] = useState<CommentItem[]>([])
  const [repliesMap, setRepliesMap] = useState<Record<string, CommentItem[]>>({})
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const notifyCount = useCallback(
    (delta: number) => {
      setComments((prev) => {
        const nextCount = Math.max(0, initialCount + delta)
        onCountChange?.(nextCount)
        return prev
      })
    },
    [initialCount, onCountChange]
  )

  const loadComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const page = await contentService.getRootComments(postId, 0, 30)
      const items = (page.content || []).map((c) =>
        mapComment(c, user?.id, user?.username, user?.avatarUrl)
      )
      setComments(items)
      const total =
        typeof page.totalElements === "number" ? page.totalElements : items.length
      onCountChange?.(total)
    } catch {
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }, [postId, user?.id, user?.username, user?.avatarUrl, onCountChange])

  useEffect(() => {
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user?.id])

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    action()
  }

  const handleReplyClick = (comment: CommentItem) => {
    requireAuth(() => {
      setReplyingTo({ id: comment.id, username: comment.username })
      inputRef.current?.focus()
    })
  }

  const handleLoadReplies = async (commentId: string) => {
    if (expandedReplies[commentId]) {
      setExpandedReplies((prev) => ({ ...prev, [commentId]: false }))
      return
    }
    try {
      const page = await contentService.getReplies(postId, commentId, 0, 50)
      const items = (page.content || []).map((c) =>
        mapComment(c, user?.id, user?.username, user?.avatarUrl)
      )
      setRepliesMap((prev) => ({ ...prev, [commentId]: items }))
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }))
    } catch {
      toast.error("Không thể tải câu trả lời.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    const content = input.trim()
    if (!content || isSubmitting) return

    const parentCommentId = replyingTo?.id
    setIsSubmitting(true)
    try {
      const created = await contentService.createComment(postId, {
        content,
        parentCommentId,
      })
      const mapped = mapComment(created, user?.id, user?.username, user?.avatarUrl)

      if (parentCommentId) {
        setRepliesMap((prev) => ({
          ...prev,
          [parentCommentId]: [...(prev[parentCommentId] || []), mapped],
        }))
        setExpandedReplies((prev) => ({ ...prev, [parentCommentId]: true }))
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentCommentId
              ? { ...c, replyCount: (c.replyCount ?? 0) + 1 }
              : c
          )
        )
      } else {
        setComments((prev) => [...prev, mapped])
      }

      notifyCount(1)
      setInput("")
      setReplyingTo(null)
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        })
      })
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể gửi bình luận."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleLikeComment = async (comment: CommentItem, isReply = false, parentId?: string) => {
    requireAuth(async () => {
      const nextLiked = !comment.likedByMe
      const update = (list: CommentItem[]) =>
        list.map((item) =>
          item.id === comment.id
            ? {
                ...item,
                likedByMe: nextLiked,
                likeCount: nextLiked
                  ? item.likeCount + 1
                  : Math.max(0, item.likeCount - 1),
              }
            : item
        )

      if (isReply && parentId) {
        setRepliesMap((prev) => ({ ...prev, [parentId]: update(prev[parentId] || []) }))
      } else {
        setComments((prev) => update(prev))
      }

      try {
        if (nextLiked) {
          await contentService.likeComment(postId, comment.id)
        } else {
          await contentService.unlikeComment(postId, comment.id)
        }
      } catch {
        // Giữ optimistic; lỗi thường do đã like/unlike trước đó
      }
    })
  }

  const handleDelete = async (comment: CommentItem, isReply = false, parentId?: string) => {
    try {
      await contentService.deleteComment(postId, comment.id)
      if (isReply && parentId) {
        setRepliesMap((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter((i) => i.id !== comment.id),
        }))
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replyCount: Math.max(0, (c.replyCount ?? 0) - 1) }
              : c
          )
        )
      } else {
        setComments((prev) => prev.filter((i) => i.id !== comment.id))
      }
      notifyCount(-1)
      toast.success("Đã xoá bình luận.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xoá bình luận."))
    }
  }

  const renderRow = (
    comment: CommentItem,
    opts: { isReply?: boolean; parentId?: string } = {}
  ) => {
    const { isReply = false, parentId } = opts
    const isOwner = Boolean(
      user &&
        ((comment.authorId && comment.authorId === user.id) ||
          comment.username === user.username)
    )
    const isByPostAuthor = Boolean(
      comment.authorId && postAuthorId && comment.authorId === postAuthorId
    )
    const canDelete = isOwner || Boolean(postAuthorId && user?.id === postAuthorId)

    return (
      <div
        key={comment.id}
        className={`flex items-start justify-between gap-2 group ${isReply ? "" : "py-1"}`}
      >
        <div className="flex gap-2.5 min-w-0 flex-1">
          <Link href={`/u/${comment.username}`} className="shrink-0">
            <img
              src={comment.avatar}
              alt={comment.username}
              className={`rounded-full object-cover ${isReply ? "w-6 h-6" : "w-8 h-8"}`}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-relaxed break-words">
              <Link
                href={`/u/${comment.username}`}
                className="font-semibold mr-1.5 hover:underline"
              >
                {comment.username}
              </Link>
              {isByPostAuthor && <AuthorBadge className="mr-1.5" />}
              <span className="text-foreground/90">{comment.text}</span>
            </p>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
              <span>{formatRelative(comment.createdAt)}</span>
              {comment.likeCount > 0 && (
                <span className="font-semibold">{comment.likeCount} lượt thích</span>
              )}
              {!isReply && (
                <button
                  type="button"
                  onClick={() => handleReplyClick(comment)}
                  className="font-semibold hover:text-foreground transition"
                >
                  Trả lời
                </button>
              )}
              {!isReply &&
                (expandedReplies[comment.id] ||
                  (repliesMap[comment.id]?.length ?? 0) > 0 ||
                  (comment.replyCount ?? 0) > 0) && (
                  <button
                    type="button"
                    onClick={() => handleLoadReplies(comment.id)}
                    className="font-semibold hover:text-foreground transition"
                  >
                    {expandedReplies[comment.id]
                      ? "Ẩn câu trả lời"
                      : `Xem câu trả lời (${comment.replyCount ?? repliesMap[comment.id]?.length ?? 0})`}
                  </button>
                )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment, isReply, parentId)}
                  className="text-destructive opacity-0 group-hover:opacity-100 transition"
                  title="Xóa bình luận"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleToggleLikeComment(comment, isReply, parentId)}
          className="pt-1 text-muted-foreground hover:text-rose-500 transition shrink-0"
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              comment.likedByMe ? "text-rose-500 fill-rose-500" : ""
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col bg-background border border-border rounded-2xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">
          Bình luận
          {comments.length > 0 && (
            <span className="ml-1.5 text-muted-foreground font-normal">
              ({comments.length})
            </span>
          )}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition"
            aria-label="Đóng bình luận"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* List */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center space-y-1">
            <p className="text-sm font-semibold">Chưa có bình luận nào</p>
            <p className="text-[11px] text-muted-foreground">
              Hãy là người đầu tiên bình luận.
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const replies = repliesMap[comment.id] || []
            const isExpanded = Boolean(expandedReplies[comment.id])
            return (
              <div key={comment.id} className="space-y-1">
                {renderRow(comment)}
                {isExpanded && replies.length > 0 && (
                  <div className="pl-8 ml-2 space-y-1.5 border-l border-border/50">
                    {replies.map((reply) =>
                      renderRow(reply, { isReply: true, parentId: comment.id })
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border px-3 py-2.5 shrink-0"
      >
        {replyingTo && (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
            <span>
              Đang trả lời <span className="font-semibold">@{replyingTo.username}</span>
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="hover:text-foreground"
            >
              Huỷ
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Smile className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isAuthenticated ? "Thêm bình luận..." : "Đăng nhập để bình luận"
            }
            className="flex-1 bg-transparent text-xs outline-none border-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="text-primary disabled:opacity-40 transition"
            aria-label="Gửi bình luận"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 -rotate-12" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

/** Hiển thị thời gian tương đối ngắn gọn cho panel. */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 60) return "vừa xong"
  const min = Math.floor(diffSec / 60)
  if (min < 60) return `${min} phút`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} giờ`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day} ngày`
  const week = Math.floor(day / 7)
  if (week < 5) return `${week} tuần`
  return new Date(iso).toLocaleDateString("vi-VN")
}

export default CommentPanel
