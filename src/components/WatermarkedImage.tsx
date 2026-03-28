import { useEffect, useRef, useState } from 'react';
import { useWatermarkSettings } from '@/hooks/useWatermarkSettings';

interface WatermarkedImageProps {
  src: string;
  alt?: string;
  className?: string;
  isPro?: boolean;
}

export default function WatermarkedImage({ src, alt, className, isPro = false }: WatermarkedImageProps) {
  const watermark = useWatermarkSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [watermarkedSrc, setWatermarkedSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!watermark.enabled || isPro) {
      setWatermarkedSrc(null);
      setLoading(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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
      setWatermarkedSrc(null);
      setLoading(false);
    };
    img.src = src;
  }, [src, watermark.enabled, watermark.text, isPro]);

  if (!watermark.enabled || isPro) {
    return <img src={src} alt={alt} className={className} draggable={false} onContextMenu={(e) => e.preventDefault()} />;
  }

  return (
    <div className="relative select-none">
      <canvas ref={canvasRef} className="hidden" />
      {loading ? (
        <div className={`${className} skeleton-shimmer`} />
      ) : (
        <img
          src={watermarkedSrc || src}
          alt={alt}
          className={className}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
}
