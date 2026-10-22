"use client"

import React, { use, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Bookmark, Heart, MessageCircle, Send, Smile, MoreHorizontal } from "lucide-react"
import TimeAgo from "@/components/ui/time-ago"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { VerifiedBadge } from "@/components/ui/verified-badge"

interface CommentItem {
  id: string
  username: string
  avatar: string
  text: string
  createdAt: string
  verified?: boolean
  verifiedUntil?: string
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

  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(1420)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([
    {
      id: "c1",
      username: "alex_dev",
      avatar: "/profile.jpg",
      text: "Giao diện mượt mà và đẹp quá!",
      createdAt: "2025-01-01T02:00:00Z",
      verified: true,
    },
    {
      id: "c2",
      username: "sarah_travel",
      avatar: "/profile.jpg",
      text: "Thích thiết kế tối giản phong cách Instagram này ❤️",
      createdAt: "2025-01-01T04:15:00Z",
    },
    {
      id: "c3",
      username: "huyen_tran",
      avatar: "/profile.jpg",
      text: "Chụp bằng camera gì mà nét căng thế bạn?",
      createdAt: "2025-01-01T06:40:00Z",
    },
  ])
  const [commentInput, setCommentInput] = useState("")
  const [isFollowing, setIsFollowing] = useState(false)
  const commentInputRef = React.useRef<HTMLInputElement | null>(null)

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    action()
  }

  const handleToggleLike = () => {
    requireAuth(() => {
      if (isLiked) {
        setIsLiked(false)
        setLikesCount((prev) => Math.max(0, prev - 1))
      } else {
        setIsLiked(true)
        setLikesCount((prev) => prev + 1)
      }
    })
  }

  const handleToggleBookmark = () => {
    requireAuth(() => {
      setIsBookmarked((prev) => !prev)
    })
  }

  const handleCommentButtonClick = () => {
    requireAuth(() => {
      commentInputRef.current?.focus()
    })
  }

  const handleReplyClick = (username: string) => {
    requireAuth(() => {
      setCommentInput(`@${username} `)
      commentInputRef.current?.focus()
    })
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim()) return

    if (!isAuthenticated) {
      openLoginModal()
      return
    }

    const newComment: CommentItem = {
      id: Date.now().toString(),
      username: user?.username || "me",
      avatar: user?.avatarUrl || "/profile.jpg",
      text: commentInput.trim(),
      createdAt: new Date().toISOString(),
      verified: user?.verified,
      verifiedUntil: user?.verifiedUntil,
    }

    setComments((prev) => [...prev, newComment])
    setCommentInput("")
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          router.back()
        }
      }}
    >
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-border bg-background sm:rounded-xl shadow-2xl h-[85vh] max-h-[700px] flex flex-col md:flex-row gap-0">
        <DialogTitle className="sr-only">Chi tiết bài viết {postId}</DialogTitle>

        {/* Media Preview (Left / Top on mobile) */}
        <div
          className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-full cursor-pointer select-none"
          onDoubleClick={handleToggleLike}
        >
          <img
            src="/profile.jpg"
            alt="Post content"
            className="w-full h-full object-contain max-h-[85vh]"
          />
        </div>

        {/* Details & Comments (Right panel) */}
        <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col h-full bg-background border-l border-border/70">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600">
                <img
                  src="/profile.jpg"
                  alt="snapgram_official"
                  className="w-8 h-8 rounded-full object-cover bg-background p-0.5"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs tracking-tight">snapgram_official</span>
                <VerifiedBadge verified size={13} />
                <span className="text-xs text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={() => requireAuth(() => setIsFollowing((p) => !p))}
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition"
                >
                  {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => requireAuth(() => {})}
              className="text-muted-foreground hover:text-foreground transition p-1"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>

          {/* Scrollable Comments & Caption list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Post Author Caption */}
            <div className="flex items-start gap-3">
              <img
                src="/profile.jpg"
                alt="snapgram_official"
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div className="space-y-1">
                <p className="leading-relaxed">
                  <span className="font-semibold mr-1.5 inline-flex items-center gap-1">
                    snapgram_official
                    <VerifiedBadge verified size={12} />
                  </span>
                  Chào mừng bạn đến với Snapgram! Nơi chia sẻ những khoảnh khắc tuyệt vời nhất 📸✨
                </p>
                <span className="text-[11px] text-muted-foreground block">1 ngày trước</span>
              </div>
            </div>

            {/* List of comments */}
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <img
                  src={comment.avatar}
                  alt={comment.username}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="space-y-1 flex-1">
                  <p className="leading-relaxed">
                    <span className="font-semibold mr-1.5 inline-flex items-center gap-1">
                      {comment.username}
                      <VerifiedBadge
                        verified={comment.verified}
                        verifiedUntil={comment.verifiedUntil}
                        size={12}
                      />
                    </span>
                    {comment.text}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <TimeAgo date={comment.createdAt} />
                    <button
                      type="button"
                      onClick={() => handleReplyClick(comment.username)}
                      className="font-semibold hover:text-foreground transition"
                    >
                      Trả lời
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions & Likes count */}
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
                  onClick={() => requireAuth(() => {})}
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

            <p className="font-semibold text-xs">{likesCount.toLocaleString("vi-VN")} lượt thích</p>
            <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">
              1 ngày trước
            </span>
          </div>

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
              placeholder="Thêm bình luận..."
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
    </Dialog>
  )
}
