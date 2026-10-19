"use client"

import React, { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Ban, Globe, Grid, Heart, Loader2, Lock, MessageCircle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import Sidebar from "@/app/(home)/_components/sidebar"
import Navbot from "@/app/(home)/_components/navbot"
import Navbar from "@/app/(home)/_components/navbar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { AvatarActionsDialog } from "@/components/profile/avatar-actions-dialog"
import { userService } from "@/services/user.service"
import { getErrorMessage } from "@/lib/api"
import type { NoteResponse, UserProfileResponse } from "@/types/user.type"

const mockPublicPosts = [
  { id: "post-1", image: "/profile.jpg", likes: 1420, comments: 24 },
  { id: "post-2", image: "/auth-image-1.webp", likes: 890, comments: 15 },
  { id: "post-3", image: "/auth-image-2.webp", likes: 2541, comments: 48 },
]

export default function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ username: string }> | { username: string }
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const usernameParam = decodeURIComponent(resolvedParams?.username || "")

  const { user: currentUser, isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [note, setNote] = useState<NoteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)

  const { refreshUser } = useAuth()

  const loadUser = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await userService.getPublicProfile(usernameParam)
      setProfile(data)
      if (data.id) {
        userService
          .getNote(data.id)
          .then((n) => setNote(n))
          .catch(() => {})
      }
    } catch {
      // Fallback mock if user doesn't exist in DB yet
      setProfile({
        id: "",
        username: usernameParam,
        displayName: usernameParam,
        avatarUrl: "/profile.jpg",
        bio: "Thành viên cộng đồng Snapgram 📸",
      })
    } finally {
      setIsLoading(false)
    }
  }, [usernameParam])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    action()
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
          setIsFollowing(false)
          toast.success(`Đã chặn @${profile.username}`)
        }
      } catch (err) {
        toast.error(getErrorMessage(err, "Không thể thực hiện thao tác chặn."))
      } finally {
        setIsBlocking(false)
      }
    })
  }

  const isOwnProfile = Boolean(currentUser && profile && currentUser.username === profile.username)

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto pb-12">
        <Navbar />

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="px-4 md:px-12 pt-6 md:pt-10 max-w-4xl w-full mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-12">
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
                    className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover bg-background p-1"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                      {profile?.username}
                    </h1>
                    {profile?.privateAccount && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    {isOwnProfile ? (
                      <Button asChild variant="secondary" size="sm" className="text-xs h-8">
                        <Link href="/profile">Quản lý hồ sơ của tôi</Link>
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant={isFollowing ? "secondary" : "default"}
                          onClick={() => requireAuth(() => setIsFollowing((p) => !p))}
                          className="text-xs h-8 px-5"
                        >
                          {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                        </Button>

                        {profile?.id && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBlocking}
                            onClick={handleToggleBlock}
                            className="text-xs h-8 gap-1 text-destructive hover:text-destructive"
                          >
                            {isBlocked ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Bỏ chặn
                              </>
                            ) : (
                              <>
                                <Ban className="w-3.5 h-3.5" />
                                Chặn
                              </>
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-center sm:justify-start items-center gap-8 text-sm">
                  <div>
                    <span className="font-semibold">{mockPublicPosts.length}</span>{" "}
                    <span className="text-muted-foreground">bài viết</span>
                  </div>
                  <div>
                    <span className="font-semibold">842</span>{" "}
                    <span className="text-muted-foreground">người theo dõi</span>
                  </div>
                  <div>
                    <span className="font-semibold">210</span>{" "}
                    <span className="text-muted-foreground">đang theo dõi</span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <p className="font-semibold text-sm">{profile?.displayName || profile?.username}</p>
                    {profile?.pronouns && (
                      <span className="text-muted-foreground">({profile.pronouns})</span>
                    )}
                  </div>
                  {profile?.category && (
                    <p className="text-[11px] text-muted-foreground font-medium">{profile.category}</p>
                  )}
                  {profile?.bio && (
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                  {profile?.website && (
                    <a
                      href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
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

            <div className="border-t border-border/70 pt-3">
              <div className="flex justify-center pb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                <span className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5" /> Bài viết
                </span>
              </div>

              {profile?.privateAccount && !isFollowing && !isOwnProfile ? (
                <div className="py-16 text-center space-y-2 border border-border/50 rounded-xl">
                  <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-semibold">Đây là tài khoản riêng tư</p>
                  <p className="text-xs text-muted-foreground">
                    Hãy theo dõi tài khoản này để xem ảnh và video của họ.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-3">
                  {mockPublicPosts.map((post) => (
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
        )}

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
    </div>
  )
}
