"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Users, Search, SlidersHorizontal, Plus, TrendingUp, Store, Bell, X, Sparkles, Image as ImageIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ScrollToTop from '@/components/ScrollToTop';
import { toast } from 'sonner';
import ImageCard from '@/components/ImageCard';
import SkeletonCard from '@/components/SkeletonCard';
import FilterPanel, { FilterState } from '@/components/FilterPanel';
import QuickActions from '@/components/QuickActions';
import FeedAdCard from '@/components/ads/FeedAdCard';
import { Logo } from '@/components/Logo';
import { LogoLoader } from '@/components/LogoLoader';
import { useAppState } from '@/context/AppContext';
import { Post } from '@/types';
import { useFollows } from '@/hooks/useFollows';
import { useVirtualizer } from '@tanstack/react-virtual';

const categories = ['Trending', 'Following', 'IPL 2026', 'Summer', '90s Retro', 'Professions', 'Fantasy', 'Luxury'];

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
  console.log('HomeScreen: posts length', posts.length);
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
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const topRowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(2);

  // Filter posts
  const [showNotifications, setShowNotifications] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(10);
  }, [activeCategory, searchQuery, filters]);

  const hasMockPosts = useMemo(() => posts.some(p => p.isMock), [posts]);
  
  const notificationsList = useMemo(() => {
    const base: any[] = [];
    
    if (hasMockPosts) {
      base.unshift({
        id: 'mock-info',
        title: 'Sample Data Active',
        message: 'We\'ve added some sample prompts to help you get started. Real user posts will always appear at the top!',
        created_at: new Date().toISOString()
      });
    }
    return base;
  }, [hasMockPosts]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const currentScrollY = el.scrollTop;
      // Threshold to avoid flickering
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

      if (topRowRef.current) {
        // Hide top header on scroll down, show on scroll up
        if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
          topRowRef.current.style.gridTemplateRows = '0fr';
          topRowRef.current.style.opacity = '0';
        } else {
          topRowRef.current.style.gridTemplateRows = '1fr';
          topRowRef.current.style.opacity = '1';
        }
      }
      
      lastScrollY.current = currentScrollY;
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  const filteredPosts = useMemo(() => {
    console.log(`HomeScreen: Filtering ${posts.length} posts. ActiveCategory: ${activeCategory}, Search: ${searchQuery}, Filters:`, filters);
    const filtered = posts.filter(p => {
      // 1. Handle "Following" tab
      if (activeCategory === 'Following') {
        const creatorId = (p as any).creator_id;
        // Mock posts don't have a real creator_id that we follow, so we hide them in Following tab
        if (p.isMock) return false;
        if (!creatorId || (!followingIds.has(creatorId) && creatorId !== user?.id)) return false;
      } 
      // 2. Handle "Trending" (Default) - Show everything!
      else if (activeCategory === 'Trending') {
        // No category filter for Trending
      } 
      // 3. Handle specific category tabs with Smart Logic (Match category OR tags)
      else {
        const matchesCategory = p.category === activeCategory;
        const matchesTags = p.tags?.some(tag => tag.toLowerCase() === activeCategory.toLowerCase());
        if (!matchesCategory && !matchesTags) return false;
      }

      // 4. Handle Search Query (Search in title AND tags)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = p.title?.toLowerCase().includes(q);
        const inTags = p.tags?.some(tag => tag.toLowerCase().includes(q));
        const inPrompt = p.prompt?.toLowerCase().includes(q);
        if (!inTitle && !inTags && !inPrompt) return false;
      }

      // 5. Handle Filter Panel (Explicit filters)
      if (filters.category !== 'All' && p.category !== filters.category) return false;
      if (filters.style !== 'All' && p.style !== filters.style) return false;
      
      return true;
    });
    console.log(`HomeScreen: ${filtered.length} posts remaining after filter`);
    return filtered;
  }, [posts, activeCategory, searchQuery, filters, followingIds, user?.id]);

  const topThisMonth = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.likes + b.views) - (a.likes + a.views))
      .slice(0, 5);
  }, [posts]);

  const feedItems = useMemo(() => {
    const arr: Array<{ type: 'post'; data: Post } | { type: 'ad'; id: string }> = [];
    const source = filteredPosts.length > 0 ? filteredPosts : posts;
    for (let i = 0; i < source.length; i++) {
        arr.push({ type: 'post', data: source[i] });
        if (adSettings?.enabled && adSettings.placementFeed && !isPro && (i + 1) % (adSettings.frequency * 2) === 0) {
           arr.push({ type: 'ad', id: `ad-${i}` });
        }
    }
    return arr;
  }, [filteredPosts, posts, adSettings, isPro]);

  useEffect(() => {
    const updateCols = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      // padding side is 0 since we measure inner container, gap is 12. min width 160.
      const cols = Math.floor((width + 12) / (160 + 12));
      setColumns(Math.max(2, cols));
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  const rowCount = Math.ceil(feedItems.length / columns);
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 232, // 220px height + 12px gap
    overscan: 4, // preload 4 rows
  });

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

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto scrollbar-hide bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header Container - Fixed at top with safe area padding */}
      <div 
        className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}
      >
        {/* Row 1: Logo & Actions (This row hides) */}
        <div 
          ref={topRowRef}
          className="grid transition-all duration-300 ease-in-out origin-top"
          style={{ gridTemplateRows: '1fr', opacity: 1 }}
        >
          <div className="overflow-hidden">
            <div className="px-4 flex items-center justify-between h-[52px]">
              <div className="flex items-center gap-2.5">
                <Logo size={32} />
                <h1 className="text-xl font-bold tracking-tight text-foreground">Qpixa</h1>
              </div>
              <div className="flex items-center gap-1">
                {uploadingPost && (
                  <div className="flex items-center gap-2 mr-2">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <svg className="w-8 h-8 -rotate-90">
                        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary" />
                        <circle
                          cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeDasharray={88}
                          strokeDashoffset={88 - (88 * uploadingPost.progress) / 100}
                          className={cn("transition-all duration-300", uploadingPost.status === 'error' ? "text-destructive" : "text-primary")}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {uploadingPost.status === 'uploading' && <Upload size={14} className="text-primary animate-bounce" />}
                        {uploadingPost.status === 'success' && <Sparkles size={14} className="text-primary" />}
                        {uploadingPost.status === 'error' && <button onClick={retryUpload} className="text-destructive"><X size={14} /></button>}
                      </div>
                    </div>
                  </div>
                )}
                <button onClick={() => navigate('/market')} className="p-1.5 transition-opacity active:opacity-60">
                  <Store size={22} className="text-foreground" />
                </button>
                <button onClick={() => setShowNotifications(true)} className="p-1.5 transition-opacity active:opacity-60 relative">
                  <Bell size={22} className="text-foreground" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Search Bar */}
        <div>
          <div className="px-4 py-2 flex gap-2">
            <div className="flex-1 flex items-center bg-secondary/80 focus-within:bg-secondary search-glow rounded-xl px-3 h-10 transition-colors">
              <Search size={16} className="text-muted-foreground mr-2" />
              <input
                type="search"
                autoComplete="off"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
              />
            </div>
            <button
              onClick={onCreatePost}
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Row 3: Categories */}
          <div className="flex items-center gap-0.5 px-4 pb-3">
            <button
              onClick={() => setFilterOpen(true)}
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90",
                Object.values(filters).some(v => v !== 'All' && v !== 'All Time')
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              )}
            >
              <SlidersHorizontal size={14} />
            </button>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 ml-0.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => cat === 'Shorts' ? navigate('/shorts') : setActiveCategory(cat)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95",
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {refreshing && (
        <div className="flex justify-center py-4 mt-[160px]">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Main Content Area - Padded top to account for fixed header */}
      <div 
        className={cn(
          "px-4 pb-safe-nav pt-[170px]", 
          isMounted && "transition-all duration-300"
        )}
      >
        {hasMockPosts && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3">
            <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Sample Data Active</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                We&apos;ve added some sample prompts to help you get started. Real user posts will always appear at the top!
              </p>
            </div>
          </div>
        )}

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

        {activeCategory === 'Following' && feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
            <Users size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-semibold text-foreground">Following Feed</p>
            <p className="text-xs text-center mt-1 px-8">Follow creators from their profile to see their posts here</p>
          </div>
        ) : (
          <div ref={containerRef} className="w-full">
            {(initialLoading && (posts.length === 0 || refreshing)) ? (
              <div className="flex flex-col items-center justify-center py-20">
                <LogoLoader size={80} text="Discovering masterpieces" />
              </div>
            ) : (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const startIndex = virtualRow.index * columns;
                  const rowItems = feedItems.slice(startIndex, startIndex + columns);
                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `220px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3"
                    >
                      {rowItems.map((item, idx) => (
                        <div key={item.type === 'post' ? item.data.id : item.id} className="w-full flex-shrink-0">
                          {item.type === 'post' ? (
                            <ImageCard
                              post={item.data}
                              onTap={() => onPostTap(item.data)}
                              onDoubleTap={() => toggleLike(item.data.id)}
                              onLongPress={() => setQuickActionsPost(item.data)}
                              onCreatorTap={() => onCreatorTap?.(item.data.creator.name, item.data.creator.id)}
                            />
                          ) : (
                            <FeedAdCard
                              publisherId={adSettings?.adsensePublisherId || ''}
                              slotId={adSettings?.adsenseFeedSlot || ''}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Load More trigger is no longer needed since virtualizer renders all via DOM, 
                but we can keep loadMoreRef for API pagination if implemented later */}
            <div ref={loadMoreRef} className="h-4" />
          </div>
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
          <div className="fixed top-0 right-0 z-[81] w-80 max-w-[85vw] h-full bg-background border-l border-border">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Notifications</h2>
              <button onClick={() => setShowNotifications(false)} className="p-1.5 rounded-full hover:bg-secondary">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)] p-4 space-y-3">
              {notificationsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Bell size={28} className="mb-2 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notificationsList.map(n => (
                  <div key={n.id} className={cn(
                    "p-3 rounded-xl border",
                    n.id === 'mock-info' ? "bg-primary/10 border-primary/20" : "bg-secondary/50 border-border"
                  )}>
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                      <span className={cn(
                        "w-1 h-1 rounded-full",
                        n.id === 'mock-info' ? "bg-primary" : "bg-muted-foreground"
                      )} />
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