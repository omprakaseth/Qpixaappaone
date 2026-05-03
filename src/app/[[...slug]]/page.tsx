"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
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
import { Bell } from 'lucide-react';
import { generatePromptMeta } from '@/lib/seo-utils';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useSmartScroll } from '@/hooks/useSmartScroll';
import { useAdSettings } from '@/hooks/useAdSettings';
import BannerAd from '@/components/ads/BannerAd';
import RewardButton from '@/components/ads/RewardButton';
import RewardedAdModal from '@/components/ads/RewardedAdModal';
import { Post } from '@/types';

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

  const [baseTab, setBaseTab] = useState<'home' | 'discover' | 'shorts' | 'studio' | 'notifications' | 'favorites' | 'profile'>('home');

  useEffect(() => {
    const mainTabs: Record<string, typeof baseTab> = {
      '/': 'home',
      '/market': 'discover',
      '/shorts': 'shorts',
      '/studio': 'studio',
      '/notifications': 'notifications',
      '/favorites': 'favorites',
      '/profile': 'profile'
    };
    if (mainTabs[pathname]) {
      setBaseTab(mainTabs[pathname]);
    }
  }, [pathname]);

  const activeTab = baseTab;

  const { 
    posts, isPro, isLoggedIn, user, profile, fetchPostById, 
    selectedPost, setSelectedPost, 
    viewingCreator, setViewingCreator,
    setShowCreatePost, setCreatePostData,
    setShowSettings, setShowSubscription, 
    setShowAuth, setAuthMode
  } = useAppState();
  const { settings: adSettings } = useAdSettings();
  
  const [showRewardAd, setShowRewardAd] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [studioPrompt, setStudioPrompt] = useState('');

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

  const goBack = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigateBack();
  }, [navigateBack]);

  const openPost = useCallback((post: Post) => {
    setSelectedPost(post);
    router.push(`/prompt/${post.id}`, { scroll: false });
  }, [router, setSelectedPost]);

  const openCreatePost = useCallback(() => {
    setShowCreatePost(true);
  }, [setShowCreatePost]);

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, [setShowSettings]);

  const openSubscription = useCallback(() => {
    setShowSubscription(true);
  }, [setShowSubscription]);

  const openAuth = useCallback((mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuth(true);
  }, [setAuthMode, setShowAuth]);

  const scrollToTopRef = useRef<() => void>(() => {});
  const handleTabChange = useCallback((tab: string) => {
    if (tab === activeTab) {
      scrollToTopRef.current();
      return;
    }
    navigateToTab(tab);
  }, [activeTab, navigateToTab]);

  const openCreator = useCallback((creatorName: string, creatorId?: string) => {
    const targetId = creatorId || creatorName;
    if (user && targetId === user.id) {
      handleTabChange('profile');
      return;
    }
    setViewingCreator(targetId);
    router.push(`/creator/${targetId}`, { scroll: false });
  }, [user, handleTabChange, router, setViewingCreator]);

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
  }, [router, setSelectedPost]);

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
      studio: (
        <StudioScreen
          initialPrompt={studioPrompt}
          onClearInitialPrompt={() => setStudioPrompt('')}
          onPublish={(imageUrl, prompt) => {
            setCreatePostData({ imageUrl, prompt });
            openCreatePost();
          }}
          isLoggedIn={isLoggedIn}
          onOpenAuth={() => openAuth('login')}
        />
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
  }, [scrollRef, openPost, openCreatePost, openSubscription, openCreator, adSettings, isPro, navVisible, handleUsePrompt, openAuth, handleTabChange, isLoggedIn, studioPrompt, setCreatePostData, openSettings, profile]);

  return (
    <div className="h-full w-full bg-background flex flex-col">
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
          <div className={cn("absolute inset-0", activeTab !== 'home' && "hidden")}>{screens.home}</div>
          <div className={cn("absolute inset-0", activeTab !== 'discover' && "hidden")}>{screens.discover}</div>
          {activeTab === 'shorts' && screens.shorts}
          <div className={cn("absolute inset-0", activeTab !== 'studio' && "hidden")}>{screens.studio}</div>
          <div className={cn("absolute inset-0", activeTab !== 'notifications' && "hidden")}>{screens.notifications}</div>
          <div className={cn("absolute inset-0", activeTab !== 'favorites' && "hidden")}>{screens.favorites}</div>
          <div className={cn("absolute inset-0", activeTab !== 'profile' && "hidden")}>{screens.profile}</div>
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} visible={navVisible && !keyboardVisible} />

      {/* ads and popups */}
      {adSettings.enabled && adSettings.placementBanner && !isPro && navVisible && (
        <BannerAd publisherId={adSettings.adsensePublisherId} slotId={adSettings.adsenseBannerSlot} />
      )}
      {adSettings.enabled && adSettings.placementReward && !isPro && isLoggedIn && (
        <RewardButton onClick={() => setShowRewardAd(true)} />
      )}
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
            <button onClick={() => { setShowUpgradePopup(false); openSubscription(); }} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0">Go Pro</button>
            <button onClick={() => setShowUpgradePopup(false)} className="p-1 shrink-0"><XIcon /></button>
          </div>
        </div>
      )}
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
