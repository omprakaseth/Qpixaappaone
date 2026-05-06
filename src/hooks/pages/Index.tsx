import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import BannerAd from '@/components/ads/BannerAd';
import RewardButton from '@/components/ads/RewardButton';
import RewardedAdModal from '@/components/ads/RewardedAdModal';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { DesktopHeader } from '@/components/layout/DesktopHeader';
import { DesktopRightPanel } from '@/components/layout/DesktopRightPanel';
import { useSmartScroll } from '@/hooks/useSmartScroll';
import { useAdSettings } from '@/hooks/useAdSettings';
import { Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generatePromptMeta } from '@/lib/seo-utils';
import { useNavigationState } from '@/hooks/useNavigationState';
import { AppOverlays } from '@/components/layout/AppOverlays';

function AppShell() {
  const {
    isMobile, activeTab, selectedPost, setSelectedPost,
    viewingCreator, setViewingCreator, openPost, openCreator,
    handleTabChange, lastBackPress, setLastBackPress, tabRootPaths
  } = useNavigationState();

  const location = useLocation();
  const navigate = useNavigate();
  const { posts, isPro, isLoggedIn, profile } = useAppState();
  const { settings: adSettings } = useAdSettings();
  const { toast } = useToast();

  const [showRewardAd, setShowRewardAd] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [createPostData, setCreatePostData] = useState<{ imageUrl?: string; prompt?: string }>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [studioPrompt, setStudioPrompt] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if ('visualViewport' in window && window.visualViewport) {
      const vv = window.visualViewport;
      const handleResize = () => setKeyboardVisible(window.innerHeight - vv.height > 150);
      vv.addEventListener('resize', handleResize);
      return () => vv.removeEventListener('resize', handleResize);
    }
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setSelectedPost(null);
      setViewingCreator(null);
      setShowAuth(false);
      setShowCreatePost(false);
      setShowSettings(false);
      setShowSubscription(false);
    }
  }, [setSelectedPost, setViewingCreator]);

  useEffect(() => {
    const handlePopState = () => {
      if (showAuth) { setShowAuth(false); return; }
      if (showCreatePost) { setShowCreatePost(false); return; }
      if (selectedPost) { setSelectedPost(null); return; }
      if (viewingCreator) { setViewingCreator(null); return; }
      if (showSettings) { setShowSettings(false); return; }
      if (showSubscription) { setShowSubscription(false); return; }
      
      const rootPath = tabRootPaths[activeTab] || '/';
      if (location.pathname === rootPath) {
        const now = Date.now();
        if (now - lastBackPress < 2000) return;
        setLastBackPress(now);
        toast({ description: "Press back again to exit" });
        window.history.pushState({ guard: true }, '');
      } else {
        navigate(rootPath, { replace: true });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showAuth, showCreatePost, showSettings, showSubscription, viewingCreator, selectedPost, activeTab, lastBackPress, toast, navigate, location.pathname, tabRootPaths, setLastBackPress, setSelectedPost, setViewingCreator]);

  const smartScrollEnabled = ['home', 'discover', 'favorites', 'profile'].includes(activeTab);
  const { visible: navVisible, scrollRef } = useSmartScroll(smartScrollEnabled);

  const seoMeta = useMemo(() => {
    if (selectedPost) {
      const meta = generatePromptMeta({ prompt: selectedPost.prompt, category: selectedPost.category, tags: selectedPost.tags });
      return { ...meta, image: selectedPost.imageUrl, canonical: `/prompt/${selectedPost.id}` };
    }
    return { title: activeTab.toUpperCase(), canonical: location.pathname };
  }, [selectedPost, activeTab, location.pathname]);

  const handleUsePrompt = useCallback((prompt: string) => {
    setStudioPrompt(prompt);
    setSelectedPost(null);
    handleTabChange('studio');
  }, [handleTabChange, setSelectedPost]);

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-[#09090b] flex">
      <SEO title={seoMeta.title} image={seoMeta.image} canonical={seoMeta.canonical} />
      
      {!isMobile && (
        <DesktopSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          onAuth={(m) => { setAuthMode(m); setShowAuth(true); }} 
          isLoggedIn={isLoggedIn} 
        />
      )}

      <div className={cn(
        "flex-1 flex flex-col min-w-0 h-full relative", 
        !isMobile && "md:ml-[240px] lg:mr-[320px]"
      )}>
        {!isMobile && (
          <DesktopHeader 
            onSearch={() => {}} 
            onUpload={() => setShowCreatePost(true)} 
            onNotifications={() => handleTabChange('notifications')} 
          />
        )}
        
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0">
            {activeTab === 'home' && (
              <HomeScreen 
                scrollRef={scrollRef} 
                onPostTap={openPost} 
                onCreatorTap={openCreator} 
                navVisible={navVisible} 
                adSettings={adSettings} 
                isPro={isPro} 
              />
            )}
            {activeTab === 'discover' && (
              <MarketplaceScreen 
                scrollRef={scrollRef} 
                onUsePrompt={handleUsePrompt} 
                onCreatorTap={openCreator} 
                navVisible={navVisible} 
              />
            )}
            {activeTab === 'shorts' && (
              <ShortsScreen onCreatorTap={openCreator} onBack={() => handleTabChange('home')} />
            )}
            {activeTab === 'studio' && (
              isLoggedIn ? (
                <StudioScreen 
                  initialPrompt={studioPrompt} 
                  onPublish={(img, p) => { 
                    setCreatePostData({ imageUrl: img, prompt: p }); 
                    setShowCreatePost(true); 
                  }} 
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                  <p>Please log in to use Studio</p>
                </div>
              )
            )}
            {activeTab === 'notifications' && <NotificationScreen />}
            {activeTab === 'favorites' && <FavoritesScreen scrollRef={scrollRef} navVisible={navVisible} />}
            {activeTab === 'profile' && (
              <ProfileScreen 
                scrollRef={scrollRef} 
                onOpenSettings={() => setShowSettings(true)} 
                onPostTap={openPost} 
                navVisible={navVisible} 
              />
            )}
          </div>
        </div>
        
        {isMobile && (
          <BottomNav 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            visible={navVisible && !keyboardVisible} 
          />
        )}
      </div>
      
      {!isMobile && <DesktopRightPanel />}
      
      <AppOverlays
        selectedPost={selectedPost} 
        onClosePost={goBack} 
        onUsePrompt={handleUsePrompt} 
        onCreatorTap={openCreator}
        viewingCreator={viewingCreator} 
        onCloseCreator={goBack} 
        posts={posts}
        showCreatePost={showCreatePost} 
        onCloseCreatePost={() => setShowCreatePost(false)} 
        createPostData={createPostData}
        showSettings={showSettings} 
        onCloseSettings={() => setShowSettings(false)}
        showSubscription={showSubscription} 
        onCloseSubscription={() => setShowSubscription(false)}
        showAuth={showAuth} 
        initialAuthMode={authMode} 
        onCloseAuth={() => setShowAuth(false)}
      />
      
      <RewardedAdModal 
        open={showRewardAd} 
        onClose={() => { setShowRewardAd(false); setShowUpgradePopup(true); }} 
        rewardCredits={adSettings.rewardCredits} 
        publisherId={adSettings.adsensePublisherId} 
      />
      
      {adSettings.enabled && adSettings.placementReward && !isPro && isLoggedIn && (
        <RewardButton onClick={() => setShowRewardAd(true)} />
      )}
    </div>
  );
}

export default function Index() { return <AppShell />; }
