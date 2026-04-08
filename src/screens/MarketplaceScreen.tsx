import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase, isPlaceholder } from '@/integrations/supabase/client';
import { X, Clock, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { Search, SlidersHorizontal, ChevronRight, Star, ChevronDown, Coins, Plus, Bell, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/context/AppContext';
import { useCart } from '@/hooks/useCart';
import { LogoLoader } from '@/components/LogoLoader';
import PromptDetailSheet from '@/components/marketplace/PromptDetailSheet';
import SellPromptSheet from '@/components/marketplace/SellPromptSheet';
import MarketplaceFilterPanel, { defaultFilters, type MarketplaceFilters } from '@/components/marketplace/MarketplaceFilterPanel';


export interface MarketplacePrompt {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  prompt_text: string;
  preview_image: string | null;
  preview_images: string[];
  category: string;
  model_type: string;
  price: number;
  rating: number;
  sales_count: number;
  is_featured: boolean;
  is_trending: boolean;
  created_at: string;
  creator_name?: string;
}

const modelBadgeColors: Record<string, string> = {
  'Gemini Image': 'bg-purple-500/80',
  'DALL-E': 'bg-emerald-500/80',
  'Midjourney': 'bg-blue-500/80',
  'Stable Diff.': 'bg-pink-500/80',
  'FLUX': 'bg-orange-500/80',
};



function groupByCategory(prompts: MarketplacePrompt[]): Record<string, MarketplacePrompt[]> {
  const groups: Record<string, MarketplacePrompt[]> = {};
  prompts.forEach(p => {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  });
  return groups;
}

interface MarketplaceScreenProps {
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onUsePrompt?: (prompt: string) => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  onCreatorTap?: (creatorName: string, creatorId?: string) => void;
  navVisible?: boolean;
}

const MOCK_MARKETPLACE_PROMPTS: MarketplacePrompt[] = [
  {
    id: 'mock-prompt-1',
    creator_id: 'system',
    creator_name: 'Qpixa Official',
    title: 'Hyper-Realistic Portrait Master',
    description: 'The ultimate prompt for generating hyper-realistic human portraits with perfect lighting.',
    prompt_text: 'Hyper-realistic portrait of a person, 8k resolution, cinematic lighting, detailed skin texture, professional photography',
    preview_image: 'https://picsum.photos/seed/portrait1/400/400',
    preview_images: [
      'https://picsum.photos/seed/portrait1/400/400',
      'https://picsum.photos/seed/portrait2/400/400',
      'https://picsum.photos/seed/portrait3/400/400'
    ],
    category: 'Portrait',
    model_type: 'Gemini Image',
    price: 150,
    rating: 4.9,
    sales_count: 1240,
    is_featured: true,
    is_trending: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-prompt-2',
    creator_id: 'system',
    creator_name: 'Anime Studio',
    title: 'Ghibli Style Landscape',
    description: 'Generate beautiful landscapes in the iconic Studio Ghibli art style.',
    prompt_text: 'Studio Ghibli style landscape, lush green hills, fluffy white clouds, peaceful atmosphere, vibrant colors',
    preview_image: 'https://picsum.photos/seed/ghibli1/400/400',
    preview_images: [
      'https://picsum.photos/seed/ghibli1/400/400',
      'https://picsum.photos/seed/ghibli2/400/400',
      'https://picsum.photos/seed/ghibli3/400/400'
    ],
    category: 'Anime',
    model_type: 'DALL-E',
    price: 80,
    rating: 4.7,
    sales_count: 850,
    is_featured: false,
    is_trending: true,
    created_at: new Date().toISOString(),
  }
];

export default function MarketplaceScreen({ scrollRef, onUsePrompt, onOpenAuth, onCreatorTap, navVisible = true }: MarketplaceScreenProps) {
  const [topHeaderHeight, setTopHeaderHeight] = useState(52);
  const [stickySectionHeight, setStickySectionHeight] = useState(96);
  const [isMounted, setIsMounted] = useState(false);
  const [showTopHeader, setShowTopHeader] = useState(true);
  const lastScrollY = useRef(0);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const stickySectionRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, credits, refreshProfile } = useAppState();
  const { items: cartItems, addToCart, removeFromCart, isInCart, count: cartCount } = useCart();
  const [search, setSearch] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<MarketplacePrompt | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('popular');
  const [showSort, setShowSort] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MarketplaceFilters>(defaultFilters);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; created_at: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [prompts, setPrompts] = useState<MarketplacePrompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPlaceholder) {
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => { if (data) setNotifications(data); });
    }

    // Fetch marketplace prompts
    const fetchPrompts = async () => {
      if (isPlaceholder) {
        setPrompts(MOCK_MARKETPLACE_PROMPTS);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('marketplace_prompts')
          .select(`
            *,
            profiles:creator_id (
              username,
              display_name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedPrompts: MarketplacePrompt[] = data.map((p: any) => ({
            id: p.id,
            creator_id: p.creator_id,
            creator_name: p.profiles?.display_name || p.profiles?.username || 'Unknown',
            title: p.title,
            description: p.description || '',
            prompt_text: p.prompt_text,
            preview_image: p.preview_image,
            preview_images: p.preview_images || [],
            category: p.category || 'General',
            model_type: p.model_type || 'Unknown',
            price: p.price || 0,
            rating: p.rating || 0,
            sales_count: p.sales_count || 0,
            is_featured: p.is_featured || false,
            is_trending: p.is_trending || false,
            created_at: p.created_at,
          }));
          
          if (formattedPrompts.length === 0) {
            setPrompts(MOCK_MARKETPLACE_PROMPTS);
          } else {
            setPrompts(formattedPrompts);
          }
        }
      } catch (err) {
        console.error('Error fetching prompts:', err);
        setPrompts(MOCK_MARKETPLACE_PROMPTS);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;

    const handleScroll = () => {
      const currentScrollY = el.scrollTop;
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setShowTopHeader(false);
      } else {
        setShowTopHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  useEffect(() => {
    if (!topHeaderRef.current || !stickySectionRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === topHeaderRef.current) {
          setTopHeaderHeight(entry.contentRect.height + (showTopHeader ? 8 : 0));
        } else if (entry.target === stickySectionRef.current) {
          setStickySectionHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(topHeaderRef.current);
    observer.observe(stickySectionRef.current);
    return () => observer.disconnect();
  }, [showTopHeader]);

  // Filter
  const filtered = prompts.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
    }
    if (filters.price === 'free' && p.price > 0) return false;
    if (filters.price === 'paid' && p.price === 0) return false;
    if (filters.model !== 'all' && p.model_type !== filters.model) return false;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'popular') return b.sales_count - a.sales_count;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'price_low') return a.price - b.price;
    return 0;
  });

  const grouped = groupByCategory(sorted);
  const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

  const handleBuy = async (prompt: MarketplacePrompt) => {
    if (!isLoggedIn) {
      onOpenAuth?.('login');
      return;
    }
    if (purchasedIds.has(prompt.id)) return;
    if (prompt.price > 0 && credits < prompt.price) {
      toast.error('Insufficient credits');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('purchase_prompt', { p_prompt_id: prompt.id });
      if (error) {
        console.error('Purchase failed:', error.message);
        toast.error('Purchase failed: ' + error.message);
        return;
      }
      if (data === true) {
        setPurchasedIds(prev => new Set(prev).add(prompt.id));
        toast.success('Purchase successful!');
        await refreshProfile();
      } else {
        toast.error('Purchase failed');
      }
    } catch (err) {
      console.error('Purchase error', err);
      toast.error('An unexpected error occurred during purchase');
    }
  };

  const handleUsePrompt = async (prompt: MarketplacePrompt) => {
    // If it's a mock prompt, just return a mock text
    if (prompt.id.startsWith('mock-') || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder-project.supabase.co' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      onUsePrompt?.(`A detailed prompt for ${prompt.title}, featuring high quality elements and cinematic lighting.`);
      return;
    }

    // Fetch prompt text securely via RPC
    const { data, error } = await supabase.rpc('get_marketplace_prompt_text', { p_prompt_id: prompt.id });
    if (error) {
       console.error('Failed to fetch prompt text:', error);
       toast.error('Failed to fetch prompt text');
       return;
    }
    if (data) {
      onUsePrompt?.(data);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div 
        className="fixed top-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-md border-b border-border transition-all duration-300 ease-in-out" 
      >
        {/* Top row: title + icons */}
        <div 
          ref={topHeaderRef}
          className={`transition-all duration-300 ease-in-out overflow-hidden px-4 ${
            showTopHeader ? 'opacity-100 max-h-[100px]' : 'opacity-0 max-h-0 pointer-events-none'
          }`}
          style={{ 
            paddingTop: showTopHeader ? 'max(env(safe-area-inset-top), 0.5rem)' : '0'
          }}
        >
          <div className="flex items-center justify-between h-[52px] mb-1">
            <h1 className="text-lg font-bold text-foreground">Marketplace</h1>
            <div className="flex items-center gap-2">
              {isLoggedIn && (
                <div className="flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-full">
                  <Coins size={13} className="text-primary" />
                  <span className="text-xs font-semibold text-foreground">{credits}</span>
                </div>
              )}
              <button
                onClick={() => isLoggedIn ? setShowSell(true) : onOpenAuth?.('login')}
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => isLoggedIn ? setShowCart(true) : onOpenAuth?.('login')}
                className="p-1.5 transition-opacity active:opacity-60 relative"
                title="Cart"
              >
                <ShoppingCart size={22} className="text-foreground" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowNotifications(true)}
                className="p-1.5 transition-opacity active:opacity-60 relative"
              >
                <Bell size={22} className="text-foreground" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Section: Always visible */}
        <div ref={stickySectionRef} className="px-4 pb-3">
          {/* Search bar */}
          <div className="relative mb-3 flex items-center bg-secondary search-glow rounded-xl px-3 h-10">
            <Search size={16} className="text-muted-foreground mr-2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search prompts, models, creators..."
              type="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>

          {/* Filters row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground relative"
            >
              <SlidersHorizontal size={13} />
              All Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1 text-xs text-muted-foreground font-medium"
              >
                Sort By
                <ChevronDown size={14} />
              </button>
              {showSort && (
                <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-lg z-30 py-1 min-w-[140px]">
                  {[
                    { id: 'popular', label: 'Most Popular' },
                    { id: 'rating', label: 'Highest Rated' },
                    { id: 'newest', label: 'Newest' },
                    { id: 'price_low', label: 'Price: Low' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                        sortBy === opt.id ? 'text-primary font-semibold' : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categories with horizontal scroll */}
      <div 
        ref={scrollRef} 
        className={cn(
          "flex-1 overflow-y-auto pb-safe-nav",
          isMounted && "transition-all duration-300 ease-in-out"
        )}
        style={{ paddingTop: topHeaderHeight + stickySectionHeight }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LogoLoader size={80} text="Opening Marketplace..." />
          </div>
        ) : selectedCategory ? (
          <div>
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <button onClick={() => setSelectedCategory(null)} className="p-1.5 rounded-full hover:bg-secondary">
                <ChevronRight size={18} className="text-muted-foreground rotate-180" />
              </button>
              <h2 className="text-base font-bold text-foreground">{selectedCategory}</h2>
              <span className="text-xs text-muted-foreground">({sorted.filter(p => p.category === selectedCategory).length})</span>
            </div>
            <div className="flex flex-col gap-4 px-4">
              {sorted.filter(p => p.category === selectedCategory).map(prompt => (
                <div key={prompt.id} onClick={() => setSelectedPrompt(prompt)} className="cursor-pointer">
                  <PromptPackCard
                    prompt={prompt}
                    isPurchased={purchasedIds.has(prompt.id)}
                    onTap={() => setSelectedPrompt(prompt)}
                    onSellerTap={() => onCreatorTap?.(prompt.creator_name || '', prompt.creator_id)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Search size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No prompts found</p>
          </div>
        ) : (
          <>
            {/* Top This Month Section */}
            {sorted.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-1 px-4 pt-4 pb-2">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    Top This Month
                  </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory">
                  {[...sorted].sort((a, b) => b.sales_count - a.sales_count).slice(0, 5).map(prompt => (
                    <div key={`top-${prompt.id}`} className="snap-center shrink-0">
                      <PromptPackCard
                        prompt={prompt}
                        isPurchased={purchasedIds.has(prompt.id)}
                        onTap={() => setSelectedPrompt(prompt)}
                        onSellerTap={() => onCreatorTap?.(prompt.creator_name || '', prompt.creator_id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {Object.entries(grouped).map(([category, prompts]) => (
              <div key={category} className="mb-6">
                {/* Category header */}
                <button onClick={() => setSelectedCategory(category)} className="flex items-center gap-1 px-4 pt-4 pb-2">
                  <h2 className="text-base font-bold text-foreground">{category}</h2>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </button>

                {/* Horizontal scroll */}
                <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory">
                  {prompts.map(prompt => (
                    <div key={prompt.id} className="snap-center shrink-0">
                      <PromptPackCard
                        prompt={prompt}
                        isPurchased={purchasedIds.has(prompt.id)}
                        onTap={() => setSelectedPrompt(prompt)}
                        onSellerTap={() => onCreatorTap?.(prompt.creator_name || '', prompt.creator_id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Click outside sort dropdown */}
      {showSort && <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />}

      {/* Sell FAB removed - moved to header */}

      {/* Filter Panel */}
      <MarketplaceFilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
      />

      {/* Sell Sheet */}
      {showSell && (
        <SellPromptSheet
          onClose={() => setShowSell(false)}
          onSuccess={() => {}}
        />
      )}

      {/* Detail Sheet */}
      {selectedPrompt && (
        <PromptDetailSheet
          prompt={selectedPrompt}
          isPurchased={purchasedIds.has(selectedPrompt.id)}
          onClose={() => setSelectedPrompt(null)}
          onBuy={() => handleBuy(selectedPrompt)}
          onUsePrompt={() => handleUsePrompt(selectedPrompt)}
          onAddToCart={() => addToCart(selectedPrompt.id)}
          isInCart={isInCart(selectedPrompt.id)}
          credits={credits}
          isLoggedIn={isLoggedIn}
          onViewSeller={(name) => { setSelectedPrompt(null); onCreatorTap?.(name, selectedPrompt.creator_id); }}
        />
      )}

      {/* Cart Panel */}
      {showCart && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/50" onClick={() => setShowCart(false)} />
          <div className="fixed top-0 right-0 z-[81] w-80 max-w-[85vw] h-full bg-background border-l border-border">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Cart ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} className="p-1.5 rounded-full hover:bg-secondary">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-120px)] p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <ShoppingCart size={28} className="mb-2 opacity-40" />
                  <p className="text-sm">Your cart is empty</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                    <img
                      src={item.prompt?.preview_image || '/placeholder.svg'}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.prompt?.title || 'Prompt'}</p>
                      <span className="flex items-center gap-0.5 text-xs font-bold text-primary">
                        <Coins size={10} />{item.prompt?.price || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.prompt_id)}
                      className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="flex items-center gap-1 text-sm font-bold text-primary">
                    <Coins size={12} />
                    {cartItems.reduce((s, i) => s + (i.prompt?.price || 0), 0)}
                  </span>
                </div>
                <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-[0.97] transition-transform">
                  Purchase All
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/50" onClick={() => setShowNotifications(false)} />
          <div className="fixed top-0 right-0 z-[81] w-80 max-w-[85vw] h-full bg-background border-l border-border">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Notifications</h2>
              <button onClick={() => setShowNotifications(false)} className="p-1.5 rounded-full hover:bg-secondary">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)] p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Bell size={28} className="mb-2 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-secondary/50 border border-border">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                      <Clock size={10} />
                      {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* PromptBase-style card with multi-image grid preview */
const PromptPackCard: React.FC<{
  prompt: MarketplacePrompt;
  isPurchased: boolean;
  onTap: () => void;
  onSellerTap?: () => void;
}> = ({
  prompt,
  isPurchased,
  onTap,
  onSellerTap,
}) => {
  const baseImg = prompt.preview_image || '/placeholder.svg';
  const imgs = (prompt.preview_images && prompt.preview_images.length >= 3) 
    ? prompt.preview_images.slice(0, 3) 
    : [baseImg, baseImg, baseImg];
  const badgeColor = modelBadgeColors[prompt.model_type] || 'bg-muted';

  return (
    <button
      onClick={onTap}
      className="flex-shrink-0 w-[85vw] max-w-[340px] h-[220px] rounded-[20px] overflow-hidden bg-[#0f0f0f] border border-border text-left transition-transform active:scale-[0.97] flex flex-col"
    >
      {/* Multi-image grid preview */}
      <div className="relative h-[70%] w-full overflow-hidden flex flex-row rounded-t-[20px]" onContextMenu={(e) => e.preventDefault()}>
        {imgs.map((img, i) => (
          <div key={i} className="flex-1 overflow-hidden border-r border-background/20 last:border-r-0">
            <img src={img} alt="" className="w-full h-full object-cover pointer-events-none" loading="lazy" />
          </div>
        ))}

        {/* Model badge */}
        <div className="absolute top-2 left-2">
          <span className={`flex items-center gap-1 ${badgeColor} text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm`}>
            🔥 {prompt.model_type}
          </span>
        </div>

        {/* Rating badge */}
        {prompt.rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
            <span className="text-[11px] font-bold text-white">{prompt.rating}</span>
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
          </div>
        )}

        {/* Purchased badge */}
        {isPurchased && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              OWNED
            </span>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="flex-1 px-4 py-3 flex flex-col justify-center">
        <h3 className="text-sm font-semibold text-white truncate mb-1">{prompt.title}</h3>
        <div className="flex items-center justify-between">
          <span
            onClick={(e) => { e.stopPropagation(); onSellerTap?.(); }}
            className="text-xs text-muted-foreground active:text-primary truncate mr-2"
          >@{prompt.creator_name || 'unknown'} · {prompt.sales_count} sales</span>
          {prompt.price === 0 ? (
            <span className="text-xs font-bold text-green-400">FREE</span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-primary">
              <Coins size={12} />
              {prompt.price}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
