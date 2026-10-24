"use client"

import React, { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Ban,
  Camera,
  Copy,
  Film,
  Flag,
  Globe,
  Grid,
  Heart,
  Layers,
  Loader2,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import Sidebar from "@/app/(home)/_components/sidebar"
import Navbot from "@/app/(home)/_components/navbot"
import Navbar from "@/app/(home)/_components/navbar"
import { Button } from "@/components/ui/button"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { AvatarActionsDialog } from "@/components/profile/avatar-actions-dialog"
import { ReportDialog } from "@/components/content/report-dialog"
import { FollowListDialog } from "@/components/profile/follow-list-dialog"
import { HighlightViewer } from "@/components/content/highlight-viewer"
import { ProfileSkeleton } from "@/components/profile/profile-skeleton"
import { userService } from "@/services/user.service"
import { contentService } from "@/services/content.service"
import { getErrorMessage } from "@/lib/api"
import type { NoteResponse, UserProfileResponse } from "@/types/user.type"
import type { HighlightResponse } from "@/types/content.type"
import { isVideoMedia, safePoster } from "@/lib/media"

interface PublicPostItem {
  id: string
  image?: string
  videoUrl?: string
  likes: number
  comments: number
  contentType?: string
  mediaCount?: number
}

export default function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ username: string }> | { username: string }
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const usernameParam = decodeURIComponent(resolvedParams?.username || "")

  const { user: currentUser, isAuthenticated, refreshUser } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [note, setNote] = useState<NoteResponse | null>(null)
  const [userPosts, setUserPosts] = useState<PublicPostItem[]>([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [followStatus, setFollowStatus] = useState<"NONE" | "FOLLOWING" | "PENDING">("NONE")
  const [isFollowSubmitting, setIsFollowSubmitting] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isBlocking, setIsBlocking] = useState(false)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [followDialogMode, setFollowDialogMode] = useState<"followers" | "following" | null>(null)
  const [highlights, setHighlights] = useState<HighlightResponse[]>([])
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null)

  const isOwnProfile = Boolean(
    currentUser && (
      (profile?.id && currentUser.id === profile.id) ||
      (profile?.username && currentUser.username?.toLowerCase() === profile.username.toLowerCase()) ||
      (usernameParam && currentUser.username?.toLowerCase() === usernameParam.toLowerCase())
    )
  )

  const loadUser = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await userService.getPublicProfile(usernameParam)
      if (!data || !data.id) {
        setIsNotFound(true)
        return
      }
      setProfile(data)

      if (data.username && usernameParam.toLowerCase() !== data.username.toLowerCase()) {
        window.history.replaceState(null, "", `/u/${data.username}`)
      }

      if (data.id) {
        // Lấy ghi chú 24h nếu có
        userService
          .getNote(data.id)
          .then((n) => setNote(n))
          .catch(() => {})

        // Lấy danh sách tin nổi bật (highlights) của user
        contentService
          .getUserHighlights(data.id)
          .then((hl) => setHighlights(hl || []))
          .catch(() => {})

        // Lấy danh sách bài viết thực tế của user
        contentService
          .getUserPosts(data.id, 0, 30)
          .then((page) => {
            const items = page.content || []
            setUserPosts(
              items.map((p) => {
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
            )
            setTotalPosts(typeof page.totalElements === "number" ? page.totalElements : items.length)
          })
          .catch(() => {
            setUserPosts([])
            setTotalPosts(0)
          })

        // Kiểm tra xem currentUser đã follow user này chưa
        if (isAuthenticated && currentUser?.id !== data.id) {
          contentService
            .getFollowing(0, 100)
            .then((res) => {
              const isFollowingUser = (res.content || []).some(
                (f) => f.followingId === data.id
              )
              if (isFollowingUser) {
                setFollowStatus("FOLLOWING")
              }
            })
            .catch(() => {})

          // Kiểm tra xem đã chặn user này chưa
          userService
            .getBlockedUsers(0, 50)
            .then((res) => {
              const blocked = (res.content || []).some((b) => b.userId === data.id)
              if (blocked) {
                // Chủ tài khoản đã chặn người này → ẩn hồ sơ hoàn toàn (404)
                setIsBlocked(true)
                setIsNotFound(true)
              }
            })
            .catch(() => {})
        }

        // Lấy số lượng followers và following thực tế của user (cả khi xem mình hoặc người khác)
        contentService
          .getFollowers(0, 1, data.id)
          .then((res) => setFollowersCount(res.totalElements ?? res.content?.length ?? 0))
          .catch(() => {})
        contentService
          .getFollowing(0, 1, data.id)
          .then((res) => setFollowingCount(res.totalElements ?? res.content?.length ?? 0))
          .catch(() => {})
      }
    } catch (err) {
      // Chỉ 404 mới là "không tìm thấy". Lỗi token/network không được giả làm 404
      // vì người dùng sẽ tưởng tài khoản không tồn tại.
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        setIsNotFound(true)
      } else {
        setLoadError(
          getErrorMessage(err, "Không tải được hồ sơ. Vui lòng thử lại.")
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [usernameParam, isAuthenticated, currentUser?.id])

  useEffect(() => {
    loadUser()

    const handleFollowUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId?: string; username?: string; following?: boolean }>
      if (
        (profile?.id && customEvent.detail?.userId === profile.id) ||
        (profile?.username && customEvent.detail?.username?.toLowerCase() === profile.username.toLowerCase())
      ) {
        if (typeof customEvent.detail.following === "boolean") {
          setFollowStatus(customEvent.detail.following ? "FOLLOWING" : "NONE")
          setFollowersCount((prev) =>
            customEvent.detail.following ? prev + 1 : Math.max(0, prev - 1)
          )
        }
      }
    }

    window.addEventListener("snapgram:follow-updated", handleFollowUpdated)
    return () => {
      window.removeEventListener("snapgram:follow-updated", handleFollowUpdated)
    }
  }, [loadUser, profile?.id, profile?.username])

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    action()
  }

  const handleToggleFollow = () => {
    requireAuth(async () => {
      if (isOwnProfile) {
        toast.error("Bạn không thể tự theo dõi chính mình.")
        return
      }
      if (!profile?.id) {
        return
      }

      setIsFollowSubmitting(true)
      try {
        if (followStatus === "NONE") {
          const res = await contentService.followUser(profile.id)
          if (res.status === "PENDING") {
            setFollowStatus("PENDING")
            toast.info(`Đã gửi yêu cầu theo dõi @${profile.username}`)
          } else {
            setFollowStatus("FOLLOWING")
            setFollowersCount((prev) => prev + 1)
            toast.success(`Đã theo dõi @${profile.username}`)
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("snapgram:follow-updated", {
                detail: { userId: profile.id, username: profile.username, following: true },
              })
            )
          }
        } else {
          await contentService.unfollowUser(profile.id)
          setFollowStatus("NONE")
          setFollowersCount((prev) => Math.max(0, prev - 1))
          toast.success(`Đã hủy theo dõi @${profile.username}`)
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("snapgram:follow-updated", {
                detail: { userId: profile.id, username: profile.username, following: false },
              })
            )
          }
        }
      } catch (err: any) {
        const status = err?.response?.status
        const msg = err?.response?.data?.message || err?.message || ""
        if (followStatus === "NONE" && (status === 409 || msg.includes("Already following"))) {
          setFollowStatus("FOLLOWING")
          toast.success(`Đang theo dõi @${profile.username}`)
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("snapgram:follow-updated", {
                detail: { userId: profile.id, username: profile.username, following: true },
              })
            )
          }
        } else {
          toast.error(getErrorMessage(err, "Không thể cập nhật theo dõi."))
        }
      } finally {
        setIsFollowSubmitting(false)
      }
    })
  }

  const handleToggleBlock = () => {
    requireAuth(async () => {
      if (!profile?.id) return
      setIsBlocking(true)
      try {
        if (isBlocked) {
          await userService.unblockUser(profile.id)
          setIsBlocked(false)
          toast.success(`Đã bỏ chặn @${profile.username}`)
        } else {
          await userService.blockUser(profile.id)
          setIsBlocked(true)
          setFollowStatus("NONE")
          toast.success(`Đã chặn @${profile.username}`)
          setIsNotFound(true)
        }
      } catch (err) {
        toast.error(getErrorMessage(err, "Không thể thực hiện thao tác chặn."))
      } finally {
        setIsBlocking(false)
      }
    })
  }

  const handleMessageClick = () => {
    requireAuth(() => {
      toast.info("Tính năng Tin nhắn sẽ sớm ra mắt khi có API!")
    })
  }

  const handleCopyProfileLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {})
      toast.success("Đã sao chép liên kết trang cá nhân!")
    }
  }

  const handleShareProfile = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: profile?.displayName || profile?.username,
          url: window.location.href,
        })
        .catch(() => {})
    } else {
      handleCopyProfileLink()
    }
  }

  if (isNotFound) {
    notFound()
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <p className="text-sm font-semibold">Không tải được hồ sơ</p>
            <p className="text-xs text-muted-foreground max-w-[320px]">{loadError}</p>
            <Button size="sm" variant="outline" onClick={() => void loadUser()}>
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto pb-12">
        <Navbar />

        {/* Bạn đã chặn tài khoản này — hiện băng báo thay vì 404 */}
        {isBlocked && (
          <div className="mx-4 md:mx-12 mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-foreground/90">
              Bạn đã chặn <span className="font-semibold">@{profile?.username || usernameParam}</span>.
              Họ không thể xem hồ sơ, theo dõi hay nhắn tin cho bạn.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleBlock}
              disabled={isBlocking}
              className="shrink-0"
            >
              {isBlocking ? "Đang xử lý…" : "Bỏ chặn"}
            </Button>
          </div>
        )}

        <div className="px-4 md:px-12 pt-6 md:pt-10 max-w-4xl w-full mx-auto space-y-8">
          {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-12">
              {/* Avatar + Note */}
              <div className="relative shrink-0 pt-3">
                {note?.content && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 max-w-[140px] px-3 py-1 rounded-2xl bg-card border border-border shadow-md text-[11px] text-foreground truncate">
                    {note.content}
                  </div>
                )}
                <div
                  onClick={() => setIsAvatarOpen(true)}
                  className="p-[3px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 cursor-pointer hover:opacity-95 transition"
                  title="Xem ảnh đại diện"
                >
                  <img
                    src={profile?.avatarUrl || "/profile.jpg"}
                    alt={profile?.username}
                    className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover bg-background p-1 select-none"
                  />
                </div>
              </div>

              {/* Info & Stats */}
              <div className="flex-1 space-y-4 text-center sm:text-left">
                {/* Username + Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                      {profile?.username}
                    </h1>
                    <VerifiedBadge
                      verified={profile?.verified}
                      verifiedUntil={profile?.verifiedUntil}
                    />
                    {profile?.privateAccount && (
                      <span title="Tài khoản riêng tư">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    {isOwnProfile ? (
                      <Button asChild variant="secondary" size="sm" className="text-xs h-8">
                        <Link href="/profile">Quản lý hồ sơ của tôi</Link>
                      </Button>
                    ) : (
                      <>
                        {/* Nút 1: Theo dõi / Đang theo dõi / Đã gửi yêu cầu */}
                        <Button
                          type="button"
                          size="sm"
                          disabled={isFollowSubmitting}
                          variant={followStatus !== "NONE" ? "secondary" : "default"}
                          onClick={handleToggleFollow}
                          className="text-xs h-8 px-5 font-semibold"
                        >
                          {followStatus === "FOLLOWING"
                            ? "Đang theo dõi"
                            : followStatus === "PENDING"
                            ? "Đã gửi yêu cầu"
                            : "Theo dõi"}
                        </Button>

                        {/* Nút 2: Nhắn tin */}
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleMessageClick}
                          className="text-xs h-8 px-4 gap-1.5 font-semibold"
                        >
                          <Send className="w-3.5 h-3.5 -rotate-12" />
                          <span>Nhắn tin</span>
                        </Button>

                        {/* Nút 3: Menu tùy chọn ba chấm (Chặn, Báo cáo, Copy Link) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              aria-label="Tùy chọn khác"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onClick={handleCopyProfileLink}
                              className="text-xs gap-2 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép liên kết trang</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={handleShareProfile}
                              className="text-xs gap-2 cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Chia sẻ trang cá nhân</span>
                            </DropdownMenuItem>

                            {profile?.id && !isOwnProfile && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={handleToggleBlock}
                                  disabled={isBlocking}
                                  className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                                >
                                  {isBlocked ? (
                                    <>
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>Bỏ chặn @{profile.username}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>Chặn @{profile.username}</span>
                                    </>
                                  )}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => requireAuth(() => setIsReportOpen(true))}
                                  className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                  <span>Báo cáo tài khoản</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats: Posts, Followers, Following */}
                <div className="flex justify-center sm:justify-start items-center gap-8 text-sm">
                  <div>
                    <span className="font-semibold">{totalPosts.toLocaleString("vi-VN")}</span>{" "}
                    <span className="text-muted-foreground">bài viết</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFollowDialogMode("followers")}
                    className="hover:opacity-80 transition cursor-pointer text-left"
                  >
                    <span className="font-semibold">{followersCount.toLocaleString("vi-VN")}</span>{" "}
                    <span className="text-muted-foreground">người theo dõi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowDialogMode("following")}
                    className="hover:opacity-80 transition cursor-pointer text-left"
                  >
                    <span className="font-semibold">{followingCount.toLocaleString("vi-VN")}</span>{" "}
                    <span className="text-muted-foreground">đang theo dõi</span>
                  </button>
                </div>

                {/* Bio & Details */}
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <p className="font-semibold text-sm">
                      {profile?.displayName || profile?.username}
                    </p>
                    {profile?.pronouns && (
                      <span className="text-muted-foreground">
                        ({profile.pronouns})
                      </span>
                    )}
                  </div>
                  {profile?.category && (
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {profile.category}
                    </p>
                  )}
                  {profile?.bio && (
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                  {profile?.website && (
                    <a
                      href={
                        profile.website.startsWith("http")
                          ? profile.website
                          : `https://${profile.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <Globe className="w-3 h-3" />
                      {profile.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Story Highlights */}
            {highlights.length > 0 && (
              <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-none">
                {highlights.map((item) => (
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
              </div>
            )}

            {/* Post Grid Section */}
            <div className="border-t border-border/70 pt-3">
              <div className="flex justify-center pb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                <span className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5" /> Bài viết
                </span>
              </div>

              {/* Nếu tài khoản riêng tư và chưa follow */}
              {profile?.privateAccount &&
              followStatus !== "FOLLOWING" &&
              !isOwnProfile ? (
                <div className="py-16 text-center space-y-2 border border-border/50 rounded-xl">
                  <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-semibold">Đây là tài khoản riêng tư</p>
                  <p className="text-xs text-muted-foreground">
                    Hãy theo dõi tài khoản này để xem ảnh và video của họ.
                  </p>
                </div>
              ) : userPosts.length === 0 ? (
                /* Empty state khi user chưa có bài viết nào */
                <div className="py-16 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full border-2 border-foreground/20 flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Chưa có bài viết nào</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Khi {profile?.displayName || profile?.username} chia sẻ ảnh hoặc video đầu tiên, bạn sẽ thấy bài viết tại đây.
                  </p>
                </div>
              ) : (
                /* Lưới bài viết thật */
                <div className="grid grid-cols-3 gap-1 md:gap-3">
                  {userPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/p/${post.id}`}
                      scroll={false}
                      className="relative aspect-square group bg-muted overflow-hidden select-none"
                    >
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
                  ))}
                </div>
              )}
            </div>
          </div>

        <Navbot />
      </div>

      <AvatarActionsDialog
        open={isAvatarOpen}
        onOpenChange={setIsAvatarOpen}
        avatarUrl={profile?.avatarUrl || "/profile.jpg"}
        username={profile?.username || usernameParam}
        canEdit={isOwnProfile}
        onUpdated={(updated) => {
          setProfile(updated)
          refreshUser()
        }}
      />

      <ReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        targetType="USER"
        targetId={profile?.id || usernameParam}
        targetLabel={`@${profile?.username || usernameParam}`}
      />

      <FollowListDialog
        open={Boolean(followDialogMode)}
        onOpenChange={(open) => !open && setFollowDialogMode(null)}
        mode={followDialogMode || "followers"}
        userId={profile?.id}
      />

      <HighlightViewer
        highlightId={activeHighlightId}
        onClose={() => setActiveHighlightId(null)}
      />
    </div>
  )
}
