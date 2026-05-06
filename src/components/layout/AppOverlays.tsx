import React from 'react';
import PostDetail from '@/screens/PostDetail';
import CreatorProfileOverlay from '@/components/profile/CreatorProfileOverlay';
import CreatePost from '@/screens/CreatePost';
import SettingsScreen from '@/screens/SettingsScreen';
import SubscriptionScreen from '@/screens/SubscriptionScreen';
import AuthScreen from '@/screens/AuthScreen';
import RewardedAdModal from '@/components/ads/RewardedAdModal';
import { Post } from '@/context/AppContext';

interface AppOverlaysProps {
  selectedPost: Post | null;
  onClosePost: () => void;
  onUsePrompt: (prompt: string) => void;
  onCreatorTap: (name: string, id?: string) => void;
  viewingCreator: string | null;
  onCloseCreator: () => void;
  posts: Post[];
  showCreatePost: boolean;
  onCloseCreatePost: () => void;
  createPostData: { imageUrl?: string; prompt?: string };
  showSettings: boolean;
  onCloseSettings: () => void;
  showSubscription: boolean;
  onCloseSubscription: () => void;
  showAuth: boolean;
  initialAuthMode: 'login' | 'signup';
  onCloseAuth: () => void;
}

export const AppOverlays: React.FC<AppOverlaysProps> = ({
  selectedPost, onClosePost, onUsePrompt, onCreatorTap,
  viewingCreator, onCloseCreator, posts,
  showCreatePost, onCloseCreatePost, createPostData,
  showSettings, onCloseSettings,
  showSubscription, onCloseSubscription,
  showAuth, initialAuthMode, onCloseAuth
}) => {
  return (
    <>
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          onBack={onClosePost}
          onUsePrompt={onUsePrompt}
          onCreatorTap={onCreatorTap}
        />
      )}

      {viewingCreator && (
        <CreatorProfileOverlay
          creatorName={viewingCreator}
          posts={posts}
          onBack={onCloseCreator}
          onPostTap={(post) => onCreatorTap(post.creator_id || '', post.creator_id)}
        />
      )}

      {showCreatePost && (
        <CreatePost
          onBack={onCloseCreatePost}
          initialImageUrl={createPostData.imageUrl}
          initialPrompt={createPostData.prompt}
        />
      )}
      
      {showSettings && <SettingsScreen onBack={onCloseSettings} />}
      {showSubscription && <SubscriptionScreen onBack={onCloseSubscription} />}
      {showAuth && <AuthScreen onBack={onCloseAuth} initialMode={initialAuthMode} />}
    </>
  );
};
