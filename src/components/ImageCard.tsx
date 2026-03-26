import { useState, useCallback, useRef } from 'react';
import { Heart } from 'lucide-react';
import { Post, formatNumber } from '@/data/mockData';
import { useDoubleTap } from '@/hooks/useDoubleTap';

interface ImageCardProps {
  post: Post;
  onTap: () => void;
  onDoubleTap: () => void;
  onLongPress: () => void;
  onCreatorTap?: () => void;
}

export default function ImageCard({ post, onTap, onDoubleTap, onLongPress, onCreatorTap }: ImageCardProps) {
  const [showHeart, setShowHeart] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);

  const handleTap = useDoubleTap(
    () => {
      if (!longPressTriggered.current) onTap();
    },
    () => {
      if (longPressTriggered.current) return;
      onDoubleTap();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 600);
    }
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    longPressTriggered.current = false;
    isScrolling.current = false;
    touchStartY.current = e.touches[0].clientY;
    longPressTimer.current = setTimeout(() => {
      if (!isScrolling.current) {
        longPressTriggered.current = true;
        onLongPress();
      }
    }, 350);
  }, [onLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (delta > 10) {
      isScrolling.current = true;
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-card cursor-pointer"
      onClick={() => {
        if (longPressTriggered.current) return;
        handleTap();
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="aspect-[3/4] relative overflow-hidden">
        {/* Skeleton placeholder */}
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton-shimmer" />
        )}
        <img
          src={post.imageUrl}
          alt={post.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />

        {/* AI Badge - top left */}
        <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
          AI
        </span>

        {/* Heart burst animation */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart size={48} fill="#FF7A00" color="#FF7A00" className="animate-heart-burst" />
          </div>
        )}

        {/* Bottom gradient overlay with info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-10 pb-2.5 px-2.5">
          <p className="text-[13px] font-semibold text-white truncate leading-tight">{post.title}</p>
          <div className="flex items-center justify-between mt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onCreatorTap?.(); }}
              className="flex items-center gap-1 active:opacity-70 transition-opacity min-w-0"
            >
              <span className="text-[11px] text-white/70 truncate">{post.creator.name}</span>
            </button>
            <span className="flex items-center gap-0.5 text-[11px] text-white/80 shrink-0">
              <Heart size={10} fill={post.isLiked ? '#FF7A00' : 'none'} color={post.isLiked ? '#FF7A00' : 'white'} />
              {formatNumber(post.likes)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
