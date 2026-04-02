import { useState, useEffect, useRef, useCallback } from 'react';

export function useSmartScroll(enabled = true) {
  const [visible, setVisibleState] = useState(true);
  const visibleRef = useRef(true);

  const setVisible = useCallback((v: boolean) => {
    if (visibleRef.current !== v) {
      visibleRef.current = v;
      setVisibleState(v);
    }
  }, []);

  const lastScrollY = useRef(0);
  const [node, setNode] = useState<HTMLElement | null>(null);
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
    
    if (current <= 0) {
      setVisible(true);
      lastScrollY.current = current;
      return;
    }

    const delta = current - lastScrollY.current;
    
    // Scroll down -> hide
    if (delta > 10 && current > 150) {
      setVisible(false);
    } 
    // Scroll up -> show
    else if (delta < -10 || current < 10) {
      setVisible(true);
    }

    lastScrollY.current = current;
  }, [enabled, node, setVisible]);

  useEffect(() => {
    if (!node || !enabled) return;
    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => node.removeEventListener('scroll', handleScroll);
  }, [node, enabled, handleScroll]);

  // Reset visibility when tab changes (enabled toggles)
  useEffect(() => {
    if (enabled) {
      setVisible(true);
      lastScrollY.current = 0;
    }
  }, [enabled, node, setVisible]);

  return { visible: enabled ? visible : true, scrollRef };
}
