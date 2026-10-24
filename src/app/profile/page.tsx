"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Bookmark,
  Camera,
  Film,
  FolderPlus,
  Globe,
  Grid,
  Heart,
  Layers,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquarePlus,
  Plus,
  Settings,
  Tag,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { CreateHighlightDialog } from "@/components/content/create-highlight-dialog"
import { HighlightViewer } from "@/components/content/highlight-viewer"
import type { HighlightResponse } from "@/types/content.type"
import Sidebar from "@/app/(home)/_components/sidebar"
import Navbot from "@/app/(home)/_components/navbot"
import Navbar from "@/app/(home)/_components/navbar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { AccountSettingsDialog } from "@/components/profile/account-settings-dialog"
import { AvatarActionsDialog } from "@/components/profile/avatar-actions-dialog"
import { FollowListDialog } from "@/components/profile/follow-list-dialog"
import { userService } from "@/services/user.service"
import { mediaService } from "@/services/media.service"
import { contentService } from "@/services/content.service"
import { getErrorMessage } from "@/lib/api"
import { isVideoMedia, safePoster } from "@/lib/media"
import type { NoteResponse, UserProfileResponse } from "@/types/user.type"
import type { MediaResponse } from "@/types/media.type"
import type { CollectionResponse, PostResponse } from "@/types/content.type"

interface PostGridItem {
  id: string
  image?: string
  videoUrl?: string
  likes: number
  comments: number
  contentType?: string
  mediaCount?: number
  isRealMedia?: boolean
  isRealPost?: boolean
}

