import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Clock, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { Search, SlidersHorizontal, ChevronRight, Star, ChevronDown, Coins, Plus, Bell, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/context/AppContext';
import { useCart } from '@/hooks/useCart';
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

const mockPrompts: MarketplacePrompt[] = [
  {
    id: 'mp-1', creator_id: '', title: 'Monochromatic Studio Portrait Pack',
    description: 'Create stunning studio portraits with monochromatic lighting setups. Perfect for fashion and editorial photography prompts. Ideal for creating high-end portfolio shots with dramatic contrast and professional-quality results.',
    prompt_text: 'A professional studio portrait with monochromatic lighting, soft shadows, high-end fashion photography, 8k resolution, shot on Phase One IQ4...',
    preview_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop',
    preview_images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
    ],
    category: 'Photo Prompts', model_type: 'Gemini Image', price: 5, rating: 5.0, sales_count: 234, is_featured: true, is_trending: true, created_at: new Date().toISOString(), creator_name: 'StudioPro'
  },
  {
    id: 'mp-2', creator_id: '', title: 'Cinematic Lifestyle Portrait Collection',
    description: 'Beautiful cinematic lifestyle portraits with golden hour lighting and natural bokeh.',
    prompt_text: 'Cinematic lifestyle portrait, golden hour, natural light, shallow depth of field, warm tones, editorial quality...',
    preview_image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop',
    preview_images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop',
    ],
    category: 'Photo Prompts', model_type: 'Gemini Image', price: 0, rating: 4.7, sales_count: 189, is_featured: false, is_trending: true, created_at: new Date().toISOString(), creator_name: 'CineLens'
  },
  {
    id: 'mp-3', creator_id: '', title: 'Watercolor Islamic Art Collection',
    description: 'Beautiful watercolor-style Islamic art with intricate patterns, lanterns, and spiritual themes.',
    prompt_text: 'Watercolor illustration of Islamic art, ornate lanterns, crescent moon, intricate arabesque patterns, soft warm tones...',
    preview_image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=300&h=400&fit=crop',
    preview_images: [
      'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1542816417-0983c9c7ad02?w=400&h=500&fit=crop',
    ],
    category: 'Art Prompts', model_type: 'Gemini Image', price: 3, rating: 4.8, sales_count: 312, is_featured: true, is_trending: false, created_at: new Date().toISOString(), creator_name: 'ArtisanAI'
  },
  {
    id: 'mp-4', creator_id: '', title: 'Family Lifestyle Illustrations',
    description: 'Warm, inviting family lifestyle illustrations perfect for social media and marketing.',
    prompt_text: 'Warm family lifestyle illustration, soft pastel colors, happy family moments, cozy interior setting...',
    preview_image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=300&h=400&fit=crop',
    preview_images: [
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1559734840-f9509ee5677f?w=400&h=500&fit=crop',
    ],
    category: 'Art Prompts', model_type: 'Gemini Image', price: 3, rating: 4.5, sales_count: 145, is_featured: false, is_trending: false, created_at: new Date().toISOString(), creator_name: 'FamilyArt'
  },
  {
    id: 'mp-5', creator_id: '', title: 'Cyberpunk City Neon Pack',
    description: 'Epic cyberpunk cityscapes with neon lights, rain-soaked streets, and futuristic architecture.',
    prompt_text: 'A sprawling cyberpunk metropolis at night, neon signs in Japanese, rain-soaked streets reflecting colorful lights...',
    preview_image: 'https://images.unsplash.com/photo-1555448248-2571daf6344b?w=300&h=400&fit=crop',
    preview_images: [
      'https://images.unsplash.com/photo-1555448248-2571daf6344b?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=500&fit=crop',
    ],
    category: 'Sci-Fi Prompts', model_type: 'Midjourney', price: 8, rating: 4.9, sales_count: 567, is_featured: true, is_trending: true, created_at: new Date().toISOString(), creator_name: 'NeonArtist'
  },
  {
    id: 'mp-6', creator_id: '', title: 'Fantasy Dragon Realm Collection',
    description: 'Majestic dragons in fantasy landscapes with volumetric lighting and detailed scales.',
    prompt_text: 'Majestic dragon perched on a mountain peak, aurora borealis in sky, fantasy art, volumetric lighting...',
    preview_image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=300&h=400&fit=crop',
    preview_images: [
      'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=500&fit=crop',
    ],
    category: 'Sci-Fi Prompts', model_type: 'Midjourney', price: 6, rating: 4.6, sales_count: 289, is_featured: false, is_trending: true, created_at: new Date().toISOString(), creator_name: 'DragonLore'
  },
  {
    id: 'mp-7', creator_id: '', title: 'Luxury Car Studio Shots',
    description: 'Photorealistic luxury car renders with dramatic studio lighting and reflections.',
    prompt_text: 'Ultra realistic luxury sports car in professional photo studio, dramatic rim lighting, reflective floor...',
    preview_image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&h=400&fit=crop',
    preview_images: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&h=500&fit=crop',
    ],
    category: 'Car Prompts', model_type: 'DALL-E', price: 4, rating: 4.8, sales_count: 421, is_featured: true, is_trending: false, created_at: new Date().toISOString(), creator_name: 'SpeedDemon'
  },
  {
    id: 'mp-8', creator_id: '', title: 'JDM Night Street Racing',
    description: 'Japanese street racing scenes with neon-lit streets and modified JDM cars.',
    prompt_text: 'Modified JDM car drifting through neon-lit Tokyo streets at night, smoke from tires, rain reflections...',
    preview_image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=400&fit=crop',
    preview_images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=400&h=500&fit=crop',
    ],
    category: 'Car Prompts', model_type: 'Stable Diff.', price: 0, rating: 4.3, sales_count: 198, is_featured: false, is_trending: true, created_at: new Date().toISOString(), creator_name: 'DriftKing'
  },
  {
    id: 'mp-9', creator_id: '', title: 'Nature Landscape 4K Pack',
    description: 'Breathtaking nature landscapes — mountains, forests, oceans — in ultra-high detail.',
    prompt_text: 'Stunning 4K nature landscape, dramatic mountain range at sunrise, mist in valleys, golden light...',
    preview_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=400&fit=crop',
    preview_images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=500&fit=crop',
    ],
    category: 'Nature Prompts', model_type: 'DALL-E', price: 2, rating: 4.6, sales_count: 534, is_featured: false, is_trending: false, created_at: new Date().toISOString(), creator_name: 'NatureLens'
  },
  {
    id: 'mp-10', creator_id: '', title: 'Cosmic Space Nebula Art',
    description: 'Deep space nebulas, galaxies, and cosmic scenes with vivid colors.',
    prompt_text: 'Deep space nebula, swirling cosmic gas clouds in vivid purple and blue, distant stars...',
    preview_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=400&fit=crop',
    preview_images: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&h=500&fit=crop',
    ],
    category: 'Nature Prompts', model_type: 'Stable Diff.', price: 0, rating: 4.4, sales_count: 445, is_featured: true, is_trending: true, created_at: new Date().toISOString(), creator_name: 'CosmicArt'
  },
];

