"use client"

import React, { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  Bookmark,
  Copy,
  ExternalLink,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Smile,
  Trash2,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import TimeAgo from "@/components/ui/time-ago"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { contentService } from "@/services/content.service"
import { getErrorMessage } from "@/lib/api"
import { ReportDialog } from "@/components/content/report-dialog"
import { PostMediaCarousel } from "@/components/content/post-media-carousel"
import { AuthorBadge } from "@/components/content/author-badge"
import { toast } from "sonner"
import type { CommentResponse, PostResponse, ReportTargetType } from "@/types/content.type"

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
  isReal?: boolean
}

function mapCommentDto(
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
    avatar: isMe && currentAvatar
      ? currentAvatar
      : c.authorAvatarUrl || "/profile.jpg",
    text: c.content,
    createdAt: c.createdAt || new Date().toISOString(),
    likeCount: c.likeCount ?? 0,
    likedByMe: Boolean(c.likedByMe),
    parentCommentId: c.parentCommentId,
    isReal: true,
  }
}

export default function PostModal({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const router = useRouter()
  const resolvedParams = params instanceof Promise ? use(params) : params
  const postId = resolvedParams?.id || "post-1"

  const { user, isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [postData, setPostData] = useState<PostResponse | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [repliesMap, setRepliesMap] = useState<Record<string, CommentItem[]>>({})
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const [commentInput, setCommentInput] = useState("")
  const [isFollowing, setIsFollowing] = useState(false)
  const [reportTarget, setReportTarget] = useState<{
    type: ReportTargetType
    id: string
    label?: string
  } | null>(null)

  const commentInputRef = React.useRef<HTMLInputElement | null>(null)
  const isRealUuid = !postId.startsWith("post-")

  const loadPostAndComments = useCallback(async () => {
    if (!isRealUuid) return
    try {
      const p = await contentService.getPost(postId)
      setPostData(p)
      setIsLiked(Boolean(p.likedByMe))
      setLikesCount(p.likeCount ?? 0)

      if (isAuthenticated) {
        contentService.interactPost(postId, { type: "VIEW" }).catch(() => {})
      }

      const rootRes = await contentService.getRootComments(postId, 0, 30)
      if (rootRes.content && rootRes.content.length > 0) {
        setComments(
          rootRes.content.map((c) =>
            mapCommentDto(c, user?.id, user?.username, user?.avatarUrl)
          )
        )
      } else {
        setComments([])
      }
    } catch {
      // Fallback mock
    }
  }, [postId, isRealUuid, isAuthenticated, user?.id, user?.username, user?.avatarUrl])

  useEffect(() => {
    loadPostAndComments()
  }, [loadPostAndComments])

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    action()
  }

  const handleToggleLike = () => {
    requireAuth(async () => {
      const nextLiked = !isLiked
      setIsLiked(nextLiked)
      setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)))
      if (isRealUuid) {
        try {
          if (nextLiked) {
            await contentService.interactPost(postId, { type: "LIKE" })
          } else {
            await contentService.unlikePost(postId)
          }
        } catch {
          // Optimistic
        }
      }
    })
  }

  const handleToggleBookmark = () => {
    requireAuth(async () => {
      const nextSaved = !isBookmarked
      setIsBookmarked(nextSaved)
      if (isRealUuid) {
        try {
          if (nextSaved) {
            await contentService.savePost(postId)
            toast.success("Đã lưu bài viết!")
          } else {
            await contentService.unsavePost(postId)
            toast.success("Đã bỏ lưu bài viết.")
          }
        } catch {
          // Optimistic
        }
      }
    })
  }

  const handleCommentButtonClick = () => {
    requireAuth(() => {
      commentInputRef.current?.focus()
    })
  }

  const handleReplyClick = (comment: CommentItem) => {
    requireAuth(() => {
      setReplyingTo({ id: comment.id, username: comment.username })
      setCommentInput(`@${comment.username} `)
      commentInputRef.current?.focus()
    })
  }

  const handleLoadReplies = async (commentId: string) => {
    const isExpanded = Boolean(expandedReplies[commentId])
    if (isExpanded) {
      setExpandedReplies((prev) => ({ ...prev, [commentId]: false }))
      return
    }
    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }))
    if (isRealUuid) {
      try {
        const res = await contentService.getCommentReplies(postId, commentId, 0, 20)
        setRepliesMap((prev) => ({
          ...prev,
          [commentId]: (res.content || []).map((r) =>
            mapCommentDto(r, user?.id, user?.username, user?.avatarUrl)
          ),
        }))
      } catch {
        // Ignore
      }
    }
  }

  const handleToggleLikeComment = (comment: CommentItem, isReply = false, parentId?: string) => {
    requireAuth(async () => {
      const nextLiked = !comment.likedByMe
      const updateList = (list: CommentItem[]) =>
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
        setRepliesMap((prev) => ({
          ...prev,
          [parentId]: updateList(prev[parentId] || []),
        }))
      } else {
        setComments((prev) => updateList(prev))
      }

      if (comment.isReal && isRealUuid) {
        try {
          if (nextLiked) {
            await contentService.likeComment(postId, comment.id)
          } else {
            await contentService.unlikeComment(postId, comment.id)
          }
        } catch {
          // Optimistic
        }
      }
    })
  }

  const handleDeleteComment = async (
    comment: CommentItem,
    isReply = false,
    parentId?: string
  ) => {
    try {
      if (comment.isReal && isRealUuid) {
        await contentService.deleteComment(postId, comment.id)
      }
      if (isReply && parentId) {
        setRepliesMap((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter((item) => item.id !== comment.id),
        }))
      } else {
        setComments((prev) => prev.filter((item) => item.id !== comment.id))
      }
      toast.success("Đã xóa bình luận.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa bình luận."))
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim()) return

    if (!isAuthenticated) {
      openLoginModal()
      return
    }

    const content = commentInput.trim()
    const parentCommentId = replyingTo?.id
    setCommentInput("")
    setReplyingTo(null)

    if (isRealUuid) {
      try {
        const created = await contentService.createComment(postId, {
          content,
          parentCommentId,
        })
        const mapped = mapCommentDto(
          created,
          user?.id,
          user?.username,
          user?.avatarUrl
        )
        if (parentCommentId) {
          setExpandedReplies((prev) => ({ ...prev, [parentCommentId]: true }))
          setRepliesMap((prev) => ({
            ...prev,
            [parentCommentId]: [...(prev[parentCommentId] || []), mapped],
          }))
        } else {
          setComments((prev) => [...prev, mapped])
        }
        return
      } catch (err) {
        toast.error(getErrorMessage(err, "Không thể gửi bình luận."))
      }
    }

    const fallbackNew: CommentItem = {
      id: Date.now().toString(),
      authorId: user?.id,
      username: user?.username || "me",
      avatar: user?.avatarUrl || "/profile.jpg",
      text: content,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      likedByMe: false,
      parentCommentId,
    }
    if (parentCommentId) {
      setExpandedReplies((prev) => ({ ...prev, [parentCommentId]: true }))
      setRepliesMap((prev) => ({
        ...prev,
        [parentCommentId]: [...(prev[parentCommentId] || []), fallbackNew],
      }))
    } else {
      setComments((prev) => [...prev, fallbackNew])
    }
  }

  const authorUsername =
    postData?.authorId && user?.id === postData.authorId
      ? user.username
      : postData?.authorUsername || postData?.authorId || "snapgram_official"
  const authorAvatar =
    postData?.authorId && user?.id === postData.authorId && user.avatarUrl
      ? user.avatarUrl
      : postData?.authorAvatarUrl || "/profile.jpg"
  const postMediaUrl =
    postData?.mediaItems?.[0]?.mediaUrl || postData?.mediaUrl || "/profile.jpg"
  const postCaption =
    postData?.caption ??
    `Chào mừng bạn đến với Snapgram! Bài viết #${postId} chia sẻ khoảnh khắc đẹp nhất trong ngày 📸✨`

  const isOwner = Boolean(
    user && (
      (postData?.authorId && user.id === postData.authorId) ||
      (authorUsername && user.username?.toLowerCase() === authorUsername.toLowerCase())
    )
  )

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          router.back()
        }
      }}
    >
      <DialogContent hideCloseButton className="max-w-4xl p-0 overflow-hidden border-border bg-background sm:rounded-xl shadow-2xl h-[85vh] max-h-[700px] flex flex-col md:flex-row">
        <DialogTitle className="sr-only">Chi tiết bài viết {postId}</DialogTitle>

        {/* Left: Post Media Carousel */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[280px]">
          <PostMediaCarousel
            items={
              postData?.mediaItems && postData.mediaItems.length > 0
                ? postData.mediaItems
                : [{ mediaUrl: postMediaUrl }]
            }
            alt={`Post ${postId}`}
            aspectRatioClassName="w-full h-full min-h-[280px]"
            objectFit="contain"
          />
        </div>

        {/* Right: Comments & Interactions */}
        <div className="w-full md:w-[360px] lg:w-[400px] flex flex-col border-t md:border-t-0 md:border-l border-border bg-card">
          {/* Author Header */}
          <div className="p-3.5 border-b border-border/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600">
                <img
                  src={authorAvatar}
                  alt={authorUsername}
                  className="w-8 h-8 rounded-full object-cover bg-background p-0.5"
                />
              </div>
              <div className="text-xs">
                <Link
                  href={`/u/${authorUsername}`}
                  className="font-semibold text-foreground hover:underline"
                >
                  {authorUsername}
                </Link>
                {!isOwner && (
                  <>
                    <span className="text-muted-foreground mx-1.5">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        requireAuth(async () => {
                          const next = !isFollowing
                          setIsFollowing(next)
                          if (postData?.authorId) {
                            try {
                              if (next) {
                                await contentService.followUser(postData.authorId)
                              } else {
                                await contentService.unfollowUser(postData.authorId)
                              }
                            } catch {}
                          }
                        })
                      }
                      className={`font-semibold transition ${
                        isFollowing
                          ? "text-muted-foreground hover:text-foreground"
                          : "text-primary hover:opacity-80"
                      }`}
                    >
                      {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="Tùy chọn khác"
                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() =>
                      requireAuth(() =>
                        setReportTarget({
                          type: "POST",
                          id: postId,
                          label: `@${authorUsername}`,
                        })
                      )
                    }
                    className="text-xs text-destructive focus:text-destructive cursor-pointer gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Báo cáo bài viết</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard.writeText(`${window.location.origin}/p/${postId}`)
                        toast.success("Đã sao chép liên kết bài viết!")
                      }
                    }}
                    className="text-xs cursor-pointer gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Sao chép liên kết</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push(`/p/${postId}`)}
                    className="text-xs cursor-pointer gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Đi tới bài viết</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => router.back()}
                title="Đóng"
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Comments List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
            {/* Post Caption */}
            <div className="flex gap-3">
              <img
                src={authorAvatar}
                alt="author"
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div className="space-y-1">
                <p className="leading-relaxed">
                  <span className="font-semibold mr-1.5">{authorUsername}</span>
                  <span className="text-foreground/90">{postCaption}</span>
                </p>
                <TimeAgo
                  date={postData?.createdAt || "2025-01-01T00:00:00Z"}
                  className="text-[10px] text-muted-foreground block"
                />
              </div>
            </div>

            {/* Comments */}
            {comments.length === 0 ? (
              <div className="py-12 text-center space-y-1">
                <p className="font-semibold text-xs text-foreground">
                  Chưa có bình luận nào
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Hãy là người đầu tiên chia sẻ suy nghĩ của bạn!
                </p>
              </div>
            ) : (
              comments.map((comment) => {
                const isCommentOwner = Boolean(
                  user &&
                    ((comment.authorId && comment.authorId === user.id) ||
                      comment.username === user.username)
                )
                // Tác giả bài viết được phép xoá mọi bình luận trong bài của mình
                const isCommentByPostAuthor = Boolean(
                  comment.authorId && postData?.authorId && comment.authorId === postData.authorId
                )
                const canDeleteComment = isCommentOwner || isOwner
                const replies = repliesMap[comment.id] || []
                const isExpanded = Boolean(expandedReplies[comment.id])

                return (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-2 group">
                      <div className="flex gap-3 min-w-0 flex-1">
                        <img
                          src={comment.avatar}
                          alt={comment.username}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="leading-relaxed break-words">
                            <span className="font-semibold mr-1.5">
                              {comment.username}
                            </span>
                            {isCommentByPostAuthor && (
                              <AuthorBadge className="mr-1.5" />
                            )}
                            <span className="text-foreground/90">{comment.text}</span>
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <TimeAgo date={comment.createdAt} />
                            {comment.likeCount > 0 && (
                              <span className="font-semibold">
                                {comment.likeCount} lượt thích
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleReplyClick(comment)}
                              className="font-semibold hover:text-foreground transition"
                            >
                              Trả lời
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLoadReplies(comment.id)}
                              className="font-semibold hover:text-foreground transition"
                            >
                              {isExpanded ? "Ẩn trả lời" : "Xem trả lời"}
                            </button>
                            {canDeleteComment ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment)}
                                className="text-destructive opacity-0 group-hover:opacity-100 transition"
                                title="Xóa bình luận"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  requireAuth(() =>
                                    setReportTarget({
                                      type: "COMMENT",
                                      id: comment.id,
                                      label: `@${comment.username}`,
                                    })
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition"
                              >
                                <Flag className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleLikeComment(comment)}
                        className="pt-1 text-muted-foreground hover:text-rose-500 transition shrink-0"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            comment.likedByMe ? "text-rose-500 fill-rose-500" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {isExpanded && replies.length > 0 && (
                      <div className="pl-9 space-y-2 border-l border-border/50 ml-4 pt-1">
                        {replies.map((reply) => {
                          const isReplyOwner = Boolean(
                            user &&
                              ((reply.authorId && reply.authorId === user.id) ||
                                reply.username === user.username)
                          )
                          const isReplyByPostAuthor = Boolean(
                            reply.authorId && postData?.authorId && reply.authorId === postData.authorId
                          )
                          const canDeleteReply = isReplyOwner || isOwner
                          return (
                            <div
                              key={reply.id}
                              className="flex items-start justify-between gap-2 group"
                            >
                              <div className="flex gap-2.5 min-w-0 flex-1">
                                <Link href={`/u/${reply.username}`} className="shrink-0">
                                  <img
                                    src={reply.avatar}
                                    alt={reply.username}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                </Link>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <p className="leading-relaxed break-words">
                                    <Link
                                      href={`/u/${reply.username}`}
                                      className="font-semibold mr-1.5 hover:underline"
                                    >
                                      {reply.username}
                                    </Link>
                                    {isReplyByPostAuthor && (
                                      <AuthorBadge className="mr-1.5" />
                                    )}
                                    <span className="text-foreground/90">
                                      {reply.text}
                                    </span>
                                  </p>
                                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                    <TimeAgo date={reply.createdAt} />
                                    {reply.likeCount > 0 && (
                                      <span>{reply.likeCount} lượt thích</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleReplyClick(comment)}
                                      className="font-semibold hover:text-foreground transition"
                                    >
                                      Trả lời
                                    </button>
                                    {canDeleteReply && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteComment(reply, true, comment.id)
                                        }
                                        className="text-destructive hover:underline"
                                      >
                                        Xóa
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleLikeComment(reply, true, comment.id)
                                }
                                className="pt-1 text-muted-foreground hover:text-rose-500 transition shrink-0"
                              >
                                <Heart
                                  className={`w-3 h-3 ${
                                    reply.likedByMe
                                      ? "text-rose-500 fill-rose-500"
                                      : ""
                                  }`}
                                />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Actions Bar */}
          <div className="p-3.5 border-t border-border/60 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className="hover:opacity-75 transition active:scale-125 duration-100"
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      isLiked ? "text-rose-500 fill-rose-500" : "text-foreground"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleCommentButtonClick}
                  className="hover:opacity-75 transition"
                >
                  <MessageCircle className="w-6 h-6 -rotate-90" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isRealUuid && isAuthenticated) {
                      contentService
                        .interactPost(postId, { type: "SHARE" })
                        .catch(() => {})
                    }
                    toast.success("Đã sao chép liên kết bài viết!")
                  }}
                  className="hover:opacity-75 transition"
                >
                  <Send className="w-5 h-5 -rotate-12" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleToggleBookmark}
                className="hover:opacity-75 transition"
              >
                <Bookmark
                  className={`w-6 h-6 transition-colors ${
                    isBookmarked ? "text-foreground fill-foreground" : "text-foreground"
                  }`}
                />
              </button>
            </div>

            <p className="font-semibold text-xs">
              {likesCount.toLocaleString("vi-VN")} lượt thích
            </p>
            <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">
              {postData?.createdAt
                ? new Date(postData.createdAt).toLocaleDateString("vi-VN")
                : "1 ngày trước"}
            </span>
          </div>

          {replyingTo && (
            <div className="px-3.5 py-1.5 bg-muted/60 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Đang trả lời <strong className="text-foreground">@{replyingTo.username}</strong>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Add comment input */}
          <form
            onSubmit={handleAddComment}
            className="flex items-center gap-2 px-3.5 py-3 border-t border-border/60 shrink-0"
          >
            <Smile
              onClick={handleCommentButtonClick}
              className="w-5 h-5 text-muted-foreground shrink-0 cursor-pointer hover:text-foreground transition"
            />
            <input
              ref={commentInputRef}
              type="text"
              value={commentInput}
              onFocus={() => {
                if (!isAuthenticated) {
                  commentInputRef.current?.blur()
                  openLoginModal()
                }
              }}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={
                replyingTo
                  ? `Trả lời @${replyingTo.username}...`
                  : "Thêm bình luận..."
              }
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none border-none py-1"
            />
            {commentInput.trim() && (
              <button
                type="submit"
                className="text-xs font-semibold text-primary hover:text-primary/80 transition"
              >
                Đăng
              </button>
            )}
          </form>
        </div>
      </DialogContent>

      {reportTarget && (
        <ReportDialog
          open={Boolean(reportTarget)}
          onOpenChange={(open) => !open && setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetLabel={reportTarget.label}
        />
      )}
    </Dialog>
  )
}
