import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function PostSkeleton() {
  return (
    <div className="flex flex-col border-b border-border/60 pb-5 pt-3 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
        </div>
        <Skeleton className="w-5 h-5 rounded-full" />
      </div>

      {/* Media: exact aspect-square match with PostCard */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted/60 my-1" />

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 pb-1 px-1">
        <div className="flex items-center gap-4">
          <Skeleton className="w-6 h-6 rounded-md" />
          <Skeleton className="w-6 h-6 rounded-md" />
          <Skeleton className="w-6 h-6 rounded-md" />
        </div>
        <Skeleton className="w-6 h-6 rounded-md" />
      </div>

      {/* Likes */}
      <div className="px-1 pt-1.5 pb-1">
        <Skeleton className="h-3.5 w-24 rounded" />
      </div>

      {/* Caption lines */}
      <div className="px-1 space-y-1.5 pt-1">
        <Skeleton className="h-3 w-4/5 rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>

      {/* Comments preview hint */}
      <div className="px-1 pt-2">
        <Skeleton className="h-3 w-32 rounded" />
      </div>
    </div>
  )
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="w-full max-w-[470px] mx-auto space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}

export default FeedSkeleton
