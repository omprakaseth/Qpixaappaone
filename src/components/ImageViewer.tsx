"use client";
import React, { useState, useRef, useCallback } from 'react';
import { X, Download, Share2, Bookmark, RotateCcw, Upload, MessageSquare, Info } from 'lucide-react';
import WatermarkedImage from '@/components/WatermarkedImage';
import { useAppState } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
  actions?: {
    onDownload?: () => void;
    onShare?: () => void;
    onBookmark?: () => void;
    onReuse?: () => void;
    onPublish?: () => void;
  };
}

export default function ImageViewer({ src, alt, onClose, actions }: ImageViewerProps) {
  const { isPro } = useAppState();
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const lastDistRef = useRef(0);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const getDistance = (t1: React.Touch, t2: React.Touch) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      lastDistRef.current = getDistance(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1 && scale > 1) {
      isDragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getDistance(e.touches[0], e.touches[1]);
      const ratio = dist / lastDistRef.current;
      setScale(s => Math.min(5, Math.max(1, s * ratio)));
      lastDistRef.current = dist;
    } else if (e.touches.length === 1 && isDragging.current && scale > 1) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      setTranslate(t => ({ x: t.x + dx, y: t.y + dy }));
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (scale <= 1) setTranslate({ x: 0, y: 0 });
  }, [scale]);

  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  }, [scale]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform"
        >
          <X size={22} className="text-white" />
        </button>
        {alt && (
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform",
              showInfo ? "bg-primary text-primary-foreground" : "bg-white/10 text-white"
            )}
          >
            <Info size={20} />
          </button>
        )}
      </div>

      <div
        ref={imgRef}
        className="flex-1 w-full flex items-center justify-center overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <div
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: isDragging.current ? 'none' : 'transform 0.2s ease-out',
          }}
          className="relative"
        >
          <WatermarkedImage
            src={src}
            alt={alt || ''}
            className="max-w-full max-h-[85vh] object-contain select-none"
            isPro={isPro}
          />
        </div>
      </div>

      {/* Info Panel Overlay */}
      <AnimatePresence>
        {showInfo && alt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-4 bottom-24 p-4 bg-background/90 backdrop-blur-xl border border-border rounded-2xl z-30 shadow-2xl"
          >
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Prompt Details</h4>
            <p className="text-sm text-foreground leading-relaxed max-h-40 overflow-y-auto pr-2">{alt}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Actions Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm px-6 py-4 bg-background/50 backdrop-blur-2xl border border-white/10 rounded-3xl flex items-center justify-between z-20 shadow-2xl">
        <button onClick={actions?.onBookmark} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
          <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Bookmark size={18} className="text-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Save</span>
        </button>
        
        <button onClick={actions?.onDownload} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
          <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Download size={18} className="text-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Get</span>
        </button>

        <div className="h-8 w-px bg-white/10 mx-2" />

        <button onClick={actions?.onPublish} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Upload size={20} className="text-primary-foreground" />
          </div>
          <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Publish</span>
        </button>

        <div className="h-8 w-px bg-white/10 mx-2" />

        <button onClick={actions?.onReuse} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
          <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <RotateCcw size={18} className="text-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Reuse</span>
        </button>

        <button onClick={actions?.onShare} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
          <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Share2 size={18} className="text-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Share</span>
        </button>
      </div>
    </div>
  );
}
