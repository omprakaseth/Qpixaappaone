import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useAppState } from '@/context/AppContext';
import BottomNav from '@/components/BottomNav';
import HomeScreen from '@/screens/HomeScreen';
import MarketplaceScreen from '@/screens/MarketplaceScreen';
import StudioScreen from '@/screens/StudioScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import ProfileScreen from '@/screens/ProfileScreen';
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
import { Post } from '@/context/AppContext';

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path === '/market') return 'discover';
    if (path === '/studio') return 'studio';
    if (path === '/favorites') return 'favorites';
    if (path === '/profile') return 'profile';
    return 'home';
  }, [location.pathname]);

  const { posts, isPro, isLoggedIn } = useAppState();
  const { settings: adSettings } = useAdSettings();
  const [showRewardAd, setShowRewardAd] = useState(false);
  const [upgradePopupShown, setUpgradePopupShown] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const upgradeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Show upgrade popup once on app load for free users
  useEffect(() => {
    if (!isPro && isLoggedIn && !upgradePopupShown) {
      const timer = setTimeout(() => {
        setShowUpgradePopup(true);
        setUpgradePopupShown(true);
        // Auto-hide after 5 seconds
        upgradeTimerRef.current = setTimeout(() => setShowUpgradePopup(false), 5000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPro, isLoggedIn, upgradePopupShown]);
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

  useEffect(() => {
    if ('visualViewport' in window && window.visualViewport) {
      const vv = window.visualViewport;
      const handleResize = () => {
        setKeyboardVisible(window.innerHeight - vv.height > 150);
      };
      vv.addEventListener('resize', handleResize);
      return () => vv.removeEventListener('resize', handleResize);
    }
  }, []);

  // --- History-based back navigation ---
  const pushHistory = useCallback((state: string) => {
    window.history.pushState({ overlay: state }, '');
  }, []);

  const closeOverlay = useCallback((setter: (v: any) => void, value: any = null) => {
    setter(value);
  }, []);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Close overlays in priority order (topmost first)
      if (showAuth) { setShowAuth(false); return; }
      if (showCreatePost) { setShowCreatePost(false); setCreatePostData({}); return; }
      if (selectedPost) { setSelectedPost(null); return; }
      if (viewingCreator) { setViewingCreator(null); return; }
      if (showSettings) { setShowSettings(false); return; }
      if (showSubscription) { setShowSubscription(false); return; }
      // If on a non-home tab, go back to home
      if (activeTab !== 'home') { navigate('/'); return; }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showAuth, showCreatePost, showSettings, showSubscription, viewingCreator, selectedPost, activeTab]);

  // Push history when overlays open
  const openPost = useCallback((post: Post) => {
    pushHistory('post');
    setSelectedPost(post);
  }, [pushHistory]);

  const openCreatePost = useCallback(() => {
    pushHistory('createPost');
    setShowCreatePost(true);
  }, [pushHistory]);

  const openSettings = useCallback(() => {
    pushHistory('settings');
    setShowSettings(true);
  }, [pushHistory]);

  const openSubscription = useCallback(() => {
    pushHistory('subscription');
    setShowSubscription(true);
  }, [pushHistory]);

  const openAuth = useCallback((mode: 'login' | 'signup') => {
    pushHistory('auth');
    setAuthMode(mode);
    setShowAuth(true);
  }, [pushHistory]);

  const openCreator = useCallback((creatorName: string) => {
    pushHistory('creator');
    setSelectedPost(null);
    setViewingCreator(creatorName);
  }, [pushHistory]);

  const scrollToTopRef = useRef<() => void>(() => {});
  const handleTabChange = useCallback((tab: string) => {
    if (tab === activeTab) {
      scrollToTopRef.current();
      return;
    }
    const paths: Record<string, string> = {
      home: '/',
      discover: '/market',
      studio: '/studio',
      favorites: '/favorites',
      profile: '/profile'
    };
    navigate(paths[tab]);
  }, [activeTab, navigate]);

  // Close helpers that go back in history
  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  const smartScrollEnabled = activeTab === 'home' || activeTab === 'discover' || activeTab === 'favorites' || activeTab === 'profile';
  const { visible: navVisible, scrollRef } = useSmartScroll(smartScrollEnabled);

  // Keep scrollToTop in sync with scrollRef
  useEffect(() => {
    scrollToTopRef.current = () => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }, [scrollRef]);

  const handleUsePrompt = useCallback((prompt: string) => {
    setStudioPrompt(prompt);
    setSelectedPost(null);
    navigate('/studio');
  }, [navigate]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {activeTab === 'home' && (
              <HomeScreen
                scrollRef={scrollRef as React.RefObject<HTMLDivElement>}
                onPostTap={openPost}
                onCreatePost={openCreatePost}
                onGetPro={openSubscription}
                onCreatorTap={openCreator}
                adSettings={adSettings}
                isPro={isPro}
              />
            )}
            {activeTab === 'discover' && (
              <MarketplaceScreen
                scrollRef={scrollRef as React.RefObject<HTMLDivElement>}
                onUsePrompt={handleUsePrompt}
                onOpenAuth={openAuth}
                onCreatorTap={openCreator}
              />
            )}
            {activeTab === 'studio' && (
              isLoggedIn ? (
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
              )
            )}
            {activeTab === 'favorites' && <FavoritesScreen scrollRef={scrollRef as React.RefObject<HTMLDivElement>} onOpenAuth={openAuth} />}
            {activeTab === 'profile' && <ProfileScreen scrollRef={scrollRef as React.RefObject<HTMLDivElement>} onOpenSettings={openSettings} onOpenAuth={openAuth} onPostTap={openPost} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} visible={navVisible && !keyboardVisible} />

      {/* Banner Ad - free users only */}
      {adSettings.enabled && adSettings.placementBanner && !isPro && navVisible && (
        <BannerAd publisherId={adSettings.adsensePublisherId} slotId={adSettings.adsenseBannerSlot} />
      )}

      {/* Reward Ad Button - logged in free users, positioned to avoid scroll-to-top */}
      {adSettings.enabled && adSettings.placementReward && !isPro && isLoggedIn && (
        <RewardButton onClick={() => setShowRewardAd(true)} />
      )}

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        open={showRewardAd}
        onClose={() => {
          setShowRewardAd(false);
          // After watching ad, briefly show upgrade popup then auto-hide
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
      {showUpgradePopup && !isPro && (
        <div className="fixed top-16 left-4 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Upgrade to Pro ✨</p>
              <p className="text-xs text-muted-foreground truncate">Unlimited generations, no ads, priority access</p>
            </div>
            <button
              onClick={() => {
                setShowUpgradePopup(false);
                clearTimeout(upgradeTimerRef.current);
                openSubscription();
              }}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0"
            >
              Go Pro
            </button>
            <button
              onClick={() => {
                setShowUpgradePopup(false);
                clearTimeout(upgradeTimerRef.current);
              }}
              className="p-1 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      )}

      {selectedPost && (
        <PostDetail
          post={selectedPost}
          onBack={goBack}
          onUsePrompt={handleUsePrompt}
          onCreatorTap={openCreator}
        />
      )}

      {viewingCreator && (
        <CreatorProfileOverlay
          creatorName={viewingCreator}
          posts={posts}
          onBack={goBack}
          onPostTap={(post) => {
            // Don't clear creator — just open post on top of it
            openPost(post);
          }}
        />
      )}

      {showCreatePost && (
        <CreatePost
          onBack={goBack}
          initialImageUrl={createPostData.imageUrl}
          initialPrompt={createPostData.prompt}
        />
      )}
      {showSettings && <SettingsScreen onBack={goBack} />}
      {showSubscription && <SubscriptionScreen onBack={goBack} />}
      {showAuth && <AuthScreen onBack={goBack} initialMode={authMode} />}
    </div>
  );
}

export default function Index() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
