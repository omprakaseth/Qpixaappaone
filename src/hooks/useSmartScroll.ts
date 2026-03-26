import { useState, useEffect, useRef, useCallback } from 'react';

export function useSmartScroll(enabled = true) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastToggleTime = useRef(0);
  const accumulatedDelta = useRef(0);

  const handleScroll = useCallback(() => {
    if (!enabled) return;
    
    // Try scrollRef first, then find any active scrollable container
    const el = scrollRef.current;
    if (!el) return;
    
    const current = el.scrollTop;
    const delta = current - lastScrollY.current;
    
    if (Math.abs(delta) < 3) return;
    
    if (current < 20) {
      setVisible(true);
      accumulatedDelta.current = 0;
      lastScrollY.current = current;
      return;
    }

    if ((delta > 0 && accumulatedDelta.current > 0) || (delta < 0 && accumulatedDelta.current < 0)) {
      accumulatedDelta.current += delta;
    } else {
      accumulatedDelta.current = delta;
    }

    const now = Date.now();
    const timeSinceLastToggle = now - lastToggleTime.current;

    if (timeSinceLastToggle > 300 && Math.abs(accumulatedDelta.current) > 30) {
      const shouldShow = accumulatedDelta.current < 0;
      setVisible(shouldShow);
      lastToggleTime.current = now;
      accumulatedDelta.current = 0;
    }

    lastScrollY.current = current;
  }, [enabled]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !enabled) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [enabled, handleScroll]);

  // Reset visibility when tab changes (enabled toggles)
  useEffect(() => {
    if (enabled) {
      setVisible(true);
      accumulatedDelta.current = 0;
      lastScrollY.current = 0;
    }
  }, [enabled]);

  return { visible: enabled ? visible : true, scrollRef };
}
