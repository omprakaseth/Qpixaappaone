import { useEffect, useRef, useState } from 'react';
import { Megaphone, Sparkles, ExternalLink } from 'lucide-react';

interface FeedAdCardProps {
  publisherId: string;
  slotId: string;
}

export default function FeedAdCard({ publisherId, slotId }: FeedAdCardProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in on mount
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!publisherId || !slotId || loaded.current) return;

    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      loaded.current = true;
    } catch (e) {
      console.log('AdSense not available');
    }
  }, [publisherId, slotId]);

  // Placeholder when no AdSense configured
  if (!publisherId || !slotId) {
    return (
      <div className={`col-span-2 my-2 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-primary via-accent to-primary overflow-hidden">
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2.5s_infinite] bg-[length:200%_100%]" />
          <div className="relative bg-card rounded-[11px] p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Sponsored</p>
                <Megaphone size={10} className="text-primary/60" />
              </div>
              <p className="text-sm text-foreground font-semibold mt-0.5 truncate">Ad space available</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Upgrade to Pro for ad-free experience</p>
            </div>
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ExternalLink size={14} className="text-primary/70" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`col-span-2 my-2 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} ref={adRef}>
      <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-primary via-accent to-primary overflow-hidden">
        <div className="relative bg-card rounded-[11px]">
          <span className="absolute top-1.5 left-2.5 text-[9px] text-primary/70 font-bold uppercase tracking-wider z-10">Sponsored</span>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={publisherId}
            data-ad-slot={slotId}
            data-ad-format="fluid"
            data-ad-layout-key="-7s+eo+1+2-5"
          />
        </div>
      </div>
    </div>
  );
}