export default function SkeletonCard() {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-card border border-border/50">
      <div className="aspect-square relative overflow-hidden bg-secondary/50 animate-pulse">
        {/* Top Badge Placeholder */}
        <div className="absolute top-2 left-2 w-6 h-4 bg-secondary-foreground/10 rounded-md" />
        
        {/* Bottom Info Placeholder */}
        <div className="absolute inset-x-0 bottom-0 pt-10 pb-2.5 px-2.5 bg-gradient-to-t from-black/20 to-transparent">
          <div className="h-3 w-3/4 bg-secondary-foreground/20 rounded mb-2" />
          <div className="flex items-center justify-between">
            <div className="h-2 w-1/2 bg-secondary-foreground/20 rounded" />
            <div className="h-2 w-8 bg-secondary-foreground/20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
