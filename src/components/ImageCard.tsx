"use client";
import React, { useState, useCallback, useRef } from 'react';
import { Heart } from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { Post } from '@/types';
import { useDoubleTap } from '@/hooks/useDoubleTap';
import Image from 'next/image';

import { motion } from 'framer-motion';

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

  const lastTapTime = useRef(0);
  const handleTapAction = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 500) return;
    lastTapTime.current = now;
    
    if (!longPressTriggered.current) {
      onTap();
    }
  }, [onTap]);

  const handleDoubleTapAction = useCallback(() => {
    if (longPressTriggered.current) return;
    onDoubleTap();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 600);
  }, [onDoubleTap]);

  const handleTapEvents = useDoubleTap(handleTapAction, handleDoubleTapAction);

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
      className="relative rounded-[20px] overflow-hidden bg-card cursor-pointer h-[220px] w-full transition-all active:scale-[0.98]"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (longPressTriggered.current) return;
        handleTapEvents();
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
        <div 
          className="w-full h-full"
        >
          <div
            className="w-full h-full relative"
          >
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className={cn(
                "object-cover transition-all duration-500",
                imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              )}
              onLoadingComplete={() => setImgLoaded(true)}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* AI Badge - top left */}
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          <span className="bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
            AI
          </span>
          {post.isMock && (
            <span className="bg-primary/80 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
              SAMPLE
            </span>
          )}
        </div>

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
