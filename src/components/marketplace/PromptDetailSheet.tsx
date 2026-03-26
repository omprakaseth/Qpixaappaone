import { X, Star, Coins, ShoppingCart, Sparkles, Copy, Check, Heart, Shield, Zap, RotateCcw, ChevronDown, Eye } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import type { MarketplacePrompt } from '@/screens/MarketplaceScreen';
import { useSwipeDismiss } from '@/hooks/useSwipeDismiss';
import { supabase } from '@/integrations/supabase/client';

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

  const canAfford = credits >= prompt.price;
  const isFree = prompt.price === 0;
  const owned = isPurchased || isFree;
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

  const scrollToImage = (index: number) => {
    setActiveImg(index);
    if (heroRef.current) {
      const child = heroRef.current.children[index] as HTMLElement;
      child?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleHeroScroll = () => {
    if (!heroRef.current) return;
    const scrollLeft = heroRef.current.scrollLeft;
    const width = heroRef.current.clientWidth;
    const idx = Math.round(scrollLeft / (width * 0.85));
    setActiveImg(Math.min(idx, imgs.length - 1));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" style={{ opacity: backdropOpacity }} onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card rounded-t-2xl border-t border-border max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300" style={swipeStyle}>
        {/* Swipe Handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing" {...dragHandleProps}>
          <div className="w-10 h-1 rounded-full bg-muted-foreground/40" />
        </div>

        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
          <X size={20} />
        </button>

        <div className="flex-1 overflow-y-auto">
          {/* Hero Image Carousel */}
          <div
            ref={heroRef}
            onScroll={handleHeroScroll}
            className="flex gap-2 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory"
          >
            {imgs.map((img, i) => (
              <div
                key={i}
                className="flex-shrink-0 snap-center rounded-xl overflow-hidden"
                style={{ width: '85%', aspectRatio: '3/4' }}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Thumbnail strip */}
          {imgs.length > 1 && (
            <div className="flex gap-2 px-4 mt-3 overflow-x-auto scrollbar-hide">
              {imgs.map((img, i) => (
                <button
                  key={i}
                  onClick={() => scrollToImage(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImg === i ? 'border-primary' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="px-4 pt-4 pb-4">
            {/* Model badge + favorite */}
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                🔥 {prompt.model_type}
              </span>
              <button
                onClick={() => setLiked(!liked)}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <Heart
                  size={20}
                  className={liked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}
                />
              </button>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground leading-tight mb-3">{prompt.title}</h2>

            {/* Creator info */}
            <button
              onClick={() => onViewSeller?.(prompt.creator_name || 'unknown')}
              className="flex items-center gap-3 mb-4 active:opacity-70 transition-opacity w-full text-left"
            >
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">
                  {(prompt.creator_name || 'U')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-primary flex items-center gap-1">
                  @{prompt.creator_name || 'unknown'}
                  {(prompt as any).creator_is_verified && <VerifiedBadge size={13} />}
                </span>
                {prompt.sales_count > 100 && (
                  <span className="text-[10px] bg-primary/15 text-primary font-semibold px-2 py-0.5 rounded-full">
                    Top Seller
                  </span>
                )}
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Star size={13} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold text-foreground">{prompt.rating}</span>
                <span className="text-xs text-muted-foreground">({prompt.sales_count})</span>
              </div>
            </button>

            {/* Price */}
            <div className="flex items-center gap-2 mb-1">
              {isFree ? (
                <span className="text-2xl font-bold text-green-400">FREE</span>
              ) : (
                <span className="flex items-center gap-1.5 text-2xl font-bold text-primary">
                  <Coins size={20} />
                  {prompt.price} credits
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              ℹ️ You'll get instant access to the full prompt text
            </p>

            {/* CTA Button */}
            {owned ? (
              <div className="flex gap-3 mb-4">
                <Button onClick={handleCopy} variant="secondary" className="flex-1 h-12 rounded-xl font-semibold">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Prompt'}
                </Button>
                <Button onClick={() => { onUsePrompt(); onClose(); }} className="flex-1 h-12 rounded-xl font-semibold">
                  <Sparkles size={16} />
                  Use in Studio
                </Button>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                <Button
                  onClick={handleBuyAndUse}
                  disabled={!isLoggedIn || (!isFree && !canAfford)}
                  className="w-full h-12 rounded-xl font-bold text-base"
                >
                  {!isLoggedIn ? (
                    'Login to Purchase'
                  ) : !canAfford ? (
                    <>Not enough credits ({credits}/{prompt.price})</>
                  ) : (
                    <>
                      <Coins size={18} />
                      Buy Now — {prompt.price} credits
                    </>
                  )}
                </Button>
                {!owned && onAddToCart && (
                  <Button
                    onClick={onAddToCart}
                    variant="secondary"
                    disabled={isInCart}
                    className="w-full h-10 rounded-xl font-semibold"
                  >
                    <ShoppingCart size={16} />
                    {isInCart ? 'In Cart' : 'Add to Cart'}
                  </Button>
                )}
              </div>
            )}

            {/* Feature badges */}
            <div className="flex gap-2 mb-5 flex-wrap">
              <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full">
                <Zap size={12} className="text-primary" />
                <span className="text-[11px] font-medium text-foreground">Instant access</span>
              </div>
              <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full">
                <Shield size={12} className="text-primary" />
                <span className="text-[11px] font-medium text-foreground">Commercial use</span>
              </div>
              <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full">
                <RotateCcw size={12} className="text-primary" />
                <span className="text-[11px] font-medium text-foreground">Money-back</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={14}
                    className={s <= Math.round(prompt.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}
                  />
                ))}
                <span className="text-xs font-semibold text-foreground ml-1">{prompt.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart size={12} />
                <span className="text-xs">{prompt.sales_count}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye size={12} />
                <span className="text-xs">{(prompt.sales_count * 4.2).toFixed(0)}</span>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">{wordCount} words</span>
            </div>

            {/* Description */}
            <div className="mb-4">
              <p className={`text-sm text-muted-foreground leading-relaxed ${!showFullDesc && prompt.description.length > 120 ? 'line-clamp-3' : ''}`}>
                {prompt.description}
              </p>
              {prompt.description.length > 120 && (
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-xs text-primary font-medium mt-1 flex items-center gap-0.5"
                >
                  {showFullDesc ? 'Show less' : '...more'}
                  <ChevronDown size={12} className={showFullDesc ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
              )}
            </div>

            {/* Prompt preview */}
            <div className="relative mb-5">
              <div className="bg-secondary rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Prompt</span>
                  {owned && (
                    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
                <p className={`text-sm text-foreground leading-relaxed ${!owned ? 'blur-md select-none' : ''}`}>
                  {displayText}
                </p>
                {!owned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-background/80 text-foreground text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-sm border border-border">
                      🔒 Purchase to reveal
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews section */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Reviews</h3>
              <div className="space-y-3">
                {mockReviews.map(review => (
                  <div key={review.id} className="bg-secondary rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-[10px] font-bold text-foreground">{review.user[0]}</span>
                        </div>
                        <span className="text-xs font-medium text-foreground">{review.user}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{review.date}</span>
                    </div>
                    <div className="flex gap-0.5 mb-1.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={10}
                          className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
