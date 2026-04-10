import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useState } from 'react';

interface BannerAdProps {
  publisherId: string;
  slotId: string;
}

export default function BannerAd({ publisherId, slotId }: BannerAdProps) {
  const [dismissed, setDismissed] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (!publisherId || !slotId || loaded.current || dismissed) return;
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
    } catch (e) {}
  }, [publisherId, slotId, dismissed]);

  if (dismissed) return null;

  // Placeholder if no AdSense
  if (!publisherId || !slotId) {
    return (
      <div className="fixed bottom-[60px] left-0 right-0 z-40 px-3 pb-1">
        <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">AD</span>
            <p className="text-xs text-foreground">✨ Upgrade to Pro — No ads, unlimited generations!</p>
          </div>
          <button onClick={() => setDismissed(true)} className="p-1">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-40 px-2 pb-1">
      <div className="relative bg-card rounded-lg overflow-hidden">
        <button onClick={() => setDismissed(true)} className="absolute top-0.5 right-0.5 z-10 p-1 bg-background/80 rounded-full">
          <X size={12} className="text-muted-foreground" />
        </button>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={publisherId}
          data-ad-slot={slotId}
          data-ad-format="rspv"
          data-full-width=""
        />
      </div>
    </div>
  );
}
