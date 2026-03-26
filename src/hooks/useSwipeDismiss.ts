import { useRef, useCallback, useState } from 'react';

interface UseSwipeDismissOptions {
  threshold?: number;
  onDismiss: () => void;
}

export function useSwipeDismiss({ threshold = 120, onDismiss }: UseSwipeDismissOptions) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = 0;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startY.current;
    const clamped = Math.max(0, delta);
    currentY.current = clamped;
    setDragY(clamped);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (currentY.current > threshold) {
      onDismiss();
    }
    setDragY(0);
    setIsDragging(false);
  }, [threshold, onDismiss]);

  const style: React.CSSProperties = {
    transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
    transition: isDragging ? 'none' : 'transform 0.3s ease',
  };

  return {
    dragHandleProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    style,
    dragY,
    opacity: dragY > 0 ? Math.max(0.3, 1 - dragY / 300) : 1,
  };
}