export default function ProfilePage() {
  const { user, isAuthenticated, refreshUser } = useAuth()
  const { openLoginModal } = useLoginModal()
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "saved" | "tagged">("posts")

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [myNote, setMyNote] = useState<NoteResponse | null>(null)
  const [myMedia, setMyMedia] = useState<MediaResponse[]>([])
  const [myPosts, setMyPosts] = useState<PostResponse[]>([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [savedPosts, setSavedPosts] = useState<PostResponse[]>([])
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [highlightsList, setHighlightsList] = useState<HighlightResponse[]>([])
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null)
  const [isCreateHighlightOpen, setIsCreateHighlightOpen] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  // Dialog states
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [isSavingNote, setIsSavingNote] = useState(false)

  // Followers / Following Modal
  const [followDialogMode, setFollowDialogMode] = useState<"followers" | "following" | null>(null)

  // Create Collection Modal
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)

  const loadProfileData = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const p = await userService.getMyProfile()
      setProfile(p)

      if (p.id) {
        userService
          .getNote(p.id)
          .then((n) => {
            setMyNote(n)
            setNoteContent(n?.content || "")
          })
          .catch(() => {})
      }

      mediaService
        .getMyMedia(0, 20)
        .then((page) => setMyMedia(page.content || []))
        .catch(() => {})

      contentService
        .getMyPosts(0, 30)
        .then((page) => {
          setMyPosts(page.content || [])
          setTotalPosts(typeof page.totalElements === "number" ? page.totalElements : (page.content?.length || 0))
        })
        .catch(() => {})

      contentService
        .getSavedPosts(0, 30)
        .then((page) => setSavedPosts(page.content || []))
        .catch(() => {})

      contentService
        .getMyCollections()
        .then((cols) => setCollections(cols || []))
        .catch(() => {})

      if (p.id) {
        contentService
          .getUserHighlights(p.id)
          .then((hl) => setHighlightsList(hl || []))
          .catch(() => {})
      }

      contentService
        .getFollowers(0, 1)
        .then((res) => {
          setFollowersCount(res.totalElements ?? res.content?.length ?? 0)
        })
        .catch(() => {})

      contentService
        .getFollowing(0, 1)
        .then((res) => {
          setFollowingCount(res.totalElements ?? res.content?.length ?? 0)
        })
        .catch(() => {})
    } catch {
      // Fallback to basic user info from AuthProvider
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  useEffect(() => {
    const handlePostCreated = () => loadProfileData()
    window.addEventListener("snapgram:post-created", handlePostCreated)
    return () =>
      window.removeEventListener("snapgram:post-created", handlePostCreated)
  }, [loadProfileData])

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteContent.trim()) return
    setIsSavingNote(true)
    try {
      const saved = await userService.upsertNote({ content: noteContent.trim() })
      setMyNote(saved)
      setIsNoteOpen(false)
      toast.success("Đã chia sẻ ghi chú 24h!")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể lưu ghi chú."))
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleDeleteNote = async () => {
    setIsSavingNote(true)
    try {
      await userService.deleteNote()
      setMyNote(null)
      setNoteContent("")
      setIsNoteOpen(false)
      toast.success("Đã xóa ghi chú.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa ghi chú."))
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleDeleteItem = async (item: PostGridItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      if (item.isRealPost) {
        await contentService.deletePost(item.id)
        setMyPosts((prev) => prev.filter((p) => p.id !== item.id))
        toast.success("Đã xóa bài viết!")
      } else if (item.isRealMedia) {
        await mediaService.deleteMedia(item.id)
        setMyMedia((prev) => prev.filter((m) => m.id !== item.id))
        toast.success("Đã xóa ảnh/media khỏi kho lưu trữ!")
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa mục này."))
    }
  }

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollectionName.trim()) return
    setIsCreatingCollection(true)
    try {
      const created = await contentService.createCollection({
        name: newCollectionName.trim(),
        private: true,
      })
      setCollections((prev) => [created, ...prev])
      setNewCollectionName("")
      setIsCollectionModalOpen(false)
      toast.success("Đã tạo bộ sưu tập mới!")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể tạo bộ sưu tập."))
    } finally {
      setIsCreatingCollection(false)
    }
  }

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      await contentService.deleteCollection(collectionId)
      setCollections((prev) => prev.filter((c) => c.id !== collectionId))
      toast.success("Đã xóa bộ sưu tập.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa bộ sưu tập."))
    }
  }

  const username = profile?.username || user?.username || "snapgram_user"
  const displayName = profile?.displayName || user?.displayName || "Người dùng Snapgram"
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl || "/profile.jpg"
  const bio =
    profile?.bio ??
    "Nhiếp ảnh · Phong cách sống · Sáng tạo nội dung 📸✨\nKhám phá những khoảnh khắc đẹp trong cuộc sống hàng ngày."
  const website = profile?.website

  const realPostGridItems: PostGridItem[] = myPosts.map((p) => {
    const firstMedia = p.mediaItems?.[0]
    const media = firstMedia?.mediaUrl || p.mediaUrl || ""
    const isVideo =
      isVideoMedia(media, firstMedia?.mediaType) ||
      p.contentType === "REEL" ||
      p.contentType === "VIDEO"
    const poster = safePoster(firstMedia?.thumbnailUrl, media)

    return {
      id: p.id,
      image: isVideo ? poster : poster || media || "/profile.jpg",
      videoUrl: isVideo ? media : undefined,
      likes: p.likeCount ?? 0,
      comments: p.commentCount ?? 0,
      contentType: p.contentType || (p.mediaItems && p.mediaItems.length > 1 ? "CAROUSEL" : isVideo ? "VIDEO" : "POST"),
      mediaCount: p.mediaItems?.length || 1,
      isRealPost: true,
    }
  })

  const realMediaGridItems: PostGridItem[] = myMedia.map((m) => {
    const isVideo = isVideoMedia(m.url, m.mimeType)
    const poster = safePoster(m.thumbnailUrl, m.url)
    return {
      id: m.id,
      image: isVideo ? poster : poster || m.url || "/profile.jpg",
      videoUrl: isVideo ? m.url : undefined,
      likes: 0,
      comments: 0,
      contentType: isVideo ? "VIDEO" : "POST",
      mediaCount: 1,
      isRealMedia: true,
    }
  })

  const combinedMyItems =
    realPostGridItems.length > 0
      ? realPostGridItems
      : realMediaGridItems.length > 0
      ? realMediaGridItems
      : []

  const savedGridItems: PostGridItem[] = savedPosts.map((p) => {
    const firstMedia = p.mediaItems?.[0]
    const media = firstMedia?.mediaUrl || p.mediaUrl || ""
    const isVideo =
      isVideoMedia(media, firstMedia?.mediaType) ||
      p.contentType === "REEL" ||
      p.contentType === "VIDEO"
    const poster = safePoster(firstMedia?.thumbnailUrl, media)

    return {
      id: p.id,
      image: isVideo ? poster : poster || media || "/profile.jpg",
      videoUrl: isVideo ? media : undefined,
      likes: p.likeCount ?? 0,
      comments: p.commentCount ?? 0,
      contentType: p.contentType || (p.mediaItems && p.mediaItems.length > 1 ? "CAROUSEL" : isVideo ? "VIDEO" : "POST"),
      mediaCount: p.mediaItems?.length || 1,
    }
  })

  const displayedGridItems =
    activeTab === "reels"
      ? combinedMyItems.filter((item) => item.contentType === "REEL")
      : activeTab === "saved"
      ? savedGridItems
      : combinedMyItems

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto">
        <Navbar />

        <div className="px-4 md:px-12 pt-6 md:pt-10 pb-16 md:pb-12 max-w-4xl w-full mx-auto space-y-8">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-12">
            {/* Avatar + 24h Note Bubble */}
            <div className="relative shrink-0 pt-3">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setIsNoteOpen(true)}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 max-w-[140px] px-3 py-1 rounded-2xl bg-card border border-border shadow-md text-[11px] text-foreground truncate hover:border-primary transition flex items-center gap-1"
                  title="Cập nhật ghi chú 24h"
                >
                  <MessageSquarePlus className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">
                    {myNote?.content ? myNote.content : "Ghi chú..."}
                  </span>
                </button>
              )}

              <div
                onClick={() => setIsAvatarOpen(true)}
                className="p-[3px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 cursor-pointer group relative"
                title="Xem hoặc thay đổi ảnh đại diện"
              >
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover bg-background p-1 select-none group-hover:opacity-90 transition"
                />
              </div>
            </div>

            {/* Info & Stats */}
            <div className="flex-1 space-y-4 text-center sm:text-left">
              {/* Username + Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{username}</h1>
                  <VerifiedBadge
                    verified={profile?.verified ?? user?.verified}
                    verifiedUntil={profile?.verifiedUntil ?? user?.verifiedUntil}
                  />
                  {profile?.privateAccount && (
                    <span title="Tài khoản riêng tư" className="text-muted-foreground">
                      <Lock className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {isAuthenticated ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditOpen(true)}
                        className="px-4 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold transition"
                      >
                        Chỉnh sửa trang cá nhân
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold transition"
                      >
                        Cài đặt & Bảo mật
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground transition"
                        aria-label="Cài đặt"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={openLoginModal}
                      className="px-6 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition"
                    >
                      Đăng nhập
                    </button>
                  )}
                </div>
              </div>

              {/* Counts: Posts, Followers, Following */}
              <div className="flex justify-center sm:justify-start items-center gap-8 text-sm">
                <div>
                  <span className="font-semibold">{(totalPosts || combinedMyItems.length).toLocaleString("vi-VN")}</span>{" "}
                  <span className="text-muted-foreground">bài viết</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFollowDialogMode("followers")}
                  className="hover:opacity-80 transition"
                >
                  <span className="font-semibold">
                    {followersCount.toLocaleString("vi-VN")}
                  </span>{" "}
                  <span className="text-muted-foreground">người theo dõi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFollowDialogMode("following")}
                  className="hover:opacity-80 transition"
                >
                  <span className="font-semibold">
                    {followingCount.toLocaleString("vi-VN")}
                  </span>{" "}
                  <span className="text-muted-foreground">đang theo dõi</span>
                </button>
              </div>

              {/* Bio & Details */}
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{displayName}</p>
                  {profile?.pronouns && (
                    <span className="text-muted-foreground text-xs">({profile.pronouns})</span>
                  )}
                  {isAuthenticated &&
                    (profile?.emailVerified === false || user?.emailVerified === false) && (
                      <Link
                        href="/verify-email"
                        className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[11px] font-medium hover:bg-amber-500/25 transition"
                      >
                        Xác thực email
                      </Link>
                    )}
                </div>

                {profile?.category && (
                  <p className="text-[11px] text-muted-foreground font-medium">{profile.category}</p>
                )}

                {bio && (
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{bio}</p>
                )}

                {website ? (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    <Globe className="w-3 h-3" />
                    {website}
                  </a>
                ) : (
                  <Link
                    href={`/u/${username}`}
                    className="font-medium text-primary hover:underline block pt-1"
                  >
                    snapgram.local/u/{username}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Story Highlights */}
          <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-none">
            {highlightsList.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveHighlightId(item.id)}
                className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
              >
                <div className="p-0.5 rounded-full border border-border group-hover:border-primary/50 transition">
                  <img
                    src={item.coverMediaUrl || "/profile.jpg"}
                    alt={item.name}
                    className="w-16 h-16 rounded-full object-cover p-0.5 select-none"
                  />
                </div>
                <span className="text-xs font-medium text-foreground tracking-tight max-w-[72px] truncate">
                  {item.name}
                </span>
              </div>
            ))}
            <div
              onClick={() => setIsCreateHighlightOpen(true)}
              className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
            >
              <div className="w-[68px] h-[68px] rounded-full border border-dashed border-border flex items-center justify-center group-hover:border-primary transition">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition">
                Mới
              </span>
            </div>
          </div>

          {/* Tabs: Bài viết | Reels | Đã lưu | Được gắn thẻ */}
          <div className="border-t border-border/70 pt-1">
            <div className="flex justify-center gap-8 sm:gap-12 text-xs font-semibold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setActiveTab("posts")}
                className={`flex items-center gap-2 py-3 border-t-2 -mt-1 transition ${
                  activeTab === "posts"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Bài viết</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reels")}
                className={`flex items-center gap-2 py-3 border-t-2 -mt-1 transition ${
                  activeTab === "reels"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Reels</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("saved")}
                className={`flex items-center gap-2 py-3 border-t-2 -mt-1 transition ${
                  activeTab === "saved"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Đã lưu</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tagged")}
                className={`flex items-center gap-2 py-3 border-t-2 -mt-1 transition ${
                  activeTab === "tagged"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Được gắn thẻ</span>
              </button>
            </div>

            {/* Saved Collections Bar when on "saved" tab */}
            {activeTab === "saved" && (
              <div className="py-3 flex items-center justify-between gap-3 flex-wrap border-b border-border/40 mb-2">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                  <span className="px-3 py-1 rounded-full bg-foreground text-background text-xs font-semibold">
                    Tất cả bài đã lưu
                  </span>
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                    >
                      <span>{col.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCollection(col.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Xóa bộ sưu tập"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCollectionModalOpen(true)}
                  className="h-8 text-xs gap-1.5 shrink-0"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Bộ sưu tập mới</span>
                </Button>
              </div>
            )}

            {/* Posts 3-column Grid or Empty State */}
            {displayedGridItems.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full border-2 border-foreground/20 flex items-center justify-center mx-auto text-muted-foreground">
                  {activeTab === "posts" && <Camera className="w-8 h-8" />}
                  {activeTab === "reels" && <Film className="w-8 h-8" />}
                  {activeTab === "saved" && <Bookmark className="w-8 h-8" />}
                  {activeTab === "tagged" && <Tag className="w-8 h-8" />}
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {activeTab === "posts" && "Chia sẻ ảnh và video"}
                  {activeTab === "reels" && "Chưa có Reels nào"}
                  {activeTab === "saved" && "Lưu bài viết yêu thích"}
                  {activeTab === "tagged" && "Ảnh có mặt bạn"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {activeTab === "posts" &&
                    "Khi bạn chia sẻ ảnh hoặc video, chúng sẽ xuất hiện trên trang cá nhân của bạn."}
                  {activeTab === "reels" &&
                    "Các thước phim bạn tải lên sẽ xuất hiện tại đây."}
                  {activeTab === "saved" &&
                    "Lưu ảnh và video để xem lại sau. Sẽ không ai nhận được thông báo khi bạn lưu bài viết."}
                  {activeTab === "tagged" &&
                    "Khi mọi người gắn thẻ bạn trong ảnh hoặc bài viết, chúng sẽ xuất hiện tại đây."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-3 pt-3">
                {displayedGridItems.map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-square group bg-muted overflow-hidden select-none"
                  >
                    <Link href={`/p/${post.id}`} scroll={false} className="block w-full h-full">
                      {post.videoUrl ? (
                        <video
                          src={post.videoUrl}
                          poster={post.image || undefined}
                          preload="metadata"
                          className="w-full h-full object-cover pointer-events-none transition duration-300 group-hover:scale-105"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={post.image || "/profile.jpg"}
                          alt={post.id}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement
                            if (target.src !== "/profile.jpg") {
                              target.src = "/profile.jpg"
                            }
                          }}
                        />
                      )}
                      {((post.mediaCount && post.mediaCount > 1) || post.contentType === "CAROUSEL") ? (
                        <div className="absolute top-2.5 right-2.5 text-white drop-shadow-md pointer-events-none z-10">
                          <Layers className="w-4 h-4" />
                        </div>
                      ) : (post.contentType === "REEL" || post.contentType === "VIDEO") ? (
                        <div className="absolute top-2.5 right-2.5 text-white drop-shadow-md pointer-events-none z-10">
                          <Film className="w-4 h-4" />
                        </div>
                      ) : null}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <Heart className="w-5 h-5 fill-white" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 fill-white -rotate-90" />
                          <span>{post.comments}</span>
                        </div>
                      </div>
                    </Link>

                    {(post.isRealMedia || post.isRealPost) && activeTab !== "saved" && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(post, e)}
                        title="Xóa mục này"
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-destructive text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Navbot />
      </div>

      {/* Avatar View / Change Modal */}
      <AvatarActionsDialog
        open={isAvatarOpen}
        onOpenChange={setIsAvatarOpen}
        avatarUrl={avatarUrl}
        username={username}
        canEdit={isAuthenticated}
        onUpdated={(updated) => {
          setProfile(updated)
          refreshUser()
        }}
      />

      {/* Edit Profile Modal */}
      <EditProfileDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        profile={profile}
        onSaved={(updated) => {
          setProfile(updated)
          refreshUser()
        }}
      />

      {/* Account & Security Settings Modal */}
      <AccountSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        profile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated)
          refreshUser()
        }}
      />

      {/* Followers / Following Modal */}
      {followDialogMode && (
        <FollowListDialog
          open={Boolean(followDialogMode)}
          onOpenChange={(open) => {
            if (!open) {
              setFollowDialogMode(null)
              contentService
                .getFollowers(0, 1)
                .then((res) => setFollowersCount(res.totalElements ?? res.content?.length ?? 0))
                .catch(() => {})
              contentService
                .getFollowing(0, 1)
                .then((res) => setFollowingCount(res.totalElements ?? res.content?.length ?? 0))
                .catch(() => {})
            }
          }}
          mode={followDialogMode}
        />
      )}

      {/* Create Collection Modal */}
      <Dialog open={isCollectionModalOpen} onOpenChange={setIsCollectionModalOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Tạo bộ sưu tập mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCollection} className="space-y-4">
            <Input
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              maxLength={100}
              placeholder="Nhập tên bộ sưu tập (ví dụ: Ý tưởng thiết kế)..."
              className="text-xs h-9"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCollectionModalOpen(false)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreatingCollection || !newCollectionName.trim()}
                className="text-xs"
              >
                {isCreatingCollection ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                Tạo bộ sưu tập
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 24h Note Modal */}
      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Ghi chú mới (hiển thị 24 giờ)
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveNote} className="space-y-4">
            <div className="space-y-1.5">
              <Input
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                maxLength={60}
                placeholder="Chia sẻ suy nghĩ ngắn gọn (tối đa 60 ký tự)..."
                className="text-xs h-10"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {noteContent.length}/60
              </p>
            </div>

            <div className="flex items-center justify-between">
              {myNote ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isSavingNote}
                  onClick={handleDeleteNote}
                  className="text-xs gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa
                </Button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNoteOpen(false)}
                  className="text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingNote || !noteContent.trim()}
                  className="text-xs"
                >
                  {isSavingNote ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : null}
                  Chia sẻ
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Highlight Dialog */}
      <CreateHighlightDialog
        open={isCreateHighlightOpen}
        onOpenChange={setIsCreateHighlightOpen}
        onSuccess={(newHl) => {
          setHighlightsList((prev) => [newHl, ...prev])
        }}
      />

      {/* Highlight Slideshow Viewer */}
      <HighlightViewer
        highlightId={activeHighlightId}
        onClose={() => setActiveHighlightId(null)}
      />
    </div>
  )
}
