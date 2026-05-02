"use client";
import { useEffect, useRef, useState } from 'react';
import { useWatermarkSettings } from '@/hooks/useWatermarkSettings';
import { cn } from '@/lib/utils';

import { motion } from 'framer-motion';

interface WatermarkedImageProps {
  src: string;
  alt?: string;
  className?: string;
  isPro?: boolean;
  layoutId?: string;
}

export default function WatermarkedImage({ src, alt, className, isPro = false, layoutId }: WatermarkedImageProps) {
  const watermark = useWatermarkSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [watermarkedSrc, setWatermarkedSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!watermark.enabled || isPro) {
      // For non-watermarked images, we still want to track loading state
      const img = new Image();
      img.onload = () => {
        setWatermarkedSrc(null);
        setLoading(false);
      };
      img.onerror = () => {
        setError(true);
        setLoading(false);
      };
      img.src = src;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setLoading(false);
        return;
      }
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setLoading(false);
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Burn watermark into canvas
      const text = watermark.text || 'Qpixa';
      const fontSize = Math.max(14, Math.floor(canvas.width * 0.04));
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, canvas.width - fontSize * 0.6, canvas.height - fontSize * 0.5);

      setWatermarkedSrc(canvas.toDataURL('image/webp', 0.9));
      setLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setWatermarkedSrc(null);
      setLoading(false);
    };
    img.src = src;
  }, [src, watermark.enabled, watermark.text, isPro]);

  return (
    <div className={cn("relative select-none overflow-hidden", className)}>
      <canvas ref={canvasRef} className="hidden" />
      
      {loading && (
        <div className="absolute inset-0 bg-secondary/50 animate-pulse flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {error ? (
        <div className="aspect-square bg-secondary/20 flex flex-col items-center justify-center p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mb-2 opacity-20"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Failed to load image</p>
        </div>
      ) : (
        <motion.div layoutId={layoutId} className="w-full h-full relative">
          <img
            src={watermarkedSrc || src}
            alt={alt}
            className={cn(
              className,
              "transition-opacity duration-500",
              loading ? 'opacity-0' : 'opacity-100'
            )}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </motion.div>
      )}
    </div>
  );
}
