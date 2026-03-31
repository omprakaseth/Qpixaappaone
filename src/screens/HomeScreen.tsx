import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Users, Search, SlidersHorizontal, Plus, TrendingUp, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import { toast } from 'sonner';
import ImageCard from '@/components/ImageCard';
import SkeletonCard from '@/components/SkeletonCard';
import FilterPanel, { FilterState } from '@/components/FilterPanel';
import QuickActions from '@/components/QuickActions';
import CategoryExplorer from '@/screens/CategoryExplorer';
import FeedAdCard from '@/components/ads/FeedAdCard';
import { useAppState } from '@/context/AppContext';
import { Post } from '@/context/AppContext';
import { useFollows } from '@/hooks/useFollows';

const categories = ['Trending', 'Following', 'Portrait', 'Anime', 'Cars', 'Fantasy', 'Nature'];

interface HomeScreenProps {
  scrollRef: React.RefObject<HTMLDivElement>;
  onPostTap: (post: Post) => void;
  onCreatePost: () => void;
  onGetPro: () => void;
  onCreatorTap?: (creatorName: string, creatorId?: string) => void;
  adSettings?: {
    enabled: boolean;
    frequency: number;
    placementFeed: boolean;
    adsensePublisherId: string;
    adsenseFeedSlot: string;
  };
  isPro?: boolean;
  navVisible?: boolean;
}

export default function HomeScreen({ scrollRef, onPostTap, onCreatePost, onGetPro, onCreatorTap, adSettings, isPro, navVisible = true }: HomeScreenProps) {
  const { posts, setPosts, toggleLike, toggleSave, fetchPosts, user } = useAppState();
  const { followingIds } = useFollows();
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [quickActionsPost, setQuickActionsPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ style: 'All', popularity: 'All', time: 'All Time' });
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const navigate = useNavigate();

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (activeCategory === 'Following') {
        const creatorId = (p as any).creator_id;
        if (!creatorId || (!followingIds.includes(creatorId) && creatorId !== user?.id)) return false;
      } else if (activeCategory !== 'Trending' && p.category !== activeCategory) {
        return false;
      }
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.style !== 'All' && p.style !== filters.style) return false;
      return true;
    });
  }, [posts, activeCategory, searchQuery, filters, followingIds, user?.id]);

  const topThisMonth = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.likes + b.views) - (a.likes + a.views))
      .slice(0, 5);
  }, [posts]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading) {
        setLoading(true);
        setLoading(false);
      }
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, posts.length]);

  const touchStart = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY; };
  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!scrollRef.current || scrollRef.current.scrollTop > 0) return;
    const delta = e.changedTouches[0].clientY - touchStart.current;
    if (delta > 80) {
      setRefreshing(true);
      try {
        await fetchPosts();
      } catch (err) {
        toast.error('Failed to load posts');
      }
      setRefreshing(false);
    }
  };

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto scrollbar-hide"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm transition-transform duration-300" 
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top), 0.5rem)',
          transform: navVisible ? 'translateY(0)' : 'translateY(-100%)'
        }}
      >
        <div>
          <div className="flex items-center justify-between px-4 pb-3">
            <h1 className="text-xl font-bold">
              <span className="text-primary">Q</span>
              <span className="text-foreground">pixa</span>
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/market')}
                className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
              >
                <Store size={18} className="text-muted-foreground" />
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

        <div className="px-4 pb-3 flex gap-2 pt-1">
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

        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            onClick={() => setExplorerOpen(true)}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center transition-colors hover:bg-secondary/80"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            onClick={() => setFilterOpen(true)}
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              Object.values(filters).some(v => v !== 'All' && v !== 'All Time')
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground'
            }`}
          >
            <SlidersHorizontal size={14} />
          </button>
          <div className="w-[1px] h-4 bg-border mx-1 flex-shrink-0" />
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

      {refreshing && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="px-4 pb-safe-nav">
        {activeCategory === 'Trending' && topThisMonth.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-primary" />
              <h2 className="text-sm font-bold">Top This Month</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {topThisMonth.map(post => (
                <div key={post.id} className="w-[170px] flex-shrink-0">
                  <ImageCard
                    post={post}
                    onTap={() => onPostTap(post)}
                    onDoubleTap={() => toggleLike(post.id)}
                    onLongPress={() => setQuickActionsPost(post)}
                    onCreatorTap={() => onCreatorTap?.(post.creator.name, post.creator.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeCategory === 'Following' && filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
            <Users size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-semibold text-foreground">Following Feed</p>
            <p className="text-xs text-center mt-1 px-8">Follow creators from their profile to see their posts here</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
              {filteredPosts.map((post, index) => (
                <React.Fragment key={post.id}>
                  <ImageCard
                    post={post}
                    onTap={() => onPostTap(post)}
                    onDoubleTap={() => toggleLike(post.id)}
                    onLongPress={() => setQuickActionsPost(post)}
                    onCreatorTap={() => onCreatorTap?.(post.creator.name, post.creator.id)}
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