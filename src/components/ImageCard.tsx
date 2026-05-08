import React, { useState, useCallback, useRef } from 'react';
import { Heart, Play, Film } from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { Post } from '@/context/AppContext';
import { useDoubleTap } from '@/hooks/useDoubleTap';
import { Loader2 } from 'lucide-react';

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
  const [isClicking, setIsClicking] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);

  const handleTap = useDoubleTap(
    () => {
      if (!longPressTriggered.current) {
        setIsClicking(true);
        onTap();
        // Reset clicking state after a short delay or when component unmounts/remounts
        setTimeout(() => setIsClicking(false), 2000);
      }
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
      className={cn(
        "relative rounded-[20px] overflow-hidden bg-card cursor-pointer h-[220px] w-full transition-all active:scale-[0.98]",
        isClicking && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      onClick={() => {
        if (longPressTriggered.current) return;
        handleTap();
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="w-full h-full relative overflow-hidden">
        {/* Skeleton placeholder */}
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton-shimmer" />
        )}
        {post.type === 'video' || post.videoUrl ? (
          <video
            src={post.videoUrl || post.imageUrl}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
              isClicking && "brightness-50 scale-110"
            )}
            onLoadedData={() => setImgLoaded(true)}
            onError={(e) => {
              console.error("Video load error:", post.videoUrl);
              setImgLoaded(true); // Don't block UI
            }}
            muted
            playsInline
            loop
            onMouseOver={e => e.currentTarget.play()}
            onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
          />
        ) : (
          <img
            src={post.imageUrl}
            alt={post.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
              isClicking && "brightness-50 scale-110"
            )}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        )}

        {/* Loading spinner when clicking */}
        {isClicking && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* AI/Video Badges - top left */}
        <div className="absolute top-2 left-2 flex gap-1 z-10">
          {(post.type === 'video' || post.videoUrl) ? (
            <span className="bg-primary backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-lg border border-white/20">
              <Play size={8} fill="white" /> VIDEO
            </span>
          ) : (
            <span className="bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/10">
              AI
            </span>
          )}
          {(post.isShort || post.videoUrl) && (
            <span className="bg-purple-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-white/10">
              <Film size={8} /> REEL
            </span>
          )}
        </div>

        {/* Video Play Icon Indicator (Left side as requested) */}
        {(post.type === 'video' || post.videoUrl) && !isClicking && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10">
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-active:scale-95 transition-transform">
              <Play size={14} fill="white" className="ml-0.5" />
            </div>
          </div>
        )}

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
