"use client";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: Event) => {
    if (!enabled) return;
    
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
  }, [enabled, setVisible]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !enabled) return;
    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => node.removeEventListener('scroll', handleScroll);
  }, [enabled, handleScroll]);

  // Reset visibility when tab changes (enabled toggles)
  useEffect(() => {
    if (enabled) {
      setVisible(true);
      lastScrollY.current = 0;
    }
  }, [enabled, setVisible]);

  return { visible: enabled ? visible : true, scrollRef };
}
