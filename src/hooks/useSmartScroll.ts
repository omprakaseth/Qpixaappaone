import { useState, useEffect, useRef, useCallback } from 'react';

export function useSmartScroll(enabled = true) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [node, setNode] = useState<HTMLElement | null>(null);
  const lastToggleTime = useRef(0);
  const accumulatedDelta = useRef(0);
  const refObject = useRef<HTMLElement | null>(null);

  const scrollRef = useCallback((element: HTMLElement | null) => {
    refObject.current = element;
    setNode(element);
  }, []);

  // Attach .current to the callback ref so it can be used as a RefObject
  if (!Object.prototype.hasOwnProperty.call(scrollRef, 'current')) {
    Object.defineProperty(scrollRef, 'current', {
      get: () => refObject.current,
    });
  }

  const handleScroll = useCallback((e: Event) => {
    if (!enabled || !node) return;
    
    const target = e.target as HTMLElement;
    const current = target.scrollTop;
    
    // Initialize lastScrollY if it's 0 and we're already scrolled (e.g., restored scroll position)
    if (lastScrollY.current === 0 && current > 50) {
      lastScrollY.current = current;
      return;
    }

    const delta = current - lastScrollY.current;
    
    if (Math.abs(delta) < 3) return;
    
    if (current < 20) {
      setVisible(true);
      accumulatedDelta.current = 0;
      lastScrollY.current = current;
      return;
    }

    // Prevent flickering at the bottom (iOS rubber banding)
    const maxScroll = node.scrollHeight - node.clientHeight;
    if (current >= maxScroll - 10) {
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
  }, [enabled, node]);

  useEffect(() => {
    if (!node || !enabled) return;
    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => node.removeEventListener('scroll', handleScroll);
  }, [node, enabled, handleScroll]);

  // Reset visibility when tab changes (enabled toggles)
  useEffect(() => {
    if (enabled) {
      setVisible(true);
      accumulatedDelta.current = 0;
      lastScrollY.current = 0;
    }
  }, [enabled, node]);

  return { visible: enabled ? visible : true, scrollRef };
}
