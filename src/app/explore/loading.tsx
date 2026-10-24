export default function Loading() {
  return (
    <div className="px-3 md:px-8 pt-4 md:pt-6 space-y-5">
      {/* Search Bar Skeleton */}
      <div className="max-w-xl mx-auto w-full">
        <div className="h-12 rounded-2xl bg-muted/60 animate-pulse" />
      </div>

      {/* Category Chips Bar Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 rounded-lg bg-muted/60 animate-pulse shrink-0"
          />
        ))}
      </div>

      {/* Mosaic Grid Skeleton */}
      <div className="grid grid-cols-3 gap-1 md:gap-2 auto-rows-[140px] sm:auto-rows-[200px] md:auto-rows-[260px] pt-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-sm bg-muted/60 animate-pulse ${
              i % 6 === 2 ? "row-span-2 col-span-2" : "col-span-1 row-span-1"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
