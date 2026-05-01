"use client";
export default function SkeletonCard() {
  return (
    <div className="relative rounded-[20px] overflow-hidden bg-card border border-border/50 h-[220px] w-full">
      <div className="w-full h-full relative overflow-hidden skeleton-shimmer">
        {/* Top Badge Placeholder */}
        <div className="absolute top-2 left-2 w-6 h-4 bg-white/20 rounded-md" />
        
        {/* Bottom Info Placeholder */}
        <div className="absolute inset-x-0 bottom-0 pt-10 pb-2.5 px-2.5 bg-gradient-to-t from-black/40 to-transparent">
          <div className="h-3 w-3/4 bg-white/30 rounded mb-2" />
          <div className="flex items-center justify-between">
            <div className="h-2 w-1/2 bg-white/20 rounded" />
            <div className="h-2 w-8 bg-white/20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