function groupByCategory(prompts: MarketplacePrompt[]): Record<string, MarketplacePrompt[]> {
  const groups: Record<string, MarketplacePrompt[]> = {};
  prompts.forEach(p => {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  });
  return groups;
}

interface MarketplaceScreenProps {
  onUsePrompt?: (prompt: string) => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  onCreatorTap?: (creatorName: string) => void;
}

export default function MarketplaceScreen({ onUsePrompt, onOpenAuth, onCreatorTap }: MarketplaceScreenProps) {
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

  useEffect(() => {
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setNotifications(data); });
  }, []);


  // Filter
  const filtered = mockPrompts.filter(p => {
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
    if (prompt.price > 0 && credits < prompt.price) return;

    try {
      const { data, error } = await supabase.rpc('purchase_prompt', { p_prompt_id: prompt.id });
      if (error) {
        console.error('Purchase failed:', error.message);
        return;
      }
      if (data === true) {
        setPurchasedIds(prev => new Set(prev).add(prompt.id));
        await refreshProfile();
      }
    } catch (err) {
      console.error('Purchase error');
    }
  };

  const handleUsePrompt = async (prompt: MarketplacePrompt) => {
    // Fetch prompt text securely via RPC
    const { data } = await supabase.rpc('get_marketplace_prompt_text', { p_prompt_id: prompt.id });
    if (data) {
      onUsePrompt?.(data);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 pt-3 pb-3 safe-top">
        {/* Top row: title + icons */}
        <div className="flex items-center justify-between mb-3">
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
              className="p-2 rounded-full hover:bg-secondary relative"
              title="Cart"
            >
              <ShoppingCart size={18} className="text-muted-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowNotifications(true)}
              className="p-2 rounded-full hover:bg-secondary relative"
            >
              <Bell size={18} className="text-muted-foreground" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          </div>
        </div>

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

      {/* Categories with horizontal scroll */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Selected category view */}
        {selectedCategory ? (
          <div>
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <button onClick={() => setSelectedCategory(null)} className="p-1.5 rounded-full hover:bg-secondary">
                <ChevronRight size={18} className="text-muted-foreground rotate-180" />
              </button>
              <h2 className="text-base font-bold text-foreground">{selectedCategory}</h2>
              <span className="text-xs text-muted-foreground">({sorted.filter(p => p.category === selectedCategory).length})</span>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4">
              {sorted.filter(p => p.category === selectedCategory).map(prompt => (
                <div key={prompt.id} onClick={() => setSelectedPrompt(prompt)} className="cursor-pointer">
                  <PromptPackCard
                    prompt={prompt}
                    isPurchased={purchasedIds.has(prompt.id)}
                    onTap={() => setSelectedPrompt(prompt)}
                    onSellerTap={() => onCreatorTap?.(prompt.creator_name || '')}
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
          Object.entries(grouped).map(([category, prompts]) => (
            <div key={category} className="mb-6">
              {/* Category header */}
              <button onClick={() => setSelectedCategory(category)} className="flex items-center gap-1 px-4 pt-4 pb-2">
                <h2 className="text-base font-bold text-foreground">{category}</h2>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>

              {/* Horizontal scroll */}
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
                {prompts.map(prompt => (
                  <PromptPackCard
                    key={prompt.id}
                    prompt={prompt}
                    isPurchased={purchasedIds.has(prompt.id)}
                    onTap={() => setSelectedPrompt(prompt)}
                    onSellerTap={() => onCreatorTap?.(prompt.creator_name || '')}
                  />
                ))}
              </div>
            </div>
          ))
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
          onViewSeller={(name) => { setSelectedPrompt(null); onCreatorTap?.(name); }}
        />
      )}

      {/* Cart Panel */}
      {showCart && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/50" onClick={() => setShowCart(false)} />
          <div className="fixed top-0 right-0 z-[81] w-80 max-w-[85vw] h-full bg-background border-l border-border animate-slide-in-right">
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
          <div className="fixed top-0 right-0 z-[81] w-80 max-w-[85vw] h-full bg-background border-l border-border animate-slide-in-right">
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
function PromptPackCard({
  prompt,
  isPurchased,
  onTap,
  onSellerTap,
}: {
  prompt: MarketplacePrompt;
  isPurchased: boolean;
  onTap: () => void;
  onSellerTap?: () => void;
}) {
  const imgs = prompt.preview_images.length > 0 ? prompt.preview_images : [prompt.preview_image || '/placeholder.svg'];
  const badgeColor = modelBadgeColors[prompt.model_type] || 'bg-muted';

  return (
    <button
      onClick={onTap}
      className="flex-shrink-0 w-[280px] rounded-xl overflow-hidden bg-card border border-border text-left transition-transform active:scale-[0.97]"
    >
      {/* Multi-image grid preview */}
      <div className="relative h-[180px] w-full overflow-hidden">
        {imgs.length >= 3 ? (
          <div className="grid grid-cols-3 h-full gap-[1px]">
            {imgs.slice(0, 3).map((img, i) => (
              <div key={i} className="overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        ) : imgs.length === 2 ? (
          <div className="grid grid-cols-2 h-full gap-[1px]">
            {imgs.map((img, i) => (
              <div key={i} className="overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        ) : (
          <img src={imgs[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
        )}

        {/* Model badge */}
        <div className="absolute top-2 left-2">
          <span className={`flex items-center gap-1 ${badgeColor} text-white text-[9px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm`}>
            🔥 {prompt.model_type}
          </span>
        </div>

        {/* Rating badge */}
        {prompt.rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-background/70 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-foreground">{prompt.rating}</span>
            <Star size={9} className="text-yellow-400 fill-yellow-400" />
          </div>
        )}

        {/* Purchased badge */}
        {isPurchased && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full">
              OWNED
            </span>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="px-3 py-2.5">
        <h3 className="text-xs font-semibold text-foreground truncate mb-1">{prompt.title}</h3>
        <div className="flex items-center justify-between">
          <span
            onClick={(e) => { e.stopPropagation(); onSellerTap?.(); }}
            className="text-[10px] text-muted-foreground active:text-primary"
          >@{prompt.creator_name || 'unknown'} · {prompt.sales_count} sales</span>
          {prompt.price === 0 ? (
            <span className="text-[11px] font-bold text-green-400">FREE</span>
          ) : (
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-primary">
              <Coins size={11} />
              {prompt.price}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
