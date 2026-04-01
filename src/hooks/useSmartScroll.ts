import { useState, useEffect, useRef, useCallback } from 'react';

export function useSmartScroll(enabled = true) {
  const [visible, setVisibleState] = useState(true);
  const visibleRef = useRef(true);

  const setVisible = useCallback((v: boolean) => {
    visibleRef.current = v;
    setVisibleState(v);
  }, []);

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
    
    // Ignore micro-scrolls
    if (Math.abs(delta) < 5) return;
    
    // Reset at top of page
    if (current <= 0) {
      setVisible(true);
      accumulatedDelta.current = 0;
      lastScrollY.current = 0;
      return;
    }

    // Threshold for meaningful scroll
    if (current < 20) {
      setVisible(true);
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

    // Small debounce for smoothness
    if (timeSinceLastToggle > 100) {
      const showThreshold = 15; // More sensitive for showing
      const hideThreshold = 30; // Less sensitive for hiding
      
      if (accumulatedDelta.current < -showThreshold && !visibleRef.current) {
        setVisible(true);
        lastToggleTime.current = now;
        accumulatedDelta.current = 0;
      } else if (accumulatedDelta.current > hideThreshold && visibleRef.current) {
        setVisible(false);
        lastToggleTime.current = now;
        accumulatedDelta.current = 0;
      }
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
