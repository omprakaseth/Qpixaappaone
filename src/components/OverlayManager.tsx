"use client";
import React, { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@/context/AppContext';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Post } from '@/types';

// Regular imports instead of dynamic to avoid moduleId errors in this specific environment
import PostDetail from '@/screens/PostDetail';
import CreatePost from '@/screens/CreatePost';
import CreatorProfileOverlay from '@/components/profile/CreatorProfileOverlay';
import SettingsScreen from '@/screens/SettingsScreen';
import SubscriptionScreen from '@/screens/SubscriptionScreen';
import AuthScreen from '@/screens/AuthScreen';

export default function OverlayManager() {
  const router = useRouter();
  const { activePath: pathname, navigateBack } = useAppNavigation();
  const { 
    selectedPost, setSelectedPost, 
    viewingCreator, setViewingCreator,
    showCreatePost, setShowCreatePost,
    createPostData,
    showSettings, setShowSettings,
    showSubscription, setShowSubscription,
    showAuth, setShowAuth,
    authMode,
    posts, fetchPostById
  } = useAppState();

  const handleUsePrompt = useCallback((prompt: string) => {
    setSelectedPost(null);
    router.push(`/studio?prompt=${encodeURIComponent(prompt)}`);
  }, [router, setSelectedPost]);

  const goBack = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const pathParts = pathname.split('/').filter(Boolean);
    const isOverlayRoute = pathParts[0] === 'prompt' || pathParts[0] === 'creator';
    
    if (isOverlayRoute) {
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
  }, [pathname, router, showSettings, showSubscription, showAuth, showCreatePost, setShowSettings, setShowSubscription, setShowAuth, setShowCreatePost, navigateBack]);

  const openPost = useCallback((post: Post) => {
    if (selectedPost?.id === post.id) return;
    setSelectedPost(post);
    router.push(`/prompt/${post.id}`, { scroll: false });
  }, [router, setSelectedPost, selectedPost]);

  const openCreator = useCallback((creatorName: string, creatorId?: string) => {
    const targetId = creatorId || creatorName;
    if (viewingCreator === targetId) return;
    setViewingCreator(targetId);
    router.push(`/creator/${targetId}`, { scroll: false });
  }, [router, setViewingCreator, viewingCreator]);

  // Sync Logic
  const isSyncing = useRef(false);
  useEffect(() => {
    if (isSyncing.current) return;
    
    const sync = async () => {
      isSyncing.current = true;
      const pathParts = pathname.split('/').filter(Boolean);
      const urlType = pathParts[0];
      const urlId = pathParts[1];

      if (urlType === 'prompt' && urlId) {
        if (selectedPost?.id !== urlId) {
          const post = posts.find(p => p.id === urlId);
          if (post) {
            setSelectedPost(post);
          } else {
            const fetched = await fetchPostById(urlId);
            if (fetched) setSelectedPost(fetched);
          }
        }
      } else if (urlType === 'creator' && urlId) {
        if (viewingCreator !== urlId) {
          setViewingCreator(urlId);
        }
      } else {
        // Clear overlays if not on their routes and not in a manual modal state
        const hasManualModal = showSettings || showSubscription || showAuth || showCreatePost;
        if (!hasManualModal) {
          if (selectedPost) setSelectedPost(null);
          if (viewingCreator) setViewingCreator(null);
        }
      }
      isSyncing.current = false;
    };
    
    sync();
  }, [pathname, posts, fetchPostById, showSettings, showSubscription, showAuth, showCreatePost]);

  return (
    <>
      <AnimatePresence mode="wait">
        {selectedPost && (
          <motion.div
            key="post-detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
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

      <AnimatePresence mode="wait">
        {viewingCreator && (
          <motion.div
            key="creator-overlay"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100]"
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

      <AnimatePresence mode="wait">
        {showCreatePost && (
          <motion.div
            key="create-post-overlay"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[110]"
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
    </>
  );
}
