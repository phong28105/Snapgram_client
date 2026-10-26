"use client"

import Sidebar from "@/app/(home)/_components/sidebar"
import Navbar from "@/app/(home)/_components/navbar"
import Navbot from "@/app/(home)/_components/navbot"

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto">
        <Navbar />

        <div className="px-4 md:px-12 pt-6 md:pt-10 pb-16 md:pb-12 max-w-4xl w-full mx-auto space-y-8 animate-pulse">
          {/* Profile Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-12">
            {/* Avatar skeleton */}
            <div className="relative shrink-0 pt-3">
              <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-muted/80 ring-2 ring-muted" />
            </div>

            {/* Info & Stats Skeleton */}
            <div className="flex-1 space-y-4 w-full text-center sm:text-left">
              {/* Username + Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-4">
                <div className="h-7 w-36 bg-muted/80 rounded-md mx-auto sm:mx-0" />
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <div className="h-8 w-24 bg-muted/80 rounded-md" />
                  <div className="h-8 w-24 bg-muted/80 rounded-md" />
                </div>
              </div>

              {/* Stats: Posts, Followers, Following */}
              <div className="flex items-center justify-center sm:justify-start gap-8 pt-1">
                <div className="h-5 w-20 bg-muted/80 rounded-md" />
                <div className="h-5 w-24 bg-muted/80 rounded-md" />
                <div className="h-5 w-24 bg-muted/80 rounded-md" />
              </div>

              {/* Bio & Details */}
              <div className="space-y-2 pt-2 max-w-sm mx-auto sm:mx-0">
                <div className="h-4 w-32 bg-muted/80 rounded" />
                <div className="h-3.5 w-full bg-muted/80 rounded" />
                <div className="h-3.5 w-3/4 bg-muted/80 rounded" />
              </div>
            </div>
          </div>

          {/* Highlights Skeleton */}
          <div className="flex gap-4 sm:gap-6 overflow-hidden pt-4 pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted/80 ring-2 ring-muted" />
                <div className="h-3 w-12 bg-muted/80 rounded" />
              </div>
            ))}
          </div>

          {/* Grid Tab Bar */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-center gap-12">
              <div className="h-4 w-24 bg-muted/80 rounded" />
            </div>
          </div>

          {/* 9 Grid Squares Shimmer */}
          <div className="grid grid-cols-3 gap-1 md:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div
                key={i}
                className="aspect-square bg-muted/80 rounded-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            ))}
          </div>
        </div>

        <Navbot />
      </div>
    </div>
  )
}

export default ProfileSkeleton
