"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppState } from '@/context/AppContext';
import { SEO } from '@/components/SEO';
import BottomNav from '@/components/BottomNav';
import HomeScreen from '@/screens/HomeScreen';
import MarketplaceScreen from '@/screens/MarketplaceScreen';
import StudioScreen from '@/screens/StudioScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ShortsScreen from '@/screens/ShortsScreen';
import NotificationScreen from '@/screens/NotificationScreen';
import PostDetail from '@/screens/PostDetail';
import CreatePost from '@/screens/CreatePost';
import SettingsScreen from '@/screens/SettingsScreen';
import SubscriptionScreen from '@/screens/SubscriptionScreen';
import AuthScreen from '@/screens/AuthScreen';
import CreatorProfileOverlay from '@/components/profile/CreatorProfileOverlay';
import BannerAd from '@/components/ads/BannerAd';
import RewardButton from '@/components/ads/RewardButton';
import RewardedAdModal from '@/components/ads/RewardedAdModal';
import { useSmartScroll } from '@/hooks/useSmartScroll';
import { useAdSettings } from '@/hooks/useAdSettings';
import { Post } from '@/types';
import { Bell } from 'lucide-react';
import { generatePromptMeta } from '@/lib/seo-utils';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export const dynamic = 'force-dynamic';

