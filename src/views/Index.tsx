"use client";

import React, { useMemo } from 'react';
import HomeScreen from '@/screens/HomeScreen';
import MarketplaceScreen from '@/screens/MarketplaceScreen';
import StudioScreen from '@/screens/StudioScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ShortsScreen from '@/screens/ShortsScreen';
import NotificationScreen from '@/screens/NotificationScreen';
import PostDetail from '@/screens/PostDetail';
import CreatorProfileOverlay from '@/components/profile/CreatorProfileOverlay';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useSmartScroll } from '@/hooks/useSmartScroll';
import { useAppState } from '@/context/AppContext';
import { AnimatePresence, motion } from 'motion/react';
import BottomNav from '@/components/BottomNav';

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const path = location.pathname;
  const { posts } = useAppState();
  
  // Determine active tab based on path
  const getActiveTab = () => {
    if (path === '/' || path.startsWith('/prompt/')) return 'home';
    if (path === '/market') return 'market';
    if (path === '/shorts') return 'shorts';
    if (path === '/studio') return 'studio';
    if (path === '/notifications') return 'notifications';
    if (path === '/favorites') return 'favorites';
    if (path === '/profile') return 'profile';
    if (path.startsWith('/creator/')) return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();
  const { scrollRef, visible: navVisible } = useSmartScroll(activeTab === 'home' || activeTab === 'market');

  const selectedPost = useMemo(() => {
    if (path.startsWith('/prompt/') && id) {
      return posts.find(p => p.id === id);
    }
    return null;
  }, [path, id, posts]);

  const selectedCreator = useMemo(() => {
    if (path.startsWith('/creator/') && id) {
      // id is creatorName in this case
      return id;
    }
    return null;
  }, [path, id]);

  const openPost = (post: any) => navigate(`/prompt/${post.id}`);
  const openCreator = (name: string) => navigate(`/creator/${name}`);
  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <main className="relative h-full">
        {activeTab === 'home' && (
          <HomeScreen 
            scrollRef={scrollRef} 
            onPostTap={openPost}
            onCreatorTap={openCreator}
            onCreatePost={() => navigate('/studio')}
            onGetPro={() => {}}
          />
        )}
        {activeTab === 'market' && (
          <MarketplaceScreen 
            scrollRef={scrollRef}
            onCreatorTap={openCreator}
          />
        )}
        {activeTab === 'shorts' && <ShortsScreen />}
        {activeTab === 'studio' && <StudioScreen />}
        {activeTab === 'notifications' && <NotificationScreen />}
        {activeTab === 'favorites' && <FavoritesScreen scrollRef={scrollRef} />}
        {activeTab === 'profile' && <ProfileScreen scrollRef={scrollRef} onOpenSettings={() => {}} />}
      </main>

      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <PostDetail 
              post={selectedPost} 
              onBack={goBack}
              onUsePrompt={(p) => {
                navigate('/studio');
                // Handle prompt transfer if needed
              }}
            />
          </motion.div>
        )}

        {selectedCreator && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <CreatorProfileOverlay 
              creatorName={selectedCreator}
              posts={posts}
              onBack={goBack}
              onPostTap={openPost}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav 
        activeTab={activeTab} 
        visible={navVisible} 
        onTabChange={(tab) => {
          if (tab === 'home') navigate('/');
          else navigate(`/${tab}`);
        }}
      />
    </div>
  );
};

export default Index;
