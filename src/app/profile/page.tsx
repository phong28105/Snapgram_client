"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Bookmark,
  Film,
  Globe,
  Grid,
  Heart,
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
import { userService } from "@/services/user.service"
import { mediaService } from "@/services/media.service"
import { getErrorMessage } from "@/lib/api"
import type { NoteResponse, UserProfileResponse } from "@/types/user.type"
import type { MediaResponse } from "@/types/media.type"

interface PostGridItem {
  id: string
  image: string
  likes: number
  comments: number
}

const mockProfilePosts: PostGridItem[] = [
  { id: "post-1", image: "/profile.jpg", likes: 1420, comments: 24 },
  { id: "post-2", image: "/profile.jpg", likes: 890, comments: 15 },
  { id: "post-3", image: "/profile.jpg", likes: 2541, comments: 48 },
  { id: "post-4", image: "/profile.jpg", likes: 620, comments: 8 },
  { id: "post-5", image: "/profile.jpg", likes: 1105, comments: 19 },
  { id: "post-6", image: "/profile.jpg", likes: 980, comments: 31 },
]

const highlights = [
  { id: "h1", title: "Kỷ niệm", img: "/profile.jpg" },
  { id: "h2", title: "Du lịch", img: "/profile.jpg" },
  { id: "h3", title: "Coding", img: "/profile.jpg" },
  { id: "h4", title: "Khoảnh khắc", img: "/profile.jpg" },
]

export default function ProfilePage() {
  const { user, isAuthenticated, refreshUser } = useAuth()
  const { openLoginModal } = useLoginModal()
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "saved" | "tagged">("posts")

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [myNote, setMyNote] = useState<NoteResponse | null>(null)
  const [myMedia, setMyMedia] = useState<MediaResponse[]>([])

  // Dialog states
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [isSavingNote, setIsSavingNote] = useState(false)

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
    } catch {
      // Fallback to basic user info from AuthProvider
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadProfileData()
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

  const username = profile?.username || user?.username || "snapgram_user"
  const displayName = profile?.displayName || user?.displayName || "Người dùng Snapgram"
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl || "/profile.jpg"
  const bio =
    profile?.bio ??
    "Nhiếp ảnh · Phong cách sống · Sáng tạo nội dung 📸✨\nKhám phá những khoảnh khắc đẹp trong cuộc sống hàng ngày."
  const website = profile?.website

  const gridPosts: PostGridItem[] =
    myMedia.length > 0
      ? myMedia.map((m) => ({
          id: m.id,
          image: m.thumbnailUrl || m.url || "/profile.jpg",
          likes: 0,
          comments: 0,
        }))
      : mockProfilePosts

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto pb-12">
        <Navbar />

        <div className="px-4 md:px-12 pt-6 md:pt-10 max-w-4xl w-full mx-auto space-y-8">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-12">
            {/* Avatar with Note 24h Bubble & Story gradient border */}
            <div className="relative shrink-0 pt-4">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setNoteContent(myNote?.content || "")
                    setIsNoteOpen(true)
                  }}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 max-w-[140px] px-3 py-1 rounded-2xl bg-card border border-border shadow-md text-[11px] text-foreground truncate hover:scale-105 transition"
                  title="Tạo hoặc sửa ghi chú 24h"
                >
                  {myNote?.content ? (
                    <span>{myNote.content}</span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MessageSquarePlus className="w-3 h-3" /> Ghi chú...
                    </span>
                  )}
                </button>
              )}

              <div
                onClick={() => setIsAvatarOpen(true)}
                className="p-[3px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 cursor-pointer hover:opacity-95 transition"
                title="Xem hoặc thay đổi ảnh đại diện"
              >
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover bg-background p-1 select-none"
                />
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex-1 space-y-4 text-center sm:text-left">
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

                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {isAuthenticated ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditOpen(true)}
                        className="px-4 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition"
                      >
                        Chỉnh sửa trang cá nhân
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("saved")}
                        className="px-4 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition"
                      >
                        Xem kho lưu trữ
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
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
                  <span className="font-semibold">{gridPosts.length}</span>{" "}
                  <span className="text-muted-foreground">bài viết</span>
                </div>
                <div>
                  <span className="font-semibold">1.420</span>{" "}
                  <span className="text-muted-foreground">người theo dõi</span>
                </div>
                <div>
                  <span className="font-semibold">385</span>{" "}
                  <span className="text-muted-foreground">đang theo dõi</span>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{displayName}</p>
                  {profile?.pronouns && (
                    <span className="text-muted-foreground text-xs">({profile.pronouns})</span>
                  )}
                  {isAuthenticated && (profile?.emailVerified === false || user?.emailVerified === false) && (
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
            {highlights.map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
                <div className="p-0.5 rounded-full border border-border group-hover:border-primary/50 transition">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-16 h-16 rounded-full object-cover p-0.5 select-none"
                  />
                </div>
                <span className="text-xs font-medium text-foreground tracking-tight">{item.title}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2 shrink-0 cursor-pointer">
              <div className="w-[68px] h-[68px] rounded-full border border-dashed border-border flex items-center justify-center hover:border-primary transition">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Mới</span>
            </div>
          </div>

          {/* Tabs: Bài viết | Reels | Đã lưu | Được gắn thẻ */}
          <div className="border-t border-border/70 pt-1">
            <div className="flex justify-center gap-12 text-xs font-semibold uppercase tracking-wider">
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

            {/* Posts 3-column Grid */}
            <div className="grid grid-cols-3 gap-1 md:gap-3 pt-3">
              {gridPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/p/${post.id}`}
                  scroll={false}
                  className="relative aspect-square group bg-muted overflow-hidden select-none"
                >
                  <img
                    src={post.image}
                    alt={post.id}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {/* Hover Overlay with Likes & Comments */}
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

      {/* 24h Note Modal */}
      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Ghi chú mới (hiển thị 24 giờ)</DialogTitle>
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
                  {isSavingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Chia sẻ
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
