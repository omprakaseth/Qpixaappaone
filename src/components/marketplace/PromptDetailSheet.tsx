"use client";

import { X, Star, Coins, ShoppingCart, Sparkles, Copy, Check, Heart, Shield, Zap, RotateCcw, ChevronDown, Eye, Download, Share2, Bookmark } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import type { MarketplacePrompt } from '@/screens/MarketplaceScreen';
import { useSwipeDismiss } from '@/hooks/useSwipeDismiss';
import { supabase } from '@/integrations/supabase/client';
import { useAppState } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PromptDetailSheetProps {
  prompt: MarketplacePrompt;
  isPurchased: boolean;
  onClose: () => void;
  onBuy: () => void;
  onUsePrompt: () => void;
  onAddToCart?: () => void;
  isInCart?: boolean;
  credits: number;
  isLoggedIn: boolean;
  onViewSeller?: (name: string) => void;
}

const mockReviews = [
  { id: '1', user: 'PixelMaster', rating: 5, text: 'Amazing prompt! The results are incredibly detailed and realistic.', date: '2 days ago' },
  { id: '2', user: 'ArtLover99', rating: 5, text: 'Best prompt pack I\'ve bought. Worth every credit!', date: '1 week ago' },
  { id: '3', user: 'CreativeAI', rating: 4, text: 'Great quality, works perfectly with the recommended model.', date: '2 weeks ago' },
];

