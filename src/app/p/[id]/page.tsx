"use client"

import React, { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bookmark,
  ChevronLeft,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
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
import SnapgramLogo from "@/components/logo/SnapgramLogo"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { contentService } from "@/services/content.service"
import { getErrorMessage } from "@/lib/api"
import { EditPostDialog } from "@/components/content/edit-post-dialog"
import { ReportDialog } from "@/components/content/report-dialog"
import { PostMediaCarousel } from "@/components/content/post-media-carousel"
import { AuthorBadge } from "@/components/content/author-badge"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { MediaPicker, type PickedMedia } from "@/components/ui/media-picker"
import { mediaService } from "@/services/media.service"
import { toast } from "sonner"
import type { CommentMediaType, CommentResponse, PostResponse, ReportTargetType } from "@/types/content.type"

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
  /** Số trả lời do backend trả về — dùng để quyết định có hiện nút "Xem trả lời". */
  replyCount?: number
  authorVerified?: boolean
  authorVerifiedUntil?: string
  mediaUrl?: string
  mediaType?: CommentMediaType
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
    replyCount: c.replyCount,
    authorVerified: Boolean(c.authorVerified),
    authorVerifiedUntil: c.authorVerifiedUntil,
    mediaUrl: c.mediaUrl,
    mediaType: c.mediaType,
    isReal: true,
  }
}

