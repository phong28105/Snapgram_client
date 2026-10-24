import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background py-4 md:py-8 px-2 sm:px-4 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-card border border-border rounded-xl overflow-hidden flex flex-col md:flex-row shadow-lg min-h-[500px] md:h-[82vh] max-h-[780px] animate-pulse">
        {/* Left media skeleton */}
        <div className="flex-1 bg-muted/60 min-h-[360px] md:min-h-0" />

        {/* Right panel skeleton */}
        <div className="w-full md:w-[370px] lg:w-[410px] flex flex-col border-t md:border-t-0 md:border-l border-border bg-card p-3.5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/60">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-2.5 w-16 rounded" />
            </div>
          </div>

          {/* Comment list skeleton */}
          <div className="flex-1 space-y-3 py-2 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-2.5 w-full rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom actions & input skeleton */}
          <div className="pt-2 border-t border-border/60 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <Skeleton className="w-6 h-6 rounded" />
                <Skeleton className="w-6 h-6 rounded" />
                <Skeleton className="w-6 h-6 rounded" />
              </div>
              <Skeleton className="w-6 h-6 rounded" />
            </div>
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
