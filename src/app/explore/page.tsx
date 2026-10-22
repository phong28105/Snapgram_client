"use client"

import React, { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Clock,
  Film,
  Heart,
  Loader2,
  MessageCircle,
  Search,
  User,
  X,
} from "lucide-react"
import Sidebar from "@/app/(home)/_components/sidebar"
import Navbot from "@/app/(home)/_components/navbot"
import Navbar from "@/app/(home)/_components/navbar"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { userService } from "@/services/user.service"
import type { UserProfileResponse } from "@/types/user.type"

interface ExploreTile {
  id: string
  image: string
  likes: number
  comments: number
  category: string
  isReel?: boolean
  span?: string
}

const mockExploreItems: ExploreTile[] = [
  { id: "post-1", image: "/profile.jpg", likes: 3410, comments: 84, category: "Nhiếp ảnh" },
  { id: "post-2", image: "/auth-image-1.webp", likes: 5120, comments: 120, category: "Du lịch", isReel: true, span: "row-span-2" },
  { id: "post-3", image: "/profile.jpg", likes: 1980, comments: 45, category: "Kiến trúc" },
  { id: "post-4", image: "/auth-image-2.webp", likes: 8410, comments: 231, category: "Ẩm thực" },
  { id: "post-5", image: "/profile.jpg", likes: 2150, comments: 39, category: "Nghệ thuật" },
  { id: "post-6", image: "/profile.jpg", likes: 4560, comments: 92, category: "Thiết kế" },
  { id: "post-7", image: "/auth-image-1.webp", likes: 6200, comments: 140, category: "Nhiếp ảnh", isReel: true, span: "row-span-2" },
  { id: "post-8", image: "/profile.jpg", likes: 1820, comments: 29, category: "Du lịch" },
  { id: "post-9", image: "/profile.jpg", likes: 3990, comments: 77, category: "Kiến trúc" },
  { id: "post-10", image: "/auth-image-2.webp", likes: 7300, comments: 182, category: "Ẩm thực" },
  { id: "post-11", image: "/profile.jpg", likes: 2450, comments: 51, category: "Nghệ thuật" },
  { id: "post-12", image: "/profile.jpg", likes: 1910, comments: 34, category: "Thiết kế" },
]

const categories = [
  "Dành cho bạn",
  "Nhiếp ảnh",
  "Du lịch",
  "Kiến trúc",
  "Ẩm thực",
  "Nghệ thuật",
  "Thiết kế",
]

const RECENT_SEARCH_STORAGE_KEY = "snapgram_recent_searches"

function ExploreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [activeCategory, setActiveCategory] = useState("Dành cho bạn")
  const [searchResults, setSearchResults] = useState<UserProfileResponse[]>([])
  const [recentSearches, setRecentSearches] = useState<UserProfileResponse[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const searchContainerRef = useRef<HTMLDivElement | null>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCH_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setRecentSearches(parsed)
      }
    } catch {
      // Ignore storage error
    }
  }, [])

  // Sync URL query param if navigated from mobile navbar
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) {
      setSearchQuery(q)
      setIsSearchFocused(true)
    }
  }, [searchParams])

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced user search via API
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await userService.searchUsers(q, 0, 12)
        setSearchResults(res.content || [])
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 280)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const saveToRecentSearches = (userItem: UserProfileResponse) => {
    const next = [
      userItem,
      ...recentSearches.filter((item) => item.username !== userItem.username),
    ].slice(0, 8)
    setRecentSearches(next)
    try {
      localStorage.setItem(RECENT_SEARCH_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignore
    }
  }

  const removeRecentItem = (username: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = recentSearches.filter((item) => item.username !== username)
    setRecentSearches(next)
    try {
      localStorage.setItem(RECENT_SEARCH_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignore
    }
  }

  const clearAllRecent = () => {
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_SEARCH_STORAGE_KEY)
    } catch {
      // Ignore
    }
  }

  const handleSelectUser = (userItem: UserProfileResponse) => {
    saveToRecentSearches(userItem)
    setIsSearchFocused(false)
    router.push(`/u/${userItem.username}`)
  }

  const filteredExploreItems =
    activeCategory === "Dành cho bạn"
      ? mockExploreItems
      : mockExploreItems.filter((item) => item.category === activeCategory)

  const showDropdown =
    isSearchFocused && (searchQuery.trim().length > 0 || recentSearches.length > 0)

  return (
    <div className="px-3 md:px-8 pt-4 md:pt-6 space-y-5">
      {/* Top Integrated Search Bar */}
      <div ref={searchContainerRef} className="max-w-xl mx-auto w-full relative z-30">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (!isSearchFocused) setIsSearchFocused(true)
            }}
            placeholder="Tìm kiếm tài khoản, tên hiển thị..."
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-muted/70 border border-border/50 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:bg-background transition shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setSearchResults([])
              }}
              className="absolute right-3 p-1 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 text-muted-foreground hover:text-foreground transition"
              aria-label="Xóa từ khóa"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Search Dropdown Overlay (Recent Searches or Live User Results) */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-xl overflow-hidden">
            {searchQuery.trim() ? (
              isSearching ? (
                <div className="p-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tìm kiếm...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Không tìm thấy tài khoản nào khớp với &ldquo;{searchQuery.trim()}&rdquo;.
                </div>
              ) : (
                <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
                  {searchResults.map((u) => (
                    <button
                      key={u.id || u.username}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/60 transition"
                    >
                      <img
                        src={u.avatarUrl || "/profile.jpg"}
                        alt={u.username}
                        className="w-10 h-10 rounded-full object-cover bg-muted shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {u.username}
                          </p>
                          <VerifiedBadge
                            verified={u.verified}
                            verifiedUntil={u.verifiedUntil}
                            size={13}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {u.displayName || u.category || "Người dùng Snapgram"}
                        </p>
                      </div>
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Tìm kiếm gần đây
                  </span>
                  <button
                    type="button"
                    onClick={clearAllRecent}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className="divide-y divide-border/40 max-h-72 overflow-y-auto">
                  {recentSearches.map((u) => (
                    <div
                      key={u.username}
                      onClick={() => handleSelectUser(u)}
                      className="flex items-center justify-between gap-3 p-3 hover:bg-muted/60 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.avatarUrl || "/profile.jpg"}
                          alt={u.username}
                          className="w-9 h-9 rounded-full object-cover bg-muted shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {u.username}
                            </p>
                            <VerifiedBadge
                              verified={u.verified}
                              verifiedUntil={u.verifiedUntil}
                              size={13}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {u.displayName || "Người dùng Snapgram"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => removeRecentItem(u.username, e)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition"
                        aria-label="Xóa khỏi lịch sử"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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

      {/* Explore Mosaic / Grid Layout Below */}
      <div className="grid grid-cols-3 gap-1 md:gap-2 auto-rows-[140px] sm:auto-rows-[200px] md:auto-rows-[260px] pt-1">
        {filteredExploreItems.map((item) => (
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

            {item.isReel && (
              <div className="absolute top-2.5 right-2.5 z-10 text-white drop-shadow-md">
                <Film className="w-4 h-4" />
              </div>
            )}

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
  )
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Explore Container */}
      <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto pb-12">
        <Navbar />
        <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Đang tải...</div>}>
          <ExploreContent />
        </Suspense>
        <Navbot />
      </div>
    </div>
  )
}
