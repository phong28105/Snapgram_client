"use client"

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Clock,
  Compass,
  Film,
  Hash,
  Heart,
  Layers,
  Loader2,
  MessageCircle,
  Search,
  User,
  X,
} from "lucide-react"
import Sidebar from "@/app/(home)/_components/sidebar"
import Navbot from "@/app/(home)/_components/navbot"
import Navbar from "@/app/(home)/_components/navbar"
import { userService } from "@/services/user.service"
import { contentService } from "@/services/content.service"
import type { UserProfileResponse } from "@/types/user.type"
import type { HashtagResponse, PostResponse } from "@/types/content.type"

interface ExploreTile {
  id: string
  image: string
  likes: number
  comments: number
  category: string
  isReel?: boolean
  isCarousel?: boolean
  span?: string
}

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

function mapPostToTile(p: PostResponse, idx: number): ExploreTile {
  const isReel = p.contentType === "REEL"
  const isCarousel = p.contentType === "CAROUSEL" || (Boolean(p.mediaItems) && (p.mediaItems?.length ?? 0) > 1)
  return {
    id: p.id,
    image:
      p.mediaItems?.[0]?.thumbnailUrl ||
      p.mediaItems?.[0]?.mediaUrl ||
      p.mediaUrl ||
      "/profile.jpg",
    likes: p.likeCount ?? 0,
    comments: p.commentCount ?? 0,
    category: "Dành cho bạn",
    isReel,
    isCarousel,
    span: idx % 7 === 1 || idx % 7 === 4 ? "row-span-2" : undefined,
  }
}

function ExploreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [activeCategory, setActiveCategory] = useState("Dành cho bạn")
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<UserProfileResponse[]>([])
  const [hashtagResults, setHashtagResults] = useState<HashtagResponse[]>([])
  const [recentSearches, setRecentSearches] = useState<UserProfileResponse[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [apiTiles, setApiTiles] = useState<ExploreTile[]>([])

  const searchContainerRef = useRef<HTMLDivElement | null>(null)

  // Load explore posts từ API khi khởi tạo
  const loadExplorePosts = useCallback(async () => {
    try {
      const res = await contentService.getExplorePosts(0, 30)
      if (res.content && res.content.length > 0) {
        setApiTiles(res.content.map(mapPostToTile))
      }
    } catch {
      // Fallback
    }
  }, [])

  useEffect(() => {
    loadExplorePosts()
  }, [loadExplorePosts])

  // Lọc bài viết theo hashtag khi người dùng chọn hashtag
  const loadPostsByTag = useCallback(async (tag: string) => {
    try {
      const postsRes = await contentService.getPostsByHashtag(tag, 0, 30)
      const list = postsRes.content || []
      if (list.length > 0) {
        setApiTiles(list.map(mapPostToTile))
      }
    } catch {
      // Keep existing
    }
  }, [])

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

  // Debounced song song: user search + hashtag search
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setSearchResults([])
      setHashtagResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      const cleanTag = q.replace(/^#/, "")
      const [usersRes, tagsRes] = await Promise.allSettled([
        userService.searchUsers(cleanTag || q, 0, 10),
        contentService.searchHashtags(cleanTag),
      ])
      setSearchResults(
        usersRes.status === "fulfilled" ? usersRes.value.content || [] : []
      )
      setHashtagResults(
        tagsRes.status === "fulfilled" ? (tagsRes.value || []).slice(0, 8) : []
      )
      setIsSearching(false)
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

  const handleSelectHashtag = (tag: string) => {
    setActiveHashtag(tag)
    setActiveCategory(`#${tag}`)
    setIsSearchFocused(false)
    loadPostsByTag(tag)
  }

  const handleSelectCategory = (cat: string) => {
    setActiveCategory(cat)
    setActiveHashtag(null)
    if (cat === "Dành cho bạn") {
      loadExplorePosts()
    } else {
      loadPostsByTag(cat.toLowerCase())
    }
  }

  const allTiles = apiTiles

  const filteredExploreItems =
    activeCategory === "Dành cho bạn"
      ? allTiles
      : activeHashtag
      ? allTiles
      : allTiles.filter((item) => item.category === activeCategory)

  return (
    <div className="px-3 md:px-8 pt-4 md:pt-6 space-y-5 relative">
      {/* Backdrop làm tối phần lưới bên dưới khi đang mở khung tìm kiếm */}
      {isSearchFocused && (
        <div
          onClick={() => setIsSearchFocused(false)}
          className="fixed inset-0 bg-black/40 z-20 transition-opacity"
        />
      )}

      {/* Top Integrated Search Bar */}
      <div ref={searchContainerRef} className="max-w-xl mx-auto w-full relative z-30">
        <div
          className={`relative flex items-center rounded-2xl transition-all duration-150 ${
            isSearchFocused
              ? "bg-white dark:bg-zinc-900 border-2 border-primary shadow-xl ring-4 ring-primary/10"
              : "bg-zinc-100 dark:bg-zinc-900 border border-border hover:border-foreground/30 shadow-xs"
          }`}
        >
          <Search
            className={`w-4 h-4 absolute left-4 pointer-events-none transition-colors ${
              isSearchFocused ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (!isSearchFocused) setIsSearchFocused(true)
            }}
            placeholder="Tìm kiếm tài khoản, tên hoặc #hashtag..."
            className="w-full h-12 pl-11 pr-10 rounded-2xl bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setSearchResults([])
                setHashtagResults([])
              }}
              className="absolute right-3 p-1 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-foreground transition"
              aria-label="Xóa từ khóa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Dropdown Overlay */}
        {isSearchFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-foreground shadow-2xl overflow-hidden z-40">
            {searchQuery.trim() ? (
              isSearching ? (
                <div className="p-6 flex items-center justify-center gap-2.5 text-xs text-muted-foreground bg-white dark:bg-zinc-900">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Đang tìm kiếm &ldquo;{searchQuery.trim()}&rdquo;...</span>
                </div>
              ) : searchResults.length === 0 && hashtagResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground bg-white dark:bg-zinc-900">
                  Không tìm thấy kết quả nào khớp với &ldquo;{searchQuery.trim()}&rdquo;.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {/* Hashtags Section */}
                  {hashtagResults.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Hash className="w-3 h-3" />
                        <span>Hashtags</span>
                      </div>
                      {hashtagResults.map((tag) => (
                        <button
                          key={tag.id || tag.tag}
                          type="button"
                          onClick={() => handleSelectHashtag(tag.tag)}
                          className="w-full flex items-center gap-3.5 px-4 py-2.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/90 transition"
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Hash className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground">
                              #{tag.tag}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {(tag.postCount ?? 0).toLocaleString("vi-VN")} bài viết
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Users Section */}
                  {searchResults.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        <span>Tài khoản</span>
                      </div>
                      {searchResults.map((u) => (
                        <button
                          key={u.id || u.username}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="w-full flex items-center gap-3.5 px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/90 transition"
                        >
                          <img
                            src={u.avatarUrl || "/profile.jpg"}
                            alt={u.username}
                            className="w-10 h-10 rounded-full object-cover bg-muted border border-border shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                              {u.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {u.displayName || u.category || "Người dùng Snapgram"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            ) : recentSearches.length > 0 ? (
              <div className="bg-white dark:bg-zinc-900">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Tìm kiếm gần đây
                  </span>
                  <button
                    type="button"
                    onClick={clearAllRecent}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
                  {recentSearches.map((u) => (
                    <div
                      key={u.username}
                      onClick={() => handleSelectUser(u)}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/90 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={u.avatarUrl || "/profile.jpg"}
                          alt={u.username}
                          className="w-10 h-10 rounded-full object-cover bg-muted border border-border shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {u.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {u.displayName || "Người dùng Snapgram"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => removeRecentItem(u.username, e)}
                        className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-muted-foreground hover:text-foreground transition"
                        aria-label="Xóa khỏi lịch sử"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground bg-white dark:bg-zinc-900">
                Nhập tên tài khoản, tên hiển thị hoặc #hashtag để bắt đầu tìm kiếm.
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
            onClick={() => handleSelectCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeCategory === cat
                ? "bg-foreground text-background"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
        {activeHashtag && !categories.includes(`#${activeHashtag}`) && (
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-foreground text-background"
          >
            #{activeHashtag}
          </button>
        )}
      </div>

      {/* Explore Mosaic / Grid Layout Below */}
      {filteredExploreItems.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mx-auto text-muted-foreground">
            <Compass className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Chưa có bài viết nào
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Không tìm thấy bài viết nào trong danh mục &quot;{activeCategory}&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-2 auto-rows-[140px] sm:auto-rows-[200px] md:auto-rows-[260px] pt-1">
          {filteredExploreItems.map((item) => (
            <Link
              key={item.id}
              href={item.isReel ? `/reel/${item.id}` : `/p/${item.id}`}
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

              {item.isReel ? (
                <div className="absolute top-2.5 right-2.5 z-10 text-white drop-shadow-md">
                  <Film className="w-4 h-4" />
                </div>
              ) : item.isCarousel ? (
                <div className="absolute top-2.5 right-2.5 z-10 text-white drop-shadow-md">
                  <Layers className="w-4 h-4" />
                </div>
              ) : null}

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
      )}
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
