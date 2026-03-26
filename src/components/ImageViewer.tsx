import { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import WatermarkedImage from '@/components/WatermarkedImage';
import { useAppState } from '@/context/AppContext';

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const { isPro } = useAppState();
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
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
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
      >
        <X size={22} className="text-white" />
      </button>

      <div
        ref={imgRef}
        className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
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
        >
          <WatermarkedImage
            src={src}
            alt={alt || ''}
            className="max-w-full max-h-[100vh] object-contain select-none"
            isPro={isPro}
          />
        </div>
      </div>
    </div>
  );
}