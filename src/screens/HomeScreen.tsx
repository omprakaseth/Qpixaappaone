import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Users, Search, SlidersHorizontal, Plus, TrendingUp, Store, Bell, X, Sparkles, Image as ImageIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import { toast } from 'sonner';
import ImageCard from '@/components/ImageCard';
import SkeletonCard from '@/components/SkeletonCard';
import FilterPanel, { FilterState } from '@/components/FilterPanel';
import QuickActions from '@/components/QuickActions';
import FeedAdCard from '@/components/ads/FeedAdCard';
import { useAppState } from '@/context/AppContext';
import { Post } from '@/context/AppContext';
import { useFollows } from '@/hooks/useFollows';

const categories = ['Trending', 'Following', 'Shorts', 'Portrait', 'Anime', 'Cars', 'Fantasy', 'Nature'];

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
    showGetPro?: boolean;
  };
  isPro?: boolean;
  navVisible?: boolean;
}

export default function HomeScreen({ scrollRef, onPostTap, onCreatePost, onGetPro, onCreatorTap, adSettings, isPro, navVisible = true }: HomeScreenProps) {
  const { posts, setPosts, toggleLike, toggleSave, fetchPosts, user, initialLoading, uploadingPost, retryUpload, clearUpload } = useAppState();
  const { followingIds } = useFollows();
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickActionsPost, setQuickActionsPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ style: 'All', popularity: 'All', time: 'All Time', category: 'All' });
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const [showTopHeader, setShowTopHeader] = useState(true);
  const navigate = useNavigate();

  // Filter posts
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    { id: '1', title: 'Welcome to Qpixa!', message: 'Start creating amazing AI art today.', created_at: new Date().toISOString() },
    { id: '2', title: 'New Feature', message: 'Check out the new Shorts feed!', created_at: new Date().toISOString() },
  ]);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const currentScrollY = el.scrollTop;
      // Threshold to avoid flickering
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

      // Hide top header on scroll down, show on scroll up
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

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (activeCategory === 'Following') {
        const creatorId = (p as any).creator_id;
        if (!creatorId || (!followingIds.includes(creatorId) && creatorId !== user?.id)) return false;
      } else if (activeCategory !== 'Trending' && p.category !== activeCategory) {
        return false;
      }
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.category !== 'All' && p.category !== filters.category) return false;
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
        // Mock loading more posts
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      }
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading]);

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

  const topHeaderRef = useRef<HTMLDivElement>(null);
  const stickySectionRef = useRef<HTMLDivElement>(null);
  const [topHeaderHeight, setTopHeaderHeight] = useState(52);
  const [stickySectionHeight, setStickySectionHeight] = useState(96);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!topHeaderRef.current || !stickySectionRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === topHeaderRef.current) {
          setTopHeaderHeight(entry.contentRect.height + (showTopHeader ? 8 : 0)); // Account for padding
        } else if (entry.target === stickySectionRef.current) {
          setStickySectionHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(topHeaderRef.current);
    observer.observe(stickySectionRef.current);
    return () => observer.disconnect();
  }, [showTopHeader]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto scrollbar-hide"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm transition-all duration-300 ease-in-out" 
      >
        {/* Top Header: Hide on scroll down, show on scroll up */}
        <div 
          ref={topHeaderRef}
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showTopHeader ? 'opacity-100 max-h-[100px]' : 'opacity-0 max-h-0 pointer-events-none'
          }`}
          style={{ 
            paddingTop: showTopHeader ? 'max(env(safe-area-inset-top), 0.5rem)' : '0'
          }}
        >
          {/* R1: Logo & Actions */}
          <div className="flex items-center justify-between px-4 pb-3 h-[52px]">
            <h1 className="text-xl font-bold">
              <span className="text-primary">Q</span>
              <span className="text-foreground">pixa</span>
            </h1>
            <div className="flex items-center gap-1">
              {uploadingPost && (
                <div className="flex items-center gap-2 mr-2">
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-8 h-8 -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-secondary"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={88}
                        strokeDashoffset={88 - (88 * uploadingPost.progress) / 100}
                        className={cn(
                          "transition-all duration-300",
                          uploadingPost.status === 'error' ? "text-destructive" : "text-primary"
                        )}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {uploadingPost.status === 'uploading' && (
                        <Upload size={14} className="text-primary animate-bounce" />
                      )}
                      {uploadingPost.status === 'success' && (
                        <Sparkles size={14} className="text-primary" />
                      )}
                      {uploadingPost.status === 'error' && (
                        <button onClick={retryUpload} className="text-destructive">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {uploadingPost.status === 'error' && (
                    <button 
                      onClick={retryUpload}
                      className="text-[10px] font-bold text-destructive underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={() => navigate('/market')}
                className="p-1.5 transition-opacity active:opacity-60"
              >
                <Store size={22} className="text-foreground" />
              </button>
              
              <button
                onClick={() => setShowNotifications(true)}
                className="p-1.5 transition-opacity active:opacity-60 relative"
              >
                <Bell size={22} className="text-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Section: Always visible */}
        <div ref={stickySectionRef}>
          {/* R2: Search Bar */}
          <div className="px-4 pb-3 flex gap-2 pt-1 h-[56px]">
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

          {/* R3: Categories */}
          <div className="flex items-center gap-2 px-4 pb-2 h-[40px]">
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
                  onClick={() => {
                    if (cat === 'Shorts') {
                      navigate('/shorts');
                    } else {
                      setActiveCategory(cat);
                    }
                  }}
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
      </div>

      {refreshing && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div 
        className={cn(
          "px-4 pb-safe-nav",
          isMounted && "transition-all duration-300 ease-in-out"
        )}
        style={{ paddingTop: topHeaderHeight + stickySectionHeight }}
      >
        {activeCategory === 'Trending' && topThisMonth.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-primary" />
              <h2 className="text-xs font-bold">Top This Month</h2>
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
        ) : filteredPosts.length === 0 && !initialLoading ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Sparkles size={40} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to Qpixa!</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-[280px]">
              You are the first one here! Start by generating and sharing your first AI masterpiece.
            </p>
            <button
              onClick={onCreatePost}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              <Upload size={20} />
              Create First Post
            </button>
            
            <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="bg-secondary/50 p-4 rounded-2xl border border-border/50">
                <ImageIcon size={20} className="text-primary mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step 1</p>
                <p className="text-xs font-semibold">Generate Image</p>
              </div>
              <div className="bg-secondary/50 p-4 rounded-2xl border border-border/50">
                <TrendingUp size={20} className="text-primary mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step 2</p>
                <p className="text-xs font-semibold">Share with World</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
              {(initialLoading && posts.length === 0) ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`sk-init-${i}`} />)
              ) : (
                <>
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
                </>
              )}
            </div>
            <div ref={loadMoreRef} className="h-4" />
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
      <ScrollToTop scrollRef={scrollRef} />

      {/* Notifications Panel */}
      {showNotifications && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/50" onClick={() => setShowNotifications(false)} />
          <div className="fixed top-0 right-0 z-[81] w-80 max-w-[85vw] h-full bg-background border-l border-border animate-in slide-in-from-right duration-300">
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
                      <span className="w-1 h-1 rounded-full bg-primary" />
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