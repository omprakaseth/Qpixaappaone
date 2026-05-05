import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCcw, Trash2, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageViewerProps {
  url: string;
  alt?: string;
  onClose: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  isOwner?: boolean;
}

export function ImageViewer({ url, alt, onClose, onDelete, onDownload, onShare, isOwner }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const velocity = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const animationFrame = useRef<number>(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastTouchTime = useRef(0);
  const startPinchDistance = useRef(0);
  const startScale = useRef(1);
  const dragStart = useRef({ x: 0, y: 0 });

  // Boundary limits for clamping
  const getLimits = useCallback((currentScale: number) => {
    if (!containerRef.current || !imageRef.current) return { maxX: 0, maxY: 0 };
    const contRect = containerRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();
    const maxX = Math.max(0, (imgRect.width - contRect.width) / 2);
    const maxY = Math.max(0, (imgRect.height - contRect.height) / 2);
    return { maxX, maxY };
  }, []);

  const applyInertia = useCallback(() => {
    if (isDragging) return;

    setPosition(prev => {
      const { maxX, maxY } = getLimits(scale);
      let nextX = prev.x + velocity.current.x;
      let nextY = prev.y + velocity.current.y;

      // Friction
      velocity.current.x *= 0.95;
      velocity.current.y *= 0.95;

      // Bounce back if out of bounds
      if (nextX > maxX) {
        nextX = maxX + (nextX - maxX) * 0.5;
        velocity.current.x *= 0.5;
        if (Math.abs(nextX - maxX) < 0.5) nextX = maxX;
      } else if (nextX < -maxX) {
        nextX = -maxX + (nextX + maxX) * 0.5;
        velocity.current.x *= 0.5;
        if (Math.abs(nextX + maxX) < 0.5) nextX = -maxX;
      }

      if (nextY > maxY) {
        nextY = maxY + (nextY - maxY) * 0.5;
        velocity.current.y *= 0.5;
        if (Math.abs(nextY - maxY) < 0.5) nextY = maxY;
      } else if (nextY < -maxY) {
        nextY = -maxY + (nextY + maxY) * 0.5;
        velocity.current.y *= 0.5;
        if (Math.abs(nextY + maxY) < 0.5) nextY = -maxY;
      }

      // Stop animation if velocity is low
      if (Math.abs(velocity.current.x) < 0.1 && Math.abs(velocity.current.y) < 0.1) {
        cancelAnimationFrame(animationFrame.current);
        return { x: nextX, y: nextY };
      }

      animationFrame.current = requestAnimationFrame(applyInertia);
      return { x: nextX, y: nextY };
    });
  }, [isDragging, scale, getLimits]);

  const handleTouchStart = (e: React.TouchEvent) => {
    cancelAnimationFrame(animationFrame.current);
    velocity.current = { x: 0, y: 0 };

    if (e.touches.length === 1) {
      dragStart.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastTime.current = Date.now();
      setIsDragging(true);

      const now = Date.now();
      if (now - lastTouchTime.current < 300) {
        handleDoubleTap(e.touches[0].clientX, e.touches[0].clientY);
      }
      lastTouchTime.current = now;
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      startPinchDistance.current = distance;
      startScale.current = scale;
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      const currentTime = Date.now();
      const dt = currentTime - lastTime.current;
      if (dt > 0) {
        velocity.current = {
          x: (e.touches[0].clientX - lastPos.current.x),
          y: (e.touches[0].clientY - lastPos.current.y)
        };
      }
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastTime.current = currentTime;

      const newX = e.touches[0].clientX - dragStart.current.x;
      const newY = e.touches[0].clientY - dragStart.current.y;
      
      // Edge resistance
      const { maxX, maxY } = getLimits(scale);
      let finalX = newX;
      let finalY = newY;

      if (newX > maxX) finalX = maxX + (newX - maxX) * 0.3;
      if (newX < -maxX) finalX = -maxX + (newX + maxX) * 0.3;
      if (newY > maxY) finalY = maxY + (newY - maxY) * 0.3;
      if (newY < -maxY) finalY = -maxY + (newY + maxY) * 0.3;

      setPosition({ x: finalX, y: finalY });
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.min(Math.max((distance / startPinchDistance.current) * startScale.current, 1), 4);
      setScale(newScale);
      if (newScale <= 1.05) setPosition({ x: 0, y: 0 });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (scale <= 1.05) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      animationFrame.current = requestAnimationFrame(applyInertia);
    }
  };

  const handleDoubleTap = (clientX: number, clientY: number) => {
    if (scale > 1.1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
      // Optional: Center zoom on tap point
      setPosition({ x: 0, y: 0 });
    }
  };

  const reset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col touch-none select-none"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 safe-top">
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <X size={24} />
        </button>
        
        <div className="flex items-center gap-3">
          {onShare && (
            <button onClick={onShare} className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
              <Share2 size={20} />
            </button>
          )}
          {onDownload && (
            <button onClick={handleDownloadAction} className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
              <Download size={20} />
            </button>
          )}
          {isOwner && onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Permanently delete this image?')) {
                  onDelete();
                  onClose();
                }
              }}
              className="w-11 h-11 rounded-full bg-red-500/20 backdrop-blur-md flex items-center justify-center text-red-500"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="relative transition-transform duration-300 ease-out will-change-transform"
          style={{ 
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`
          }}
        >
          <img
            ref={imageRef}
            src={url}
            alt={alt || "Image"}
            className="max-w-full max-h-[85vh] object-contain pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 z-10">
        <button onClick={() => setScale(s => Math.max(1, s - 0.5))} className="p-2 text-white/70 hover:text-white"><ZoomOut size={18} /></button>
        <div className="w-[1px] h-4 bg-white/10" />
        <span className="text-[10px] font-bold text-white/50 w-8 text-center">{Math.round(scale * 100)}%</span>
        <div className="w-[1px] h-4 bg-white/10" />
        <button onClick={() => setScale(s => Math.min(4, s + 0.5))} className="p-2 text-white/70 hover:text-white"><ZoomIn size={18} /></button>
        <button onClick={reset} className="p-2 text-white/70 hover:text-white"><RotateCcw size={16} /></button>
      </div>
    </motion.div>
  );

  async function handleDownloadAction() {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const sUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = sUrl;
      link.download = `qpixa-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(sUrl);
    } catch (e) {
      onDownload?.();
    }
  }
}
