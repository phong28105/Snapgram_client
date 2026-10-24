"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import TimeAgo from "@/components/ui/time-ago"
import { BsThreeDots } from "react-icons/bs"
import {
  Bookmark,
  Camera,
  Compass,
  Flag,
  FolderPlus,
  Heart,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Smile,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { contentService } from "@/services/content.service"
import { getErrorMessage } from "@/lib/api"
import { EditPostDialog } from "@/components/content/edit-post-dialog"
import { ReportDialog } from "@/components/content/report-dialog"
import { toast } from "sonner"
import type { CollectionResponse, ContentVisibility, PostResponse } from "@/types/content.type"
import { PostMediaCarousel } from "@/components/content/post-media-carousel"
import { AuthorBadge } from "@/components/content/author-badge"

interface CommentItem {
  id: string
  username: string
  text: string
  /** Có khi bình luận đến từ API (dùng để nhận biết bình luận của tác giả bài viết) */
  authorId?: string
}

interface PostProps {
  id: string
  authorId?: string
  author: {
    username: string
    displayName?: string
    avatar: string
  }
  image: string
  mediaItems?: Array<{
    id?: string
    mediaUrl: string
    thumbnailUrl?: string
    mediaType?: string
  }>
  caption: string
  tags?: string
  visibility?: ContentVisibility
  initialLikes: number
  likedByMe?: boolean
  initialComments: CommentItem[]
  commentCount?: number
  createdAt: string
  isReal?: boolean
  recommendationReason?: string
}

function mapPostResponseToCard(
  p: PostResponse,
  currentUserId?: string,
  currentUsername?: string,
  currentAvatar?: string
): PostProps {
  const isMe = Boolean(currentUserId && p.authorId === currentUserId)
  const firstMedia = p.mediaItems?.[0]?.mediaUrl || p.mediaUrl || "/profile.jpg"
  const username = isMe
    ? currentUsername || "me"
    : p.authorUsername || p.authorId || "snapgram_user"
  const displayName = isMe
    ? currentUsername
    : p.authorDisplayName || p.authorUsername || username
  const avatar = isMe && currentAvatar
    ? currentAvatar
    : p.authorAvatarUrl || "/profile.jpg"

  return {
    id: p.id,
    authorId: p.authorId,
    author: {
      username,
      displayName,
      avatar,
    },
    image: firstMedia,
    mediaItems: p.mediaItems && p.mediaItems.length > 0 ? p.mediaItems : [{ mediaUrl: firstMedia }],
    caption: p.caption || "",
    tags: p.tags,
    visibility: p.visibility,
    initialLikes: p.likeCount ?? 0,
    likedByMe: p.likedByMe ?? false,
    initialComments: [],
    commentCount: p.commentCount ?? 0,
    createdAt: p.createdAt || new Date().toISOString(),
    isReal: true,
    recommendationReason: p.recommendationReason,
  }
}

function PostCard({
  post,
  onPostUpdated,
  onPostDeleted,
}: {
  post: PostProps
  onPostUpdated: (id: string, updated: PostResponse) => void
  onPostDeleted: (id: string) => void
}) {
  const { user, isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [isLiked, setIsLiked] = useState(Boolean(post.likedByMe))
  const [likesCount, setLikesCount] = useState(post.initialLikes)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>(post.initialComments)
  const [commentInput, setCommentInput] = useState("")
  const [showHeartPop, setShowHeartPop] = useState(false)

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isCollectionOpen, setIsCollectionOpen] = useState(false)
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [newCollectionName, setNewCollectionName] = useState("")

  const isOwner = Boolean(
    user &&
      ((post.authorId && post.authorId === user.id) ||
        post.author.username === user.username)
  )

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    const nextLiked = !isLiked
    setIsLiked(nextLiked)
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)))

    if (post.isReal) {
      try {
        if (nextLiked) {
          await contentService.interactPost(post.id, { type: "LIKE" })
        } else {
          await contentService.unlikePost(post.id)
        }
      } catch {
        // Optimistic UI fallback
      }
    }
  }

  const handleDoubleTap = () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    if (!isLiked) {
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)
      if (post.isReal) {
        contentService.interactPost(post.id, { type: "LIKE" }).catch(() => {})
      }
    }
    setShowHeartPop(true)
    setTimeout(() => setShowHeartPop(false), 900)
  }

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    const nextSaved = !isBookmarked
    setIsBookmarked(nextSaved)

    if (post.isReal) {
      try {
        if (nextSaved) {
          await contentService.savePost(post.id)
          await contentService.interactPost(post.id, { type: "SAVE" }).catch(() => {})
          toast.success("Đã lưu bài viết!")
        } else {
          await contentService.unsavePost(post.id)
          toast.success("Đã bỏ lưu bài viết.")
        }
      } catch {
        // Keep optimistic state
      }
    } else {
      toast.success(nextSaved ? "Đã lưu bài viết!" : "Đã bỏ lưu bài viết.")
    }
  }

  const handleOpenSaveToCollection = async () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    setIsCollectionOpen(true)
    try {
      const list = await contentService.getMyCollections()
      setCollections(list || [])
    } catch {
      setCollections([])
    }
  }

  const handleSaveIntoCollection = async (collectionId?: string) => {
    try {
      if (post.isReal) {
        await contentService.savePost(post.id, { collectionId })
      }
      setIsBookmarked(true)
      setIsCollectionOpen(false)
      toast.success("Đã lưu bài viết vào bộ sưu tập!")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể lưu vào bộ sưu tập."))
    }
  }

  const handleCreateCollectionAndSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollectionName.trim()) return
    try {
      const created = await contentService.createCollection({
        name: newCollectionName.trim(),
        private: true,
      })
      setCollections((prev) => [created, ...prev])
      setNewCollectionName("")
      await handleSaveIntoCollection(created.id)
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể tạo bộ sưu tập mới."))
    }
  }

  const handleSharePost = () => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/p/${post.id}`
        : `/p/${post.id}`

    if (post.isReal && isAuthenticated) {
      contentService.interactPost(post.id, { type: "SHARE" }).catch(() => {})
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: post.author.username,
          url: shareUrl,
        })
        .catch(() => {})
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {})
      toast.success("Đã sao chép liên kết bài viết!")
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

    const optimistic: CommentItem = {
      id: Date.now().toString(),
      username: user?.username || "me",
      text: content,
    }
    setComments((prev) => [...prev, optimistic])

    if (post.isReal) {
      try {
        await contentService.createComment(post.id, { content })
      } catch (err) {
        toast.error(getErrorMessage(err, "Không thể gửi bình luận."))
      }
    }
  }

  const handleDeleteDirect = async () => {
    if (!post.isReal) {
      onPostDeleted(post.id)
      toast.success("Đã ẩn bài viết.")
      return
    }
    try {
      await contentService.deletePost(post.id)
      onPostDeleted(post.id)
      toast.success("Đã xóa bài viết.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa bài viết."))
    }
  }

  const totalCommentsCount = Math.max(
    post.commentCount ?? 0,
    comments.length
  )

  return (
    <div className="flex flex-col border-b border-border/60 pb-5 pt-3">
      {/* Header: Author info & options */}
      <div className="flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-3">
          <Link
            href={`/u/${post.author.username}`}
            className="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600"
          >
            <img
              src={post.author.avatar}
              alt={post.author.username}
              className="w-8 h-8 rounded-full object-cover bg-background p-0.5 select-none"
            />
          </Link>
          <div className="flex items-center gap-1.5 text-xs">
            <Link
              href={`/u/${post.author.username}`}
              className="font-semibold text-foreground tracking-tight hover:underline cursor-pointer"
            >
              {post.author.username}
            </Link>
            <span className="text-muted-foreground">•</span>
            <TimeAgo date={post.createdAt} className="text-muted-foreground" />
            {post.recommendationReason && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full font-normal">
                  {post.recommendationReason}
                </span>
              </>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition p-1"
              aria-label="Tùy chọn bài viết"
            >
              <BsThreeDots className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleOpenSaveToCollection} className="text-xs gap-2 cursor-pointer">
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Lưu vào bộ sưu tập</span>
            </DropdownMenuItem>

            {isOwner ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsEditOpen(true)}
                  className="text-xs gap-2 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa bài viết</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteDirect}
                  className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa bài viết</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (!isAuthenticated) {
                      openLoginModal()
                      return
                    }
                    setIsReportOpen(true)
                  }}
                  className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Báo cáo vi phạm</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post Media Carousel with arrows, pagination dots and double-tap heart */}
      <PostMediaCarousel
        items={
          post.mediaItems && post.mediaItems.length > 0
            ? post.mediaItems
            : [{ mediaUrl: post.image }]
        }
        alt={post.caption}
        aspectRatioClassName="aspect-square"
        onDoubleTap={handleDoubleTap}
        showHeartPop={showHeartPop}
        linkHref={`/p/${post.id}`}
      />

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
            onClick={handleSharePost}
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
        <Link
          href={`/u/${post.author.username}`}
          className="font-semibold mr-1.5 hover:underline"
        >
          {post.author.username}
        </Link>
        <span className="text-foreground/90">{post.caption}</span>
      </div>

      {/* View Comments Link */}
      {totalCommentsCount > 0 && (
        <Link
          href={`/p/${post.id}`}
          scroll={false}
          className="px-1 text-xs text-muted-foreground mt-1 hover:text-foreground transition block"
        >
          Xem tất cả {totalCommentsCount} bình luận
        </Link>
      )}

      {/* Top 2 Comments preview */}
      <div className="px-1 space-y-1 mt-1 text-xs">
        {comments.slice(-2).map((c) => {
          // Bình luận của chính tác giả bài viết -> gắn badge "Tác giả"
          const isByPostAuthor = Boolean(
            (c.authorId && post.authorId && c.authorId === post.authorId) ||
              (c.username &&
                post.author.username &&
                c.username.toLowerCase() === post.author.username.toLowerCase())
          )
          return (
            <div key={c.id} className="leading-tight">
              <span className="font-semibold mr-1.5">{c.username}</span>
              {isByPostAuthor && <AuthorBadge className="mr-1.5" />}
              <span className="text-foreground/90">{c.text}</span>
            </div>
          )
        })}
      </div>

      {/* Inline Comment Input Form */}
      <form
        onSubmit={handleAddComment}
        className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40 px-1"
      >
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

      {/* Edit Post Modal */}
      <EditPostDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        postId={post.id}
        initialCaption={post.caption}
        initialTags={post.tags}
        initialVisibility={post.visibility}
        onUpdated={(updated) => onPostUpdated(post.id, updated)}
        onDeleted={(deletedId) => onPostDeleted(deletedId)}
      />

      {/* Report Post Modal */}
      <ReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        targetType="POST"
        targetId={post.id}
        targetLabel={`@${post.author.username}`}
      />

      {/* Save to Collection Dialog */}
      <Dialog open={isCollectionOpen} onOpenChange={setIsCollectionOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Lưu vào bộ sưu tập
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="max-h-48 overflow-y-auto divide-y divide-border/40">
              <button
                type="button"
                onClick={() => handleSaveIntoCollection(undefined)}
                className="w-full flex items-center justify-between py-2.5 px-2 hover:bg-muted/50 rounded-lg text-xs font-medium transition"
              >
                <span>Tất cả bài viết đã lưu</span>
                <Bookmark className="w-3.5 h-3.5 text-primary" />
              </button>

              {collections.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => handleSaveIntoCollection(col.id)}
                  className="w-full flex items-center justify-between py-2.5 px-2 hover:bg-muted/50 rounded-lg text-xs font-medium transition"
                >
                  <span>{col.name}</span>
                  <FolderPlus className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>

            <form
              onSubmit={handleCreateCollectionAndSave}
              className="flex items-center gap-2 pt-2 border-t border-border/50"
            >
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Tên bộ sưu tập mới..."
                className="h-8 text-xs"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newCollectionName.trim()}
                className="h-8 text-xs shrink-0"
              >
                Tạo & Lưu
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function Pages() {
  const { user, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<PostProps[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadFeed = useCallback(async () => {
    setIsLoading(true)
    try {
      let items: PostResponse[] = []

      if (isAuthenticated) {
        try {
          const feedRes = await contentService.getFeedPosts(0, 20)
          items = feedRes.content || []
        } catch {
          items = []
        }
      }

      if (items.length === 0) {
        try {
          const exploreRes = await contentService.getExplorePosts(0, 20)
          items = exploreRes.content || []
        } catch {
          items = []
        }
      }

      const mapped = items.map((p) =>
        mapPostResponseToCard(p, user?.id, user?.username, user?.avatarUrl)
      )
      setPosts(mapped)
    } catch {
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user?.id, user?.username, user?.avatarUrl])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  useEffect(() => {
    const handlePostCreated = () => {
      loadFeed()
    }
    const handleFollowUpdated = () => {
      loadFeed()
    }

    window.addEventListener("snapgram:post-created", handlePostCreated)
    window.addEventListener("snapgram:follow-updated", handleFollowUpdated)

    return () => {
      window.removeEventListener("snapgram:post-created", handlePostCreated)
      window.removeEventListener("snapgram:follow-updated", handleFollowUpdated)
    }
  }, [loadFeed])

  const handlePostUpdated = (id: string, updated: PostResponse) => {
    setPosts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              caption: updated.caption ?? item.caption,
              tags: updated.tags ?? item.tags,
              visibility: updated.visibility ?? item.visibility,
            }
          : item
      )
    )
  }

  const handlePostDeleted = (id: string) => {
    setPosts((prev) => prev.filter((item) => item.id !== id))
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-[470px] mx-auto space-y-6 pt-2">
        {[1, 2].map((i) => (
          <div key={i} className="border-b border-border/60 pb-5 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-28 bg-muted rounded" />
                <div className="h-2 w-16 bg-muted rounded" />
              </div>
            </div>
            <div className="aspect-square w-full rounded-md bg-muted" />
            <div className="flex items-center gap-4 pt-1">
              <div className="w-6 h-6 rounded-full bg-muted" />
              <div className="w-6 h-6 rounded-full bg-muted" />
              <div className="w-6 h-6 rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="w-full max-w-[470px] mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mx-auto text-muted-foreground">
          <Camera className="w-8 h-8 opacity-70" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            Chưa có bài viết mới
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Hãy theo dõi thêm người dùng mới hoặc bấm nút tạo bài viết để chia sẻ khoảnh khắc đầu tiên của bạn!
          </p>
        </div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
        >
          <Compass className="w-4 h-4" />
          <span>Khám phá mọi người</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[470px] mx-auto space-y-2">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
        />
      ))}
    </div>
  )
}
