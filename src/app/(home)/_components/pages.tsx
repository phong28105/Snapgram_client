"use client"

import React, { useState } from "react"
import Link from "next/link"
import TimeAgo from "@/components/ui/time-ago"
import { BsThreeDots } from "react-icons/bs"
import { Bookmark, Heart, MessageCircle, Send, Smile } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"

interface CommentItem {
  id: string
  username: string
  text: string
}

interface PostProps {
  id: string
  author: {
    username: string
    avatar: string
  }
  image: string
  caption: string
  initialLikes: number
  initialComments: CommentItem[]
  createdAt: string
}

const mockPosts: PostProps[] = [
  {
    id: "post-1",
    author: {
      username: "snapgram_official",
      avatar: "/profile.jpg",
    },
    image: "/profile.jpg",
    caption: "Chào mừng bạn đến với Snapgram! Nơi chia sẻ những khoảnh khắc tuyệt vời nhất 📸✨",
    initialLikes: 1420,
    initialComments: [
      { id: "c1", username: "alex_dev", text: "Giao diện mượt mà và đẹp quá!" },
      { id: "c2", username: "sarah_travel", text: "Thích thiết kế tối giản phong cách Instagram này ❤️" },
    ],
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "post-2",
    author: {
      username: "designer_vibes",
      avatar: "/profile.jpg",
    },
    image: "/profile.jpg",
    caption: "Màu hoàng hôn chiều nay qua góc nhìn ống kính mới 🌅",
    initialLikes: 890,
    initialComments: [
      { id: "c3", username: "huyen_tran", text: "Tone màu ấm áp quá!" },
    ],
    createdAt: "2025-01-02T12:00:00Z",
  },
  {
    id: "post-3",
    author: {
      username: "daily_photography",
      avatar: "/profile.jpg",
    },
    image: "/profile.jpg",
    caption: "Minimalist street style. Đôi khi sự đơn giản chính là điểm nhấn tinh tế nhất.",
    initialLikes: 2541,
    initialComments: [
      { id: "c4", username: "khoi_nguyen", text: "Góc chụp đỉnh chóp luôn bạn ơi!" },
    ],
    createdAt: "2025-01-03T08:30:00Z",
  },
]

function PostCard({ post }: { post: PostProps }) {
  const { user, isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.initialLikes)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>(post.initialComments)
  const [commentInput, setCommentInput] = useState("")
  const [showHeartPop, setShowHeartPop] = useState(false)

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

  const handleDoubleTap = () => {
    if (!isLiked) {
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)
    }
    setShowHeartPop(true)
    setTimeout(() => setShowHeartPop(false), 900)
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
      text: commentInput.trim(),
    }

    setComments((prev) => [...prev, newComment])
    setCommentInput("")
  }

  return (
    <div className="flex flex-col border-b border-border/60 pb-5 pt-3">
      {/* Header: Author info & options */}
      <div className="flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-3">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600">
            <img
              src={post.author.avatar}
              alt={post.author.username}
              className="w-8 h-8 rounded-full object-cover bg-background p-0.5 select-none"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-foreground tracking-tight hover:underline cursor-pointer">
              {post.author.username}
            </span>
            <span className="text-muted-foreground">•</span>
            <TimeAgo date={post.createdAt} className="text-muted-foreground" />
          </div>
        </div>

        <button type="button" className="text-muted-foreground hover:text-foreground transition p-1">
          <BsThreeDots className="size-4" />
        </button>
      </div>

      {/* Post Image with Double Tap Heart effect */}
      <div
        className="relative aspect-square w-full rounded-md overflow-hidden bg-muted/40 cursor-pointer select-none"
        onDoubleClick={handleDoubleTap}
      >
        <Link href={`/p/${post.id}`} scroll={false}>
          <img
            src={post.image}
            alt={post.caption}
            className="w-full h-full object-cover transition-transform duration-200"
          />
        </Link>

        {showHeartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-50 duration-200">
            <Heart className="w-24 h-24 text-white fill-white drop-shadow-xl animate-pulse" />
          </div>
        )}
      </div>

      {/* Action Buttons: Like, Comment, Share, Bookmark */}
      <div className="flex items-center justify-between pt-3 pb-1 px-1">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleToggleLike}
            className="hover:opacity-75 transition active:scale-125 duration-100"
            aria-label="Thích bài viết"
          >
            <Heart
              className={`w-6 h-6 transition-colors ${
                isLiked ? "text-rose-500 fill-rose-500" : "text-foreground"
              }`}
            />
          </button>

          <Link
            href={`/p/${post.id}`}
            scroll={false}
            className="hover:opacity-75 transition text-foreground"
            aria-label="Bình luận"
          >
            <MessageCircle className="w-6 h-6 -rotate-90" />
          </Link>

          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: post.author.username,
                  url: window.location.origin + `/p/${post.id}`,
                }).catch(() => {})
              }
            }}
            className="hover:opacity-75 transition text-foreground"
            aria-label="Chia sẻ"
          >
            <Send className="w-5 h-5 -rotate-12" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleToggleBookmark}
          className="hover:opacity-75 transition"
          aria-label="Lưu bài viết"
        >
          <Bookmark
            className={`w-6 h-6 transition-colors ${
              isBookmarked ? "text-foreground fill-foreground" : "text-foreground"
            }`}
          />
        </button>
      </div>

      {/* Likes Count */}
      <div className="px-1 text-xs font-semibold mt-1">
        {likesCount.toLocaleString("vi-VN")} lượt thích
      </div>

      {/* Caption */}
      <div className="px-1 text-xs mt-1 leading-relaxed">
        <span className="font-semibold mr-1.5">{post.author.username}</span>
        <span className="text-foreground/90">{post.caption}</span>
      </div>

      {/* View Comments Link */}
      {comments.length > 0 && (
        <Link
          href={`/p/${post.id}`}
          scroll={false}
          className="px-1 text-xs text-muted-foreground mt-1 hover:text-foreground transition block"
        >
          Xem tất cả {comments.length} bình luận
        </Link>
      )}

      {/* Top 2 Comments preview */}
      <div className="px-1 space-y-1 mt-1 text-xs">
        {comments.slice(-2).map((c) => (
          <div key={c.id} className="leading-tight">
            <span className="font-semibold mr-1.5">{c.username}</span>
            <span className="text-foreground/90">{c.text}</span>
          </div>
        ))}
      </div>

      {/* Inline Comment Input Form */}
      <form onSubmit={handleAddComment} className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40 px-1">
        <Smile className="w-4 h-4 text-muted-foreground shrink-0" />
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
  )
}

export default function Pages() {
  return (
    <div className="w-full max-w-[470px] mx-auto space-y-2">
      {mockPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
