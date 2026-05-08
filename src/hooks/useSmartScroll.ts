import { useState, useEffect, useRef, useCallback } from 'react';

export function useSmartScroll(enabled = true, activeTab?: string) {
  const [visible, setVisibleState] = useState(true);
  const visibleRef = useRef(true);

  const setVisible = useCallback((v: boolean) => {
    if (visibleRef.current !== v) {
      visibleRef.current = v;
      setVisibleState(v);
    }
  }, []);

  const lastScrollY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback((e: Event | { target: { scrollTop: number } }) => {
    if (!enabled) return;
    
    // Support both native events and manual calls
    const scrollTop = 'target' in e ? (e.target as HTMLElement).scrollTop : (e as any).scrollTop;
    const current = scrollTop;
    
    if (current <= 0) {
      setVisible(true);
      lastScrollY.current = current;
      return;
    }

    const delta = current - lastScrollY.current;
    
    // Scroll down -> hide (threshold 5px)
    if (delta > 5 && current > 60) {
      setVisible(false);
    } 
    // Scroll up -> show (threshold -5px)
    else if (delta < -5 || current < 5) {
      setVisible(true);
    }

    lastScrollY.current = current;
  }, [enabled, setVisible]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const node = scrollRef.current;
      if (!node || !enabled) return;
      node.addEventListener('scroll', handleScroll, { passive: true });
    }, 100);

    return () => {
      const node = scrollRef.current;
      if (node) node.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, handleScroll, activeTab]);

  useEffect(() => {
    if (enabled) {
      setVisible(true);
      lastScrollY.current = 0;
    }
  }, [enabled, setVisible, activeTab]);

  return { visible: enabled ? visible : true, setVisible, scrollRef, handleScroll };
}
