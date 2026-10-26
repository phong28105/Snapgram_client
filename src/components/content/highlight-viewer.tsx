"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { contentService } from "@/services/content.service"
import { ChevronLeft, ChevronRight, X, Play, Pause } from "lucide-react"
import type { HighlightDetailResponse, StoryResponse } from "@/types/content.type"

interface HighlightViewerProps {
  highlightId: string | null
  onClose: () => void
}

export function HighlightViewer({ highlightId, onClose }: HighlightViewerProps) {
  const [detail, setDetail] = useState<HighlightDetailResponse | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!highlightId) {
      setDetail(null)
      setCurrentIndex(0)
      setProgress(0)
      return
    }

    setIsLoading(true)
    contentService
      .getHighlightDetail(highlightId)
      .then((res) => {
        setDetail(res)
        setCurrentIndex(0)
        setProgress(0)
      })
      .catch(() => {
        onClose()
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [highlightId, onClose])

  const stories: StoryResponse[] = detail?.stories || []
  const currentStory = stories[currentIndex]

  // Auto-advance
  useEffect(() => {
    if (!highlightId || isPaused || stories.length === 0) return

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((curr) => curr + 1)
            return 0
          } else {
            onClose()
            return 0
          }
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(timer)
  }, [highlightId, isPaused, currentIndex, stories.length, onClose])

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setProgress(0)
    }
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  if (!highlightId) return null

  return (
    <Dialog open={Boolean(highlightId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideCloseButton
        className="max-w-[420px] h-[90vh] max-h-[780px] p-0 overflow-hidden bg-black border-none text-white flex flex-col select-none rounded-2xl"
      >
        {/* Story Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width:
                    idx < currentIndex
                      ? "100%"
                      : idx === currentIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header */}
        <div className="absolute top-6 inset-x-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border border-white/40 overflow-hidden">
              <img
                src={detail?.coverMediaUrl || "/profile.jpg"}
                alt={detail?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-semibold leading-none">{detail?.name}</p>
              <p className="text-[10px] text-white/70 mt-0.5">
                {currentIndex + 1} / {stories.length || 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="p-1.5 rounded-full hover:bg-white/20 transition text-white"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Media Viewer */}
        <div
          className="relative flex-1 w-full h-full flex items-center justify-center cursor-pointer"
          onClick={() => setIsPaused((p) => !p)}
        >
          {isLoading || !currentStory ? (
            <div className="animate-pulse text-white/50 text-xs">Đang tải tin nổi bật...</div>
          ) : currentStory.mediaType === "VIDEO" ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt={detail?.name || "Tin nổi bật"}
              className="w-full h-full object-contain"
            />
          )}

          {/* Left/Right click zones */}
          <div
            className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-w-resize"
            onClick={handlePrev}
          />
          <div
            className="absolute right-0 inset-y-0 w-1/3 z-20 cursor-e-resize"
            onClick={handleNext}
          />

          {/* Prev/Next arrow buttons */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {currentIndex < stories.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Caption */}
          {currentStory?.caption && (
            <div className="absolute bottom-6 inset-x-4 z-30 bg-black/60 backdrop-blur-sm p-3 rounded-xl">
              <p className="text-xs text-center text-white/95">{currentStory.caption}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
