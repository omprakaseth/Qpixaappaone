"use client";
import { useRef, useCallback } from 'react';

export function useDoubleTap(onSingleTap: () => void, onDoubleTap: () => void, delay = 300) {
  const lastTap = useRef(0);
  const singleTapTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < delay) {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      onDoubleTap();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      singleTapTimer.current = setTimeout(() => {
        onSingleTap();
      }, delay);
    }
  }, [onSingleTap, onDoubleTap, delay]);

  return handleTap;
}
