"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Film, Heart, MessageCircle, Search } from "lucide-react"
import Sidebar from "@/app/(home)/_components/sidebar"
import Navbot from "@/app/(home)/_components/navbot"
import Navbar from "@/app/(home)/_components/navbar"

interface ExploreTile {
  id: string
  image: string
  likes: number
  comments: number
  isReel?: boolean
  span?: string // e.g. "row-span-2 col-span-1" or "col-span-2 row-span-2"
}

const mockExploreItems: ExploreTile[] = [
  { id: "post-1", image: "/profile.jpg", likes: 3410, comments: 84 },
  { id: "post-2", image: "/auth-image-1.webp", likes: 5120, comments: 120, isReel: true, span: "row-span-2" },
  { id: "post-3", image: "/profile.jpg", likes: 1980, comments: 45 },
  { id: "post-4", image: "/auth-image-2.webp", likes: 8410, comments: 231 },
  { id: "post-5", image: "/profile.jpg", likes: 2150, comments: 39 },
  { id: "post-6", image: "/profile.jpg", likes: 4560, comments: 92 },
  { id: "post-7", image: "/auth-image-1.webp", likes: 6200, comments: 140, isReel: true, span: "row-span-2" },
  { id: "post-8", image: "/profile.jpg", likes: 1820, comments: 29 },
  { id: "post-9", image: "/profile.jpg", likes: 3990, comments: 77 },
  { id: "post-10", image: "/auth-image-2.webp", likes: 7300, comments: 182 },
  { id: "post-11", image: "/profile.jpg", likes: 2450, comments: 51 },
  { id: "post-12", image: "/profile.jpg", likes: 1910, comments: 34 },
]

const categories = ["Dành cho bạn", "Nhiếp ảnh", "Du lịch", "Kiến trúc", "Ẩm thực", "Nghệ thuật", "Thiết kế"]

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("Dành cho bạn")

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Explore Container */}
      <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto pb-12">
        <Navbar />

        <div className="px-3 md:px-8 pt-4 md:pt-6 space-y-4">
          {/* Search Header on Explore */}
          <div className="max-w-md mx-auto w-full">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tài khoản, hashtag hoặc địa điểm..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/60 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition"
              />
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  activeCategory === cat
                    ? "bg-foreground text-background"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Mosaic / Grid Layout */}
          <div className="grid grid-cols-3 gap-1 md:gap-2 auto-rows-[140px] sm:auto-rows-[200px] md:auto-rows-[260px] pt-2">
            {mockExploreItems.map((item) => (
              <Link
                key={item.id}
                href={`/p/${item.id}`}
                scroll={false}
                className={`relative group bg-muted overflow-hidden select-none rounded-sm ${
                  item.span || ""
                }`}
              >
                <img
                  src={item.image}
                  alt={item.id}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />

                {/* Reel Badge if applicable */}
                {item.isReel && (
                  <div className="absolute top-2.5 right-2.5 z-10 text-white drop-shadow-md">
                    <Film className="w-4 h-4" />
                  </div>
                )}

                {/* Hover Overlay with Stats */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 sm:gap-6 text-white font-semibold text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                    <span>{item.likes.toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white -rotate-90" />
                    <span>{item.comments}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <Navbot />
      </div>
    </div>
  )
}
