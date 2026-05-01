"use client";
import { ArrowUp } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

interface ScrollToTopProps {
  scrollRef: React.RefObject<HTMLDivElement>;
}

export default function ScrollToTop({ scrollRef }: ScrollToTopProps) {
  const [show, setShow] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const resetHideTimer = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShow(false), 3000);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (!el) return;
      const shouldShow = el.scrollTop > 400;
      if (shouldShow) {
        setShow(true);
        resetHideTimer();
      } else {
        setShow(false);
        if (hideTimer.current) clearTimeout(hideTimer.current);
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [scrollRef]);

  if (!show) return null;

  return (
    <button
      onClick={() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setShow(false);
      }}
      className="fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all animate-in fade-in slide-in-from-bottom-4"
      aria-label="Scroll to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}
