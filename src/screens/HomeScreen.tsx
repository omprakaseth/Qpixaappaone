import React, { useState, useRef, useEffect } from 'react';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import ScrollToTop from '@/components/ScrollToTop';
import ImageCard from '@/components/ImageCard';
import SkeletonCard from '@/components/SkeletonCard';
import FilterPanel, { FilterState } from '@/components/FilterPanel';
import QuickActions from '@/components/QuickActions';
import CategoryExplorer from '@/screens/CategoryExplorer';
import FeedAdCard from '@/components/ads/FeedAdCard';
import { useAppState } from '@/context/AppContext';
import { generatePosts, Post } from '@/data/mockData';

const categories = ['Trending', 'Following', 'Portrait', 'Anime', 'Cars', 'Fantasy', 'Nature'];

interface HomeScreenProps {
  scrollRef: React.RefObject<HTMLDivElement>;
  onPostTap: (post: Post) => void;
  onCreatePost: () => void;
  onGetPro: () => void;
  onCreatorTap?: (creatorName: string) => void;
  adSettings?: {
    enabled: boolean;
    frequency: number;
    placementFeed: boolean;
    adsensePublisherId: string;
    adsenseFeedSlot: string;
  };
  isPro?: boolean;
}

export default function HomeScreen({ scrollRef, onPostTap, onCreatePost, onGetPro, onCreatorTap, adSettings, isPro }: HomeScreenProps) {
  const { posts, setPosts, toggleLike, toggleSave } = useAppState();
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [quickActionsPost, setQuickActionsPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ style: 'All', aspectRatio: 'All', popularity: 'All', time: 'All Time' });
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Filter posts
  const filteredPosts = posts.filter(p => {
    if (activeCategory !== 'Trending' && p.category !== activeCategory) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.style !== 'All' && p.style !== filters.style) return false;
    return true;
  });

  // Header collapse on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let accumulated = 0;
    let lastY = el.scrollTop;
    let lastToggle = 0;
    const handleScroll = () => {
      const current = el.scrollTop;
      const delta = current - lastY;
      if (Math.abs(delta) < 3) return;
      if (current < 20) {
        setHeaderCollapsed(false);
        accumulated = 0;
        lastY = current;
        return;
      }
      if ((delta > 0 && accumulated > 0) || (delta < 0 && accumulated < 0)) {
        accumulated += delta;
      } else {
        accumulated = delta;
      }
      const now = Date.now();
      if (now - lastToggle > 300 && Math.abs(accumulated) > 30) {
        setHeaderCollapsed(accumulated > 0);
        lastToggle = now;
        accumulated = 0;
      }
      lastY = current;
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading) {
        setLoading(true);
        setTimeout(() => {
          const newPosts = generatePosts(10, posts.length);
          setPosts(prev => [...prev, ...newPosts]);
          setLoading(false);
        }, 800);
      }
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, posts.length]);

  // Pull to refresh
  const touchStart = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!scrollRef.current || scrollRef.current.scrollTop > 0) return;
    const delta = e.changedTouches[0].clientY - touchStart.current;
    if (delta > 80) {
      setRefreshing(true);
      setTimeout(() => {
        setPosts(generatePosts(20));
        setRefreshing(false);
      }, 1000);
    }
  };

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto scrollbar-hide"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header - collapsible top section */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
        <div
          className="overflow-hidden transition-all duration-300"
          style={{
            maxHeight: headerCollapsed ? '0px' : '52px',
            opacity: headerCollapsed ? 0 : 1,
          }}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <h1 className="text-xl font-bold">
              <span className="text-primary">Q</span>
              <span className="text-foreground">pixa</span>
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExplorerOpen(true)}
                className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
                  <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
                  <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
                  <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
                </svg>
              </button>
              <button
                onClick={onGetPro}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1"
              >
                GET PRO
              </button>
            </div>
          </div>
        </div>

        {/* Search - always sticky */}
        <div className="px-4 pb-2 flex gap-2">
        <div className="flex-1 flex items-center bg-secondary search-glow rounded-xl px-3 h-10">
            <Search size={16} className="text-muted-foreground mr-2" />
            <input
              type="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>
          <button
            onClick={onCreatePost}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Categories - always sticky */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            onClick={() => setFilterOpen(true)}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
          >
            <SlidersHorizontal size={16} className="text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Refresh indicator */}
      {refreshing && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Grid */}
      <div className="px-4 pb-20">
        {activeCategory === 'Following' ? (
          <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
            <Users size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-semibold text-foreground">Following Feed</p>
            <p className="text-xs text-center mt-1 px-8">Follow creators from their profile to see their posts here</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {filteredPosts.map((post, index) => (
                <React.Fragment key={post.id}>
                  <ImageCard
                    post={post}
                    onTap={() => onPostTap(post)}
                    onDoubleTap={() => toggleLike(post.id)}
                    onLongPress={() => setQuickActionsPost(post)}
                    onCreatorTap={() => onCreatorTap?.(post.creator.name)}
                  />
                  {adSettings?.enabled && adSettings.placementFeed && !isPro &&
                    (index + 1) % (adSettings.frequency * 2) === 0 && (
                    <FeedAdCard
                      publisherId={adSettings.adsensePublisherId}
                      slotId={adSettings.adsenseFeedSlot}
                    />
                  )}
                </React.Fragment>
              ))}
              {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
            </div>
            <div ref={loadMoreRef} className="h-4" />

            {/* Footer Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 py-6 mt-4 border-t border-border">
              <Link to="/about" className="text-xs text-muted-foreground hover:text-primary transition-colors">About</Link>
              <span className="text-muted-foreground/30 text-xs">•</span>
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
              <span className="text-muted-foreground/30 text-xs">•</span>
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms</Link>
              <span className="text-muted-foreground/30 text-xs">•</span>
              <Link to="/contact" className="text-xs text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            </div>
          </>
        )}
      </div>

      <FilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} onApply={setFilters} />
      <QuickActions
        open={!!quickActionsPost}
        onClose={() => setQuickActionsPost(null)}
        onAction={(action) => {
          if (!quickActionsPost) return;
          if (action === 'save') toggleSave(quickActionsPost.id);
          if (action === 'copy') navigator.clipboard?.writeText(quickActionsPost.prompt);
        }}
      />
      <CategoryExplorer
        open={explorerOpen}
        onClose={() => setExplorerOpen(false)}
        onSelect={setActiveCategory}
        activeCategory={activeCategory}
      />
      <ScrollToTop scrollRef={scrollRef} />
    </div>
  );
}