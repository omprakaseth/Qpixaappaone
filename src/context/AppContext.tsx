import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

// We redefine Post interface here to match Supabase schema
export interface Post {
  id: string;
  title: string;
  imageUrl: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    initials: string;
    isVerified?: boolean;
  };
  prompt: string;
  tags: string[];
  category: string;
  style: string;
  aspectRatio: string;
  views: number;
  likes: number;
  saves: number;
  comments: number;
  createdAt: string;
  isLiked: boolean;
  isSaved: boolean;
}

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  credits: number;
  is_banned: boolean;
  is_verified: boolean;
  subscription_plan: string;
  created_at: string;
  cover_url: string | null;
}

interface AppState {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoggedIn: boolean;
  isPro: boolean;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  addPost: (post: Post) => void;
  deletePost: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  fetchPosts: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [credits, setCredits] = useState(40);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchPosts = async () => {
    try {
      // Fetch posts with creator profile
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:creator_id (
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        const formattedPosts: Post[] = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          imageUrl: p.image_url,
          creator: {
            id: p.creator_id,
            name: p.profiles?.display_name || 'Unknown',
            username: p.profiles?.username ? `@${p.profiles.username}` : '@user',
            avatar: p.profiles?.avatar_url || '',
            initials: (p.profiles?.display_name || 'U').substring(0, 2).toUpperCase(),
            isVerified: p.profiles?.is_verified || false,
          },
          prompt: p.prompt,
          tags: p.tags || [],
          category: p.category || 'General',
          style: p.style || 'Standard',
          aspectRatio: p.aspect_ratio || '1:1',
          views: p.views || 0,
          likes: p.likes || 0,
          saves: p.saves || 0,
          comments: p.comments || 0,
          createdAt: p.created_at,
          isLiked: false, // Would need a separate query to check if current user liked
          isSaved: false, // Would need a separate query to check if current user saved
        }));
        if (formattedPosts.length === 0) {
          // Fallback mock data for demonstration purposes
          setPosts([
            {
              id: 'mock-1',
              title: 'Cyberpunk City',
              imageUrl: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=600&h=800&fit=crop',
              creator: { id: 'mock-user-1', name: 'Neon Dreams', username: '@neon', avatar: '', initials: 'ND', isVerified: true },
              prompt: 'A futuristic cyberpunk city at night with neon lights and flying cars',
              tags: ['cyberpunk', 'city', 'neon'],
              category: 'Trending',
              style: 'Digital Art',
              aspectRatio: '3:4',
              views: 1200,
              likes: 340,
              saves: 45,
              comments: 12,
              createdAt: new Date().toISOString(),
              isLiked: false,
              isSaved: false,
            },
            {
              id: 'mock-2',
              title: 'Ethereal Portrait',
              imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
              creator: { id: 'mock-user-2', name: 'Artistic Soul', username: '@artsoul', avatar: '', initials: 'AS' },
              prompt: 'Ethereal portrait of a woman with glowing flowers in her hair',
              tags: ['portrait', 'ethereal', 'flowers'],
              category: 'Portraits',
              style: 'Photography',
              aspectRatio: '3:4',
              views: 850,
              likes: 210,
              saves: 30,
              comments: 8,
              createdAt: new Date().toISOString(),
              isLiked: false,
              isSaved: false,
            }
          ]);
        } else {
          setPosts(formattedPosts);
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      // Fallback mock data on error
      setPosts([
        {
          id: 'mock-1',
          title: 'Cyberpunk City',
          imageUrl: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=600&h=800&fit=crop',
          creator: { id: 'mock-user-1', name: 'Neon Dreams', username: '@neon', avatar: '', initials: 'ND', isVerified: true },
          prompt: 'A futuristic cyberpunk city at night with neon lights and flying cars',
          tags: ['cyberpunk', 'city', 'neon'],
          category: 'Trending',
          style: 'Digital Art',
          aspectRatio: '3:4',
          views: 1200,
          likes: 340,
          saves: 45,
          comments: 12,
          createdAt: new Date().toISOString(),
          isLiked: false,
          isSaved: false,
        },
        {
          id: 'mock-2',
          title: 'Ethereal Portrait',
          imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          creator: { id: 'mock-user-2', name: 'Artistic Soul', username: '@artsoul', avatar: '', initials: 'AS' },
          prompt: 'Ethereal portrait of a woman with glowing flowers in her hair',
          tags: ['portrait', 'ethereal', 'flowers'],
          category: 'Portraits',
          style: 'Photography',
          aspectRatio: '3:4',
          views: 850,
          likes: 210,
          saves: 30,
          comments: 8,
          createdAt: new Date().toISOString(),
          isLiked: false,
          isSaved: false,
        }
      ]);
      throw err;
    }
  };

  const fetchProfile = async (currentUser: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    if (data) {
      setProfile(data as Profile);
      setCredits(data.credits);
    } else if (error?.code === 'PGRST116') {
      // Profile doesn't exist yet — create it
      const username = currentUser?.user_metadata?.username || currentUser?.email?.split('@')[0] || 'user';
      const displayName = currentUser?.user_metadata?.display_name || username;
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: currentUser.id, username, display_name: displayName })
        .select()
        .single();
      if (newProfile) {
        setProfile(newProfile as Profile);
        setCredits(newProfile.credits);
      }
    }
  };

  useEffect(() => {
    fetchPosts().catch(console.error); // Fetch posts on mount

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchProfile(sess.user);
      } else {
        setProfile(null);
        setCredits(40);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleLike = async (id: string) => {
    if (!user) return; // Must be logged in
    
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p
    ));

    try {
      const post = posts.find(p => p.id === id);
      if (!post) return;

      if (post.isLiked) {
        // Unlike
        await supabase.from('post_likes').delete().match({ post_id: id, user_id: user.id });
        // We skip server-side increment/decrement for now as the RPC doesn't exist in types
      } else {
        // Like
        await supabase.from('post_likes').insert({ post_id: id, user_id: user.id });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      toast.error('Failed to update like status');
      // Revert on error
      setPosts(prev => prev.map(p =>
        p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p
      ));
    }
  };

  const toggleSave = async (id: string) => {
    if (!user) return; // Must be logged in
    
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, isSaved: !p.isSaved, saves: p.isSaved ? p.saves - 1 : p.saves + 1 } : p
    ));

    try {
      const post = posts.find(p => p.id === id);
      if (!post) return;

      if (post.isSaved) {
        // Unsave
        await supabase.from('favorites').delete().match({ image_url: post.imageUrl, user_id: user.id });
      } else {
        // Save
        await supabase.from('favorites').insert({ image_url: post.imageUrl, prompt: post.prompt, user_id: user.id });
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      toast.error('Failed to update save status');
      // Revert on error
      setPosts(prev => prev.map(p =>
        p.id === id ? { ...p, isSaved: !p.isSaved, saves: p.isSaved ? p.saves - 1 : p.saves + 1 } : p
      ));
    }
  };

  const addPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const deletePost = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id).eq('creator_id', user.id);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  const isLoggedIn = !!user;
  const isPro = profile?.subscription_plan === 'pro';

  return (
    <AppContext.Provider value={{
      posts, setPosts, user, session, profile, isLoggedIn, isPro, credits, setCredits,
      toggleLike, toggleSave, addPost, deletePost, signOut, refreshProfile, fetchPosts
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
