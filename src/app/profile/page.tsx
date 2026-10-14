"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Bookmark, Grid, Heart, MessageCircle, Settings, Film, Tag, Plus } from "lucide-react"
import Sidebar from "@/app/(home)/_components/sidebar"
import Navbot from "@/app/(home)/_components/navbot"
import Navbar from "@/app/(home)/_components/navbar"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"

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
  const { user, isAuthenticated } = useAuth()
  const { openLoginModal } = useLoginModal()
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "saved" | "tagged">("posts")

  const username = user?.username || "snapgram_user"
  const displayName = user?.displayName || "Người dùng Snapgram"
  const avatarUrl = user?.avatarUrl || "/profile.jpg"

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
            {/* Avatar with Story gradient border */}
            <div className="relative shrink-0">
              <div className="p-[3px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 cursor-pointer">
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
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{username}</h1>

                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {isAuthenticated ? (
                    <>
                      <button
                        type="button"
                        className="px-4 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition"
                      >
                        Chỉnh sửa trang cá nhân
                      </button>
                      <button
                        type="button"
                        className="px-4 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition"
                      >
                        Xem kho lưu trữ
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
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
                  <span className="font-semibold">{mockProfilePosts.length}</span>{" "}
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
                <p className="font-semibold text-sm">{displayName}</p>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  Nhiếp ảnh · Phong cách sống · Sáng tạo nội dung 📸✨{"\n"}
                  Khám phá những khoảnh khắc đẹp trong cuộc sống hàng ngày.
                </p>
                <a
                  href="#"
                  className="font-medium text-primary hover:underline block pt-1"
                >
                  snapgram.local/{username}
                </a>
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
              {mockProfilePosts.map((post) => (
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
    </div>
  )
}