export default function CatchAllPage() {
  const { navigateBack, navigateToTab, activePath: pathname } = useAppNavigation();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string[] | undefined;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  const activeTab = useMemo(() => {
    if (pathname === '/market') return 'discover';
    if (pathname === '/shorts') return 'shorts';
    if (pathname === '/studio') return 'studio';
    if (pathname === '/notifications') return 'notifications';
    if (pathname === '/favorites') return 'favorites';
    if (pathname === '/profile') return 'profile';
    return 'home';
  }, [pathname]);

  const { posts, isPro, isLoggedIn, user, profile, fetchPostById } = useAppState();
  const { settings: adSettings } = useAdSettings();
  
  const [showRewardAd, setShowRewardAd] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [createPostData, setCreatePostData] = useState<{ imageUrl?: string; prompt?: string }>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [studioPrompt, setStudioPrompt] = useState('');
  const [viewingCreator, setViewingCreator] = useState<string | null>(null);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visitedTabs.has(activeTab)) {
      setVisitedTabs(prev => new Set(prev).add(activeTab));
    }
  }, [activeTab, visitedTabs]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'visualViewport' in window && window.visualViewport) {
      const vv = window.visualViewport;
      const handleResize = () => {
        setKeyboardVisible(window.innerHeight - vv.height > 150);
      };
      vv.addEventListener('resize', handleResize);
      return () => vv.removeEventListener('resize', handleResize);
    }
  }, []);

  // Ref to track planned navigation to prevent sync logic from fighting it
  const pendingNavigationRef = useRef<{ type: 'prompt' | 'creator'; id: string } | null>(null);
  const navigationLockRef = useRef<boolean>(false);

  // Sync state with URL only if not already matched
  useEffect(() => {
    const syncWithUrl = async () => {
      // Use activePath from useAppNavigation to avoid stale closures
      const pathParts = pathname.split('/').filter(Boolean);
      const urlType = pathParts[0];
      const urlId = pathParts[1];

      const isPromptUrl = urlType === 'prompt' && !!urlId;
      const isCreatorUrl = urlType === 'creator' && !!urlId;

      // 1. Handle Prompt URL
      if (isPromptUrl) {
        // Clear creator if switching to prompt
        if (viewingCreator) setViewingCreator(null);

        // If we are already showing this post, do nothing
        if (selectedPost && selectedPost.id === urlId) {
          pendingNavigationRef.current = null;
          return;
        }
        
        // If we just manually navigated to this post, update the ref and stop
        if (pendingNavigationRef.current?.type === 'prompt' && pendingNavigationRef.current?.id === urlId) {
          pendingNavigationRef.current = null;
          return;
        }

        const post = posts.find(p => p.id === urlId);
        if (post) {
          setSelectedPost(post);
        } else {
          try {
            const fetched = await fetchPostById(urlId);
            if (fetched) setSelectedPost(fetched);
          } catch (e) {
            console.error("Failed to fetch post for URL sync", e);
          }
        }
      } else if (isCreatorUrl) {
        // 2. Handle Creator URL
        // Clear prompt if switching to creator
        if (selectedPost) setSelectedPost(null);

        if (viewingCreator === urlId) {
          pendingNavigationRef.current = null;
          return;
        }
        
        if (pendingNavigationRef.current?.type === 'creator' && pendingNavigationRef.current?.id === urlId) {
          pendingNavigationRef.current = null;
          return;
        }

        setViewingCreator(urlId);
      } else if (!pendingNavigationRef.current) {
        // 3. Neither prompt nor creator, and no pending navigation
        if (selectedPost) setSelectedPost(null);
        if (viewingCreator) setViewingCreator(null);
      }
    };

    syncWithUrl();
  }, [pathname, posts, fetchPostById]); // Removed selectedPost/viewingCreator from dependencies to avoid loop/flicker

  const goBack = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Check if we are on an overlay route
    const pathParts = pathname.split('/').filter(Boolean);
    const isOverlay = pathParts[0] === 'prompt' || pathParts[0] === 'creator';
    
    if (isOverlay) {
      router.back();
    } else if (showSettings) {
      setShowSettings(false);
    } else if (showSubscription) {
      setShowSubscription(false);
    } else if (showAuth) {
      setShowAuth(false);
    } else if (showCreatePost) {
      setShowCreatePost(false);
    } else {
      navigateBack();
    }
  }, [pathname, router, navigateBack, showSettings, showSubscription, showAuth, showCreatePost]);

  const openPost = useCallback((post: Post) => {
    if (navigationLockRef.current) return;
    navigationLockRef.current = true;
    
    // Set the planned navigation first
    pendingNavigationRef.current = { type: 'prompt', id: post.id };
    
    // Optimistically set state to start animation immediately
    setSelectedPost(post);
    
    // Push the URL
    router.push(`/prompt/${post.id}`, { scroll: false });
    
    // Lock for a short time to prevent multiple clicks
    setTimeout(() => {
      navigationLockRef.current = false;
    }, 500);
  }, [router]);

  const openCreatePost = useCallback(() => {
    setShowCreatePost(true);
  }, []);

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const openSubscription = useCallback(() => {
    setShowSubscription(true);
  }, []);

  const openAuth = useCallback((mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuth(true);
  }, []);

  const scrollToTopRef = useRef<() => void>(() => {});
  const handleTabChange = useCallback((tab: string) => {
    if (tab === activeTab) {
      scrollToTopRef.current();
      return;
    }
    navigateToTab(tab);
  }, [activeTab, navigateToTab]);

  const openCreator = useCallback((creatorName: string, creatorId?: string) => {
    if (navigationLockRef.current) return;
    const targetId = creatorId || creatorName;
    if (user && targetId === user.id) {
      handleTabChange('profile');
      return;
    }
    navigationLockRef.current = true;
    pendingNavigationRef.current = { type: 'creator', id: targetId };
    
    setViewingCreator(targetId);
    router.push(`/creator/${targetId}`, { scroll: false });
    
    setTimeout(() => {
      navigationLockRef.current = false;
    }, 500);
  }, [user, handleTabChange, router]);

  const smartScrollEnabled = activeTab === 'home' || activeTab === 'discover' || activeTab === 'favorites' || activeTab === 'profile';
  const { visible: navVisible, scrollRef } = useSmartScroll(smartScrollEnabled);

  const seoMeta = useMemo(() => {
    if (selectedPost) {
      const meta = generatePromptMeta({
        prompt: selectedPost.prompt,
        category: selectedPost.category,
        tags: selectedPost.tags
      });
      return {
        ...meta,
        image: selectedPost.imageUrl,
        canonical: `/prompt/${selectedPost.id}`
      };
    }
    
    const tabTitles: Record<string, string> = {
      discover: 'Marketplace - Buy & Sell AI Prompts',
      shorts: 'AI Shorts - Watch Amazing AI Videos',
      studio: 'AI Studio - Create Your Own AI Art',
      notifications: 'Notifications',
      favorites: 'Your Favorites',
      profile: profile?.display_name || 'Your Profile'
    };

    const tabDescriptions: Record<string, string> = {
      discover: 'Discover and buy high-quality AI prompts for Midjourney, DALL-E, and more on the Qpixa marketplace.',
      shorts: 'Watch and share high-quality AI-generated short videos. Experience the future of AI video creation.',
      studio: 'Create your own stunning AI art and videos with our advanced generation tools.',
      notifications: 'Stay updated with likes, comments, and new followers on Qpixa.',
      favorites: 'Your personal collection of the best AI art and prompts on Qpixa.',
      profile: `Check out ${profile?.display_name || 'this creator'}'s AI gallery and prompt creations on Qpixa.`
    };
    
    return {
      title: tabTitles[activeTab] || undefined,
      description: tabDescriptions[activeTab] || undefined,
      image: undefined,
      keywords: [],
      isLowQuality: false,
      canonical: pathname || undefined
    };
  }, [selectedPost, activeTab, profile, pathname]);

  useEffect(() => {
    scrollToTopRef.current = () => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }, [scrollRef]);

  const handleUsePrompt = useCallback((prompt: string) => {
    setStudioPrompt(prompt);
    setSelectedPost(null);
    router.push('/studio');
  }, [router]);

  const screens = useMemo(() => {
    return {
      home: (
        <HomeScreen
          scrollRef={scrollRef}
          onPostTap={openPost}
          onCreatePost={openCreatePost}
          onGetPro={openSubscription}
          onCreatorTap={openCreator}
          adSettings={adSettings}
          isPro={isPro}
          navVisible={navVisible}
        />
      ),
      discover: (
        <MarketplaceScreen
          scrollRef={scrollRef}
          onUsePrompt={handleUsePrompt}
          onOpenAuth={openAuth}
          onCreatorTap={openCreator}
          navVisible={navVisible}
        />
      ),
      shorts: (
        <ShortsScreen 
          onBack={() => handleTabChange('home')} 
          onCreatorTap={openCreator}
        />
      ),
      studio: isLoggedIn ? (
        <StudioScreen
          initialPrompt={studioPrompt}
          onClearInitialPrompt={() => setStudioPrompt('')}
          onPublish={(imageUrl, prompt) => {
            setCreatePostData({ imageUrl, prompt });
            openCreatePost();
          }}
        />
      ) : (
        <div className="h-full flex flex-col items-center justify-center px-6 bg-background">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Sign in to use Studio</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Create amazing AI images by signing in to your account</p>
          <button onClick={() => openAuth('login')} className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            Sign In
          </button>
          <button onClick={() => openAuth('signup')} className="mt-3 text-sm text-primary font-medium">
            Create Account
          </button>
        </div>
      ),
      notifications: isLoggedIn ? (
        <NotificationScreen />
      ) : (
        <div className="h-full flex flex-col items-center justify-center px-6 bg-background">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Bell size={36} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Sign in to see Alerts</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Stay updated with likes, comments and followers</p>
          <button onClick={() => openAuth('login')} className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            Sign In
          </button>
        </div>
      ),
      favorites: <FavoritesScreen scrollRef={scrollRef} onOpenAuth={openAuth} navVisible={navVisible} />,
      profile: <ProfileScreen scrollRef={scrollRef} onOpenSettings={openSettings} onOpenAuth={openAuth} onPostTap={openPost} navVisible={navVisible} />
    };
  }, [scrollRef, openPost, openCreatePost, openSubscription, openCreator, adSettings, isPro, navVisible, handleUsePrompt, openAuth, handleTabChange, isLoggedIn, studioPrompt, openSettings, profile]);

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-background flex flex-col">
      <SEO 
        title={seoMeta.title}
        description={seoMeta.description}
        image={seoMeta.image}
        canonical={seoMeta.canonical}
        noindex={seoMeta.isLowQuality}
        keywords={seoMeta.keywords}
      />
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          {activeTab === 'home' && screens.home}
          {activeTab === 'discover' && screens.discover}
          {activeTab === 'shorts' && screens.shorts}
          {activeTab === 'studio' && screens.studio}
          {activeTab === 'notifications' && screens.notifications}
          {activeTab === 'favorites' && screens.favorites}
          {activeTab === 'profile' && screens.profile}
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} visible={navVisible && !keyboardVisible} />

      {/* Banner Ad - free users only */}
      {adSettings.enabled && adSettings.placementBanner && !isPro && navVisible && (
        <BannerAd publisherId={adSettings.adsensePublisherId} slotId={adSettings.adsenseBannerSlot} />
      )}

      {/* Reward Ad Button - logged in free users */}
      {adSettings.enabled && adSettings.placementReward && !isPro && isLoggedIn && (
        <RewardButton onClick={() => setShowRewardAd(true)} />
      )}

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        open={showRewardAd}
        onClose={() => {
          setShowRewardAd(false);
          if (!isPro) {
            setTimeout(() => {
              setShowUpgradePopup(true);
              setTimeout(() => setShowUpgradePopup(false), 4000);
            }, 500);
          }
        }}
        rewardCredits={adSettings.rewardCredits}
        publisherId={adSettings.adsensePublisherId}
      />

      {/* Smart Upgrade Popup */}
      {showUpgradePopup && !isPro && adSettings.enableSubscriptions && (
        <div className="fixed top-16 left-4 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <SparklesIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Upgrade to Pro ✨</p>
              <p className="text-xs text-muted-foreground truncate">Unlimited generations, no ads, priority access</p>
            </div>
            <button
              onClick={() => {
                setShowUpgradePopup(false);
                openSubscription();
              }}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0"
            >
              Go Pro
            </button>
            <button
              onClick={() => setShowUpgradePopup(false)}
              className="p-1 shrink-0"
            >
              <XIcon />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedPost && (
          <motion.div
            key={`post-detail-wrapper-${selectedPost.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm px-0 sm:px-4"
          >
            <motion.div
              key={`post-detail-content-${selectedPost.id}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full h-full sm:max-w-2xl sm:h-[90vh] sm:rounded-3xl bg-background overflow-hidden shadow-2xl relative"
            >
              <PostDetail
                post={selectedPost}
                onBack={goBack}
                onUsePrompt={handleUsePrompt}
                onCreatorTap={openCreator}
                onPostTap={openPost}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingCreator && (
          <motion.div
            key={`creator-overlay-${viewingCreator}`}
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[70]"
          >
            <CreatorProfileOverlay
              creatorName={viewingCreator}
              posts={posts}
              onBack={goBack}
              onPostTap={openPost}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreatePost && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[70]"
          >
            <CreatePost
              onBack={goBack}
              initialImageUrl={createPostData.imageUrl}
              initialPrompt={createPostData.prompt}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {showSettings && <SettingsScreen onBack={goBack} />}
      {showSubscription && <SubscriptionScreen onBack={goBack} />}
      {showAuth && <AuthScreen onBack={goBack} initialMode={authMode} />}
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  );
}
