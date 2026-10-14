"use client"

import React, { use, useState } from "react"
import Link from "next/link"
import { Bookmark, ChevronLeft, Heart, MessageCircle, MoreHorizontal, Send, Smile } from "lucide-react"
import TimeAgo from "@/components/ui/time-ago"
import SnapgramLogo from "@/components/logo/SnapgramLogo"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"

interface CommentItem {
  id: string
  username: string
  avatar: string
  text: string
  createdAt: string
}

export default function PostPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
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

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    if (isLiked) {
      setIsLiked(false)
      setLikesCount((prev) => Math.max(0, prev - 1))
    } else {
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)
    }
  }

  const handleToggleBookmark = () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    setIsBookmarked((prev) => !prev)
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
    }

    setComments((prev) => [...prev, newComment])
    setCommentInput("")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 border-b border-border/60 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Trang chủ</span>
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <SnapgramLogo className="w-24 h-auto text-foreground" />
        </div>

        <div>
          {isAuthenticated ? (
            <span className="text-xs text-muted-foreground">@{user?.username}</span>
          ) : (
            <button
              onClick={openLoginModal}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </header>

      {/* Main Post Presentation */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row h-auto md:h-[650px]">
          {/* Post Media */}
          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[360px] md:min-h-full">
            <img
              src="/profile.jpg"
              alt="Post media"
              className="w-full h-full object-contain max-h-[650px]"
            />
          </div>

          {/* Details & Comments */}
          <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col h-full bg-card border-t md:border-t-0 md:border-l border-border/70">
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
                  <span className="text-xs text-muted-foreground">•</span>
                  <button type="button" className="text-xs font-semibold text-primary hover:text-primary/80 transition">
                    Theo dõi
                  </button>
                </div>
              </div>

              <button type="button" className="text-muted-foreground hover:text-foreground transition p-1">
                <MoreHorizontal className="size-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <img
                  src="/profile.jpg"
                  alt="snapgram_official"
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="space-y-1">
                  <p className="leading-relaxed">
                    <span className="font-semibold mr-1.5">snapgram_official</span>
                    Chào mừng bạn đến với Snapgram! Nơi chia sẻ những khoảnh khắc tuyệt vời nhất 📸✨
                  </p>
                  <span className="text-[11px] text-muted-foreground block">1 ngày trước</span>
                </div>
              </div>

              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <img
                    src={comment.avatar}
                    alt={comment.username}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="space-y-1 flex-1">
                    <p className="leading-relaxed">
                      <span className="font-semibold mr-1.5">{comment.username}</span>
                      {comment.text}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <TimeAgo date={comment.createdAt} />
                      <button type="button" className="font-semibold hover:text-foreground transition">
                        Trả lời
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                  <button type="button" className="hover:opacity-75 transition">
                    <MessageCircle className="w-6 h-6 -rotate-90" />
                  </button>
                  <button type="button" className="hover:opacity-75 transition">
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

            {/* Comment Form */}
            <form
              onSubmit={handleAddComment}
              className="flex items-center gap-2 px-3.5 py-3 border-t border-border/60 shrink-0"
            >
              <Smile className="w-5 h-5 text-muted-foreground shrink-0 cursor-pointer hover:text-foreground transition" />
              <input
                type="text"
                value={commentInput}
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
        </div>
      </main>
    </div>
  )
}