export default function PostPage({
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
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  // Edit & Report Modals
  const [isEditOpen, setIsEditOpen] = useState(false)
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
      // Fallback to mock view when post ID is local/mock
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
          // Keep optimistic UI
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
          // Keep optimistic UI
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
          // Keep optimistic UI
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
    setCommentInput("")
    await submitComment({ content })
  }

  /** Gửi bình luận (text hoặc kèm media) — dùng chung cho form và MediaPicker. */
  const submitComment = async (payload: {
    content: string
    mediaUrl?: string
    mediaType?: CommentMediaType
  }) => {
    const content = payload.content
    const parentCommentId = replyingTo?.id
    setReplyingTo(null)

    if (isRealUuid) {
      try {
        const created = await contentService.createComment(postId, {
          content,
          parentCommentId,
          mediaUrl: payload.mediaUrl,
          mediaType: payload.mediaType,
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
      mediaUrl: payload.mediaUrl,
      mediaType: payload.mediaType,
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

  /** Ảnh / sticker / GIF cho bình luận. */
  const handlePickCommentMedia = async (picked: PickedMedia) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    if (isUploadingMedia) return

    if (picked.kind === "STICKER") {
      await submitComment({ content: picked.emoji, mediaType: "STICKER" })
      return
    }
    if (picked.kind === "GIF") {
      await submitComment({ content: "", mediaUrl: picked.url, mediaType: "GIF" })
      return
    }

    setIsUploadingMedia(true)
    try {
      const uploaded = await mediaService.upload(picked.file)
      if (!uploaded?.url) throw new Error("Không nhận được URL ảnh")
      await submitComment({
        content: "",
        mediaUrl: uploaded.url,
        mediaType: "IMAGE",
      })
    } catch (err) {
      toast.error(getErrorMessage(err, "Không tải được ảnh lên."))
    } finally {
      setIsUploadingMedia(false)
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
  const authorVerified =
    postData?.authorId && user?.id === postData.authorId
      ? Boolean(user.verified)
      : Boolean(postData?.authorVerified)
  const authorVerifiedUntil =
    postData?.authorId && user?.id === postData.authorId
      ? user.verifiedUntil
      : postData?.authorVerifiedUntil
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

  const handleToggleFollowAuthor = () => {
    requireAuth(async () => {
      if (isOwner) {
        toast.error("Bạn không thể tự theo dõi chính mình.")
        return
      }
      const next = !isFollowing
      setIsFollowing(next)
      if (postData?.authorId) {
        try {
          if (next) {
            await contentService.followUser(postData.authorId)
          } else {
            await contentService.unfollowUser(postData.authorId)
          }
        } catch {
          // Optimistic
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 border-b border-border/60 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-full hover:bg-muted transition text-foreground"
            aria-label="Quay về trang chủ"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Link href="/">
            <SnapgramLogo className="h-7 w-auto" />
          </Link>
        </div>

        <Link
          href="/"
          className="text-xs font-semibold text-primary hover:underline"
        >
          Về bảng tin
        </Link>
      </header>

      {/* Main Post Container */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl border border-border rounded-xl overflow-hidden bg-card shadow-lg flex flex-col md:flex-row min-h-[540px] max-h-[82vh]">
          {/* Left: Media */}
          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
            <PostMediaCarousel
              items={
                postData?.mediaItems && postData.mediaItems.length > 0
                  ? postData.mediaItems
                  : [{ mediaUrl: postMediaUrl }]
              }
              alt={`Post ${postId}`}
              aspectRatioClassName="w-full h-full min-h-[300px]"
              objectFit="contain"
            />
          </div>

          {/* Right: Details & Comments */}
          <div className="w-full md:w-[370px] lg:w-[410px] flex flex-col border-t md:border-t-0 md:border-l border-border bg-card">
            {/* Author Header */}
            <div className="p-3.5 border-b border-border/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Link
                  href={`/u/${authorUsername}`}
                  className="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600"
                >
                  <img
                    src={authorAvatar}
                    alt={authorUsername}
                    className="w-8 h-8 rounded-full object-cover bg-background p-0.5"
                  />
                </Link>
                <div className="text-xs">
                  <Link
                    href={`/u/${authorUsername}`}
                    className="font-semibold text-foreground hover:underline"
                  >
                    {authorUsername}
                  </Link>
                  <VerifiedBadge
                    verified={authorVerified}
                    verifiedUntil={authorVerifiedUntil}
                    size={13}
                    className="ml-1"
                  />
                  {!isOwner && (
                    <>
                      <span className="text-muted-foreground mx-1.5">•</span>
                      <button
                        type="button"
                        onClick={handleToggleFollowAuthor}
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {isOwner ? (
                    <DropdownMenuItem
                      onClick={() => setIsEditOpen(true)}
                      className="text-xs gap-2 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa / Xóa bài</span>
                    </DropdownMenuItem>
                  ) : (
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
                      className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Báo cáo bài viết</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
              {/* Author Caption */}
              <div className="flex gap-3">
                <img
                  src={authorAvatar}
                  alt={authorUsername}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="space-y-1">
                  <p className="leading-relaxed">
                    <span className="font-semibold mr-1.5">{authorUsername}</span>
                    <VerifiedBadge
                      verified={authorVerified}
                      verifiedUntil={authorVerifiedUntil}
                      size={12}
                      className="mr-1.5"
                    />
                    <span className="text-foreground/90">{postCaption}</span>
                  </p>
                  <TimeAgo
                    date={postData?.createdAt || "2025-01-01T00:00:00Z"}
                    className="text-[10px] text-muted-foreground block"
                  />
                </div>
              </div>

              {/* User Comments & Replies */}
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
                            <Link
                              href={`/u/${comment.username}`}
                              className="font-semibold mr-1.5 hover:underline"
                            >
                              {comment.username}
                            </Link>
                            <VerifiedBadge
                              verified={comment.authorVerified}
                              verifiedUntil={comment.authorVerifiedUntil}
                              size={12}
                              className="mr-1.5"
                            />
                            {isCommentByPostAuthor && (
                              <AuthorBadge className="mr-1.5" />
                            )}
                            {comment.mediaType !== "STICKER" && (
                              <span className="text-foreground/90">{comment.text}</span>
                            )}
                          </p>
                          {comment.mediaType === "STICKER" && comment.text && (
                            <span className="inline-block text-4xl leading-none mt-0.5 select-none">
                              {comment.text}
                            </span>
                          )}
                          {(comment.mediaType === "IMAGE" ||
                            comment.mediaType === "GIF") &&
                            comment.mediaUrl && (
                              <a
                                href={comment.mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block mt-1 w-fit"
                              >
                                <img
                                  src={comment.mediaUrl}
                                  alt="media"
                                  loading="lazy"
                                  className="max-w-[180px] max-h-[220px] rounded-lg border border-border object-cover"
                                />
                              </a>
                            )}
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
                            {(isExpanded || replies.length > 0 || (comment.replyCount ?? 0) > 0) && (
                              <button
                                type="button"
                                onClick={() => handleLoadReplies(comment.id)}
                                className="font-semibold hover:text-foreground transition"
                              >
                                {isExpanded
                                  ? "Ẩn câu trả lời"
                                  : `Xem câu trả lời${(comment.replyCount ?? replies.length) > 0 ? ` (${comment.replyCount ?? replies.length})` : ""}`}
                              </button>
                            )}
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
                                title="Báo cáo bình luận"
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

                    {/* Nested Replies */}
                    {isExpanded && replies.length > 0 && (
                      <div className="pl-10 space-y-2.5 border-l border-border/50 ml-4">
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
                                    <VerifiedBadge
                                      verified={reply.authorVerified}
                                      verifiedUntil={reply.authorVerifiedUntil}
                                      size={11}
                                      className="mr-1.5"
                                    />
                                    {isReplyByPostAuthor && (
                                      <AuthorBadge className="mr-1.5" />
                                    )}
                                    {reply.mediaType !== "STICKER" && (
                                      <span className="text-foreground/90">
                                        {reply.text}
                                      </span>
                                    )}
                                  </p>
                                  {reply.mediaType === "STICKER" && reply.text && (
                                    <span className="inline-block text-3xl leading-none mt-0.5 select-none">
                                      {reply.text}
                                    </span>
                                  )}
                                  {(reply.mediaType === "IMAGE" ||
                                    reply.mediaType === "GIF") &&
                                    reply.mediaUrl && (
                                      <a
                                        href={reply.mediaUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block mt-1 w-fit"
                                      >
                                        <img
                                          src={reply.mediaUrl}
                                          alt="media"
                                          loading="lazy"
                                          className="max-w-[160px] max-h-[200px] rounded-lg border border-border object-cover"
                                        />
                                      </a>
                                    )}
                                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                    <TimeAgo date={reply.createdAt} />
                                    {reply.likeCount > 0 && (
                                      <span>{reply.likeCount} lượt thích</span>
                                    )}
                                    {canDeleteReply && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteComment(reply, true, comment.id)
                                        }
                                        className="text-destructive"
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
                                className="pt-1 text-muted-foreground hover:text-rose-500 transition"
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
              }))}
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
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard
                          .writeText(window.location.href)
                          .catch(() => {})
                        toast.success("Đã sao chép liên kết bài viết!")
                      }
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

            {/* Reply indicator */}
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

            {/* Comment Form */}
            <form
              onSubmit={handleAddComment}
              className="flex items-center gap-2 px-3.5 py-3 border-t border-border/60 shrink-0"
            >
              <MediaPicker
                onPick={handlePickCommentMedia}
                disabled={isUploadingMedia}
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
        </div>
      </main>

      {/* Edit Post Modal */}
      {postData && (
        <EditPostDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          postId={postId}
          initialCaption={postData.caption}
          initialTags={postData.tags}
          initialVisibility={postData.visibility}
          onUpdated={(updated) => setPostData(updated)}
          onDeleted={() => router.push("/")}
        />
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportDialog
          open={Boolean(reportTarget)}
          onOpenChange={(open) => !open && setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetLabel={reportTarget.label}
        />
      )}
    </div>
  )
}