export default function PromptDetailSheet({
  prompt, isPurchased, onClose, onBuy, onUsePrompt, onAddToCart, isInCart, credits, isLoggedIn, onViewSeller
}: PromptDetailSheetProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [revealedText, setRevealedText] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { dragHandleProps, style: swipeStyle, opacity: backdropOpacity } = useSwipeDismiss({ onDismiss: onClose });

  const { user } = useAppState();
  const canAfford = credits >= prompt.price;
  const isFree = prompt.price === 0;
  const isOwner = user?.id === prompt.creator_id;
  const owned = isPurchased || isFree || isOwner;
  const imgs = prompt.preview_images?.length > 0 ? prompt.preview_images : [prompt.preview_image || '/placeholder.svg'];

  // Fetch prompt text securely via RPC
  useEffect(() => {
    const fetchText = async () => {
      const { data } = await supabase.rpc('get_marketplace_prompt_text', { p_prompt_id: prompt.id });
      if (data) setRevealedText(data);
    };
    fetchText();
  }, [prompt.id, isPurchased]);

  const displayText = revealedText || 'Loading...';
  const wordCount = displayText.split(/\s+/).length;

  const handleHeroScroll = () => {
    if (!heroRef.current) return;
    const scrollLeft = heroRef.current.scrollLeft;
    const width = heroRef.current.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActiveImg(index);
  };

  const handleCopy = () => {
    if (!owned || !revealedText) return;
    navigator.clipboard.writeText(revealedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuyAndUse = () => {
    onBuy();
    onUsePrompt();
    onClose();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imgs[activeImg];
    a.download = `${prompt.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    a.target = '_blank';
    a.click();
    toast.success('Download started');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: prompt.title, text: prompt.description, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const handleSave = () => {
    setLiked(!liked);
    toast.success(liked ? 'Removed from favorites' : 'Saved to favorites');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" style={{ opacity: backdropOpacity }} onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card rounded-t-3xl border-t border-border max-h-[94vh] flex flex-col animate-in slide-in-from-bottom duration-300" style={swipeStyle}>
        {/* Swipe Handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing" {...dragHandleProps}>
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        <button onClick={onClose} className="absolute right-4 top-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 z-20 transition-colors">
          <X size={18} />
        </button>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Hero Image Carousel */}
          <div className="relative">
            <div
              ref={heroRef}
              onScroll={handleHeroScroll}
              className="flex gap-2 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory"
              onContextMenu={(e) => e.preventDefault()}
            >
              {imgs.map((img, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 snap-center rounded-2xl overflow-hidden relative"
                  style={{ width: '100%', aspectRatio: '4/5' }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover pointer-events-none" />
                </div>
              ))}
            </div>

            {/* Image Overlays */}
            <div className="absolute top-4 right-8 flex flex-col gap-3 z-10">
              <button
                onClick={() => setLiked(!liked)}
                className={cn(
                  "w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-lg",
                  liked ? "bg-red-500 text-white" : "bg-black/30 text-white border border-white/10"
                )}
              >
                <Heart size={20} className={liked ? "fill-current" : ""} />
              </button>
            </div>

            <div className="absolute bottom-6 right-8 flex flex-col gap-3 z-10">
              <button
                onClick={handleDownload}
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all active:scale-90 shadow-lg"
              >
                <Download size={20} />
              </button>
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all active:scale-90 shadow-lg"
              >
                <Share2 size={20} />
              </button>
              <button
                onClick={handleSave}
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all active:scale-90 shadow-lg"
              >
                <Bookmark size={20} />
              </button>
            </div>

            {/* Pagination dots */}
            {imgs.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {imgs.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      activeImg === i ? "w-4 bg-white" : "w-1.5 bg-white/40"
                    )} 
                  />
                ))}
              </div>
            )}
          </div>

          <div className="px-5 pt-5 pb-8">
            {/* Model badge */}
            <div className="flex items-center mb-3">
              <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full border border-primary/20">
                <Sparkles size={10} /> {prompt.model_type}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground leading-tight mb-2 tracking-tight">{prompt.title}</h2>

            {/* Creator info */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => onViewSeller?.(prompt.creator_name || 'unknown')}
                className="flex items-center gap-2.5 active:opacity-70 transition-opacity"
              >
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  <span className="text-[10px] font-bold text-foreground">
                    {(prompt.creator_name || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    @{prompt.creator_name || 'unknown'}
                    {(prompt as any).creator_is_verified && <VerifiedBadge size={12} />}
                  </span>
                </div>
              </button>
              <div className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold text-foreground">{prompt.rating}</span>
                <span className="text-[10px] text-muted-foreground">({prompt.sales_count})</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className={`text-sm text-muted-foreground leading-relaxed ${!showFullDesc && prompt.description.length > 100 ? 'line-clamp-2' : ''}`}>
                {prompt.description}
              </p>
              {prompt.description.length > 100 && (
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-xs text-primary font-bold mt-1.5"
                >
                  {showFullDesc ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            {/* Prompt preview */}
            <div className="mb-6">
              <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50 relative group">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prompt Details</span>
                  {owned && (
                    <button 
                      onClick={handleCopy} 
                      className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'COPIED' : 'COPY'}
                    </button>
                  )}
                </div>
                <p className={cn(
                  "text-sm text-foreground leading-relaxed font-medium",
                  !owned && "blur-md select-none"
                )}>
                  {displayText}
                </p>
                {!owned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/90 text-foreground text-[11px] font-bold px-4 py-2 rounded-full shadow-lg border border-border flex items-center gap-2">
                      <Shield size={14} className="text-primary" />
                      Purchase to reveal prompt
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">{wordCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Words</p>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">{prompt.sales_count}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Sales</p>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">{(prompt.sales_count * 4.2).toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Views</p>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">{prompt.model_type}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Model</p>
              </div>
            </div>

            {/* Reviews section */}
            <div className="mb-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Customer Reviews</h3>
                <span className="text-xs text-primary font-bold">See all</span>
              </div>
              <div className="space-y-3">
                {mockReviews.slice(0, 2).map(review => (
                  <div key={review.id} className="bg-secondary/20 rounded-2xl p-4 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-primary">{review.user[0]}</span>
                        </div>
                        <span className="text-[11px] font-bold text-foreground">{review.user}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            size={8}
                            className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/20'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-card via-card to-transparent pt-10">
          {owned ? (
            <Button 
              onClick={() => { onUsePrompt(); onClose(); }} 
              className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Sparkles size={20} />
              Use in Studio
            </Button>
          ) : (
            <Button
              onClick={handleBuyAndUse}
              disabled={!isLoggedIn || (!isFree && !canAfford)}
              className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              {!isLoggedIn ? (
                'Login to Purchase'
              ) : !canAfford ? (
                <>Not enough credits ({credits}/{prompt.price})</>
              ) : (
                <>
                  <Coins size={20} />
                  Buy Now — {prompt.price} Credits
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
