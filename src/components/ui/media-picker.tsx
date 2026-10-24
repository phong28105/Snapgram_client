"use client"

import React, { useEffect, useRef, useState } from "react"
import { ImagePlus, Loader2, Search, Smile, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

export type PickedMedia =
  | { kind: "IMAGE"; file: File }
  | { kind: "GIF"; url: string }
  | { kind: "STICKER"; emoji: string }

type PickerTab = "image" | "sticker" | "gif"

interface MediaPickerProps {
  onPick: (media: PickedMedia) => void
  disabled?: boolean
  /** Chỉ hiện một số tab (mặc định cả 3). */
  tabs?: PickerTab[]
}

/** Sticker dùng emoji — không cần asset, hiển thị lớn như sticker thật. */
export const STICKER_EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "🥰", "😘",
  "😎", "🤩", "🥳", "🤔", "😴", "😭", "😱", "🤯",
  "😡", "🙃", "😇", "🤗", "🫡", "🤝", "👍", "👎",
  "👏", "🙏", "💪", "✌️", "🤞", "🫶", "❤️", "💔",
  "🔥", "✨", "🎉", "🎁", "🌈", "⭐", "☀️", "🌙",
  "🍀", "🚀", "🎬", "🎵", "⚽", "🏆", "🍕", "☕",
]

interface GifItem {
  id: string
  url: string
  preview: string
  title: string
}

const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY?.trim()

/**
 * Bảng chọn media dùng chung cho chat và bình luận:
 *  - Ảnh: chọn file từ máy (upload qua media-service ở nơi gọi)
 *  - Sticker: emoji cỡ lớn
 *  - GIF: tìm qua Giphy (cần NEXT_PUBLIC_GIPHY_API_KEY)
 */
export function MediaPicker({ onPick, disabled, tabs }: MediaPickerProps) {
  const allowed: PickerTab[] = tabs ?? ["image", "sticker", "gif"]
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<PickerTab>(allowed[0] ?? "image")
  const [gifQuery, setGifQuery] = useState("")
  const [gifs, setGifs] = useState<GifItem[]>([])
  const [isLoadingGifs, setIsLoadingGifs] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Đóng khi click ra ngoài
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  // Nạp GIF mặc định khi mở tab GIF
  useEffect(() => {
    if (!open || tab !== "gif" || !GIPHY_KEY) return
    void searchGifs("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab])

  const searchGifs = async (query: string) => {
    if (!GIPHY_KEY) return
    setIsLoadingGifs(true)
    try {
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query.trim())}&limit=24&rating=pg-13&lang=vi`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=pg-13`
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error("Giphy error")
      const json = (await res.json()) as {
        data?: Array<{
          id: string
          title?: string
          images?: {
            fixed_height?: { url?: string }
            fixed_height_small?: { url?: string }
            downsized?: { url?: string }
          }
        }>
      }
      const items: GifItem[] = (json.data ?? [])
        .map((g) => {
          const full = g.images?.fixed_height?.url || g.images?.downsized?.url
          const preview = g.images?.fixed_height_small?.url || full
          if (!full || !preview) return null
          return { id: g.id, url: full, preview, title: g.title || "GIF" }
        })
        .filter((g): g is GifItem => g !== null)
      setGifs(items)
    } catch {
      setGifs([])
      toast.error("Không tải được GIF. Kiểm tra kết nối mạng.")
    } finally {
      setIsLoadingGifs(false)
    }
  }

  const handleFile = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ hỗ trợ tệp ảnh.")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ảnh tối đa 8MB.")
      return
    }
    onPick({ kind: "IMAGE", file })
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition disabled:opacity-40"
        aria-label="Gửi ảnh, sticker hoặc GIF"
        aria-expanded={open}
      >
        <ImagePlus className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-[300px] rounded-xl border border-border bg-popover shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex gap-1">
              {allowed.includes("image") && (
                <TabButton active={tab === "image"} onClick={() => setTab("image")} icon={<ImagePlus className="w-3.5 h-3.5" />} label="Ảnh" />
              )}
              {allowed.includes("sticker") && (
                <TabButton active={tab === "sticker"} onClick={() => setTab("sticker")} icon={<Smile className="w-3.5 h-3.5" />} label="Sticker" />
              )}
              {allowed.includes("gif") && (
                <TabButton active={tab === "gif"} onClick={() => setTab("gif")} icon={<Sparkles className="w-3.5 h-3.5" />} label="GIF" />
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-accent text-muted-foreground"
              aria-label="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 max-h-[260px] overflow-y-auto">
            {tab === "image" && (
              <div className="py-6 flex flex-col items-center gap-2 text-center">
                <ImagePlus className="w-8 h-8 text-muted-foreground/60" />
                <p className="text-[11px] text-muted-foreground">Chọn ảnh từ máy (tối đa 8MB)</p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Chọn ảnh
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleFile(e.target.files?.[0] ?? null)
                    e.target.value = ""
                  }}
                />
              </div>
            )}

            {tab === "sticker" && (
              <div className="grid grid-cols-8 gap-1">
                {STICKER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onPick({ kind: "STICKER", emoji })
                      setOpen(false)
                    }}
                    className="aspect-square rounded-md hover:bg-accent text-xl leading-none flex items-center justify-center transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {tab === "gif" && (
              <div className="space-y-2">
                {GIPHY_KEY ? (
                  <>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={gifQuery}
                        onChange={(e) => setGifQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            void searchGifs(gifQuery)
                          }
                        }}
                        placeholder="Tìm GIF rồi Enter…"
                        className="w-full bg-muted/60 pl-7 pr-2 py-1.5 rounded-md text-[11px] outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {isLoadingGifs ? (
                      <div className="py-6 flex justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : gifs.length === 0 ? (
                      <p className="py-6 text-center text-[11px] text-muted-foreground">Không có GIF nào</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-1">
                        {gifs.map((gif) => (
                          <button
                            key={gif.id}
                            type="button"
                            onClick={() => {
                              onPick({ kind: "GIF", url: gif.url })
                              setOpen(false)
                            }}
                            className="aspect-square overflow-hidden rounded-md border border-border hover:ring-2 hover:ring-primary transition"
                            title={gif.title}
                          >
                            <img src={gif.preview} alt={gif.title} className="w-full h-full object-cover" loading="lazy" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-6 px-3 text-center space-y-1">
                    <Sparkles className="w-7 h-7 mx-auto text-muted-foreground/60" />
                    <p className="text-[11px] font-medium">Chưa cấu hình GIF</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Thêm <code className="px-1 rounded bg-muted">NEXT_PUBLIC_GIPHY_API_KEY</code> vào{" "}
                      <code className="px-1 rounded bg-muted">.env.local</code> rồi khởi động lại để bật tìm GIF.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

export default MediaPicker
