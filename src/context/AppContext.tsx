import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isPlaceholder } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { usePWAInstall } from '@/hooks/usePWAInstall';

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
  isShort: boolean;
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
  role?: string;
  created_at: string;
  cover_url: string | null;
}

export interface UploadingPost {
  id: string;
  title: string;
  prompt: string;
  tags: string;
  type: 'post' | 'short';
  file: File | null;
  previewUrl: string | null;
  progress: number;
  status: 'uploading' | 'error' | 'success';
  error?: string;
}

interface AppState {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  initialLoading: boolean;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoggedIn: boolean;
  isPro: boolean;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  uploadingPost: UploadingPost | null;
  startUpload: (data: Omit<UploadingPost, 'id' | 'progress' | 'status'>) => Promise<void>;
  retryUpload: () => Promise<void>;
  clearUpload: () => void;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  addPost: (post: Post) => void;
  deletePost: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  fetchPosts: () => Promise<void>;
  deferredPrompt: any;
  installApp: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    title: 'Cyberpunk Cityscape',
    imageUrl: 'https://picsum.photos/seed/cyberpunk/800/1000',
    creator: {
      id: 'system',
      name: 'Qpixa AI',
      username: '@qpixa',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qpixa',
      initials: 'QA',
      isVerified: true,
    },
    prompt: 'A futuristic cyberpunk city with neon lights, flying cars, and rainy streets, 8k resolution, cinematic lighting',
    tags: ['cyberpunk', 'city', 'neon'],
    category: 'Trending',
    style: 'Cyberpunk',
    aspectRatio: '4:5',
    views: 1240,
    likes: 450,
    saves: 89,
    comments: 12,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  },
  {
    id: 'mock-2',
    title: 'Ethereal Forest',
    imageUrl: 'https://picsum.photos/seed/forest/800/1000',
    creator: {
      id: 'system',
      name: 'Nature Bot',
      username: '@nature',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nature',
      initials: 'NB',
      isVerified: true,
    },
    prompt: 'A magical forest with glowing plants and mystical creatures, soft sunlight filtering through trees',
    tags: ['nature', 'fantasy', 'magic'],
    category: 'Fantasy',
    style: 'Digital Art',
    aspectRatio: '4:5',
    views: 850,
    likes: 320,
    saves: 45,
    comments: 8,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  },
  {
    id: 'mock-3',
    title: 'Space Explorer',
    imageUrl: 'https://picsum.photos/seed/space/800/1000',
    creator: {
      id: 'system',
      name: 'Cosmos',
      username: '@cosmos',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmos',
      initials: 'CS',
      isVerified: true,
    },
    prompt: 'Astronaut floating in deep space near a colorful nebula, stars and galaxies in background',
    tags: ['space', 'astronaut', 'nebula'],
    category: 'Sci-Fi',
    style: 'Photorealistic',
    aspectRatio: '4:5',
    views: 2100,
    likes: 780,
    saves: 120,
    comments: 25,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  },
  {
    id: 'mock-4',
    title: 'Ancient Temple',
    imageUrl: 'https://picsum.photos/seed/temple/800/1000',
    creator: {
      id: 'system',
      name: 'History Buff',
      username: '@history',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=history',
      initials: 'HB',
      isVerified: false,
    },
    prompt: 'Overgrown ancient temple ruins in a jungle, sunlight breaking through canopy, cinematic atmosphere',
    tags: ['history', 'temple', 'jungle'],
    category: 'Architecture',
    style: 'Cinematic',
    aspectRatio: '4:5',
    views: 1560,
    likes: 540,
    saves: 67,
    comments: 15,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  },
  {
    id: 'mock-5',
    title: 'Vibrant Abstract',
    imageUrl: 'https://picsum.photos/seed/abstract/800/1000',
    creator: {
      id: 'system',
      name: 'Artistic Soul',
      username: '@art',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=art',
      initials: 'AS',
      isVerified: true,
    },
    prompt: 'Swirling colors of paint in water, abstract fluid art, vibrant pink and blue, high contrast',
    tags: ['abstract', 'art', 'vibrant'],
    category: 'Art',
    style: 'Abstract',
    aspectRatio: '4:5',
    views: 3200,
    likes: 1100,
    saves: 230,
    comments: 45,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  },
  {
    id: 'mock-6',
    title: 'Mountain Peak',
    imageUrl: 'https://picsum.photos/seed/mountain/800/1000',
    creator: {
      id: 'system',
      name: 'Explorer',
      username: '@explorer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=explorer',
      initials: 'EX',
      isVerified: false,
    },
    prompt: 'Snow-capped mountain peaks at sunrise, orange and purple sky, reflection in a calm lake',
    tags: ['mountain', 'nature', 'landscape'],
    category: 'Nature',
    style: 'Photography',
    aspectRatio: '4:5',
    views: 1890,
    likes: 670,
    saves: 95,
    comments: 18,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  },
  {
    id: 'mock-7',
    title: 'Neon Samurai',
    imageUrl: 'https://picsum.photos/seed/samurai/800/1000',
    creator: {
      id: 'system',
      name: 'Ronin',
      username: '@ronin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ronin',
      initials: 'RN',
      isVerified: true,
    },
    prompt: 'Futuristic samurai standing in a rainy Tokyo street, neon katana glowing, cyberpunk aesthetic',
    tags: ['samurai', 'cyberpunk', 'neon'],
    category: 'Trending',
    style: 'Anime',
    aspectRatio: '4:5',
    views: 4500,
    likes: 1800,
    saves: 450,
    comments: 89,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  },
  {
    id: 'mock-8',
    title: 'Underwater World',
    imageUrl: 'https://picsum.photos/seed/ocean/800/1000',
    creator: {
      id: 'system',
      name: 'Diver',
      username: '@diver',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diver',
      initials: 'DV',
      isVerified: false,
    },
    prompt: 'Coral reef teeming with colorful fish, sunlight rays piercing through water surface, clear blue ocean',
    tags: ['ocean', 'underwater', 'nature'],
    category: 'Nature',
    style: 'Photorealistic',
    aspectRatio: '4:5',
    views: 1340,
    likes: 420,
    saves: 56,
    comments: 10,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  },
  {
    id: 'mock-9',
    title: 'Steampunk Airship',
    imageUrl: 'https://picsum.photos/seed/steampunk/800/1000',
    creator: {
      id: 'system',
      name: 'Inventor',
      username: '@inventor',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=inventor',
      initials: 'IV',
      isVerified: true,
    },
    prompt: 'Giant steampunk airship flying through golden clouds, brass gears and steam pipes, Victorian style',
    tags: ['steampunk', 'airship', 'fantasy'],
    category: 'Fantasy',
    style: 'Digital Art',
    aspectRatio: '4:5',
    views: 2700,
    likes: 950,
    saves: 180,
    comments: 32,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  },
  {
    id: 'mock-10',
    title: 'Desert Oasis',
    imageUrl: 'https://picsum.photos/seed/desert/800/1000',
    creator: {
      id: 'system',
      name: 'Nomad',
      username: '@nomad',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nomad',
      initials: 'NM',
      isVerified: false,
    },
    prompt: 'Lush green oasis in the middle of a vast sand desert, palm trees and small pond, sunset lighting',
    tags: ['desert', 'oasis', 'nature'],
    category: 'Landscape',
    style: 'Cinematic',
    aspectRatio: '4:5',
    views: 1100,
    likes: 380,
    saves: 42,
    comments: 7,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  },
  {
    id: 'mock-11',
    title: 'Futuristic Lab',
    imageUrl: 'https://picsum.photos/seed/lab/800/1000',
    creator: {
      id: 'system',
      name: 'Scientist',
      username: '@science',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=science',
      initials: 'SC',
      isVerified: true,
    },
    prompt: 'Clean white futuristic laboratory with holographic displays and advanced technology, blue lighting',
    tags: ['science', 'future', 'technology'],
    category: 'Sci-Fi',
    style: 'Minimalist',
    aspectRatio: '4:5',
    views: 1950,
    likes: 610,
    saves: 88,
    comments: 21,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  },
  {
    id: 'mock-12',
    title: 'Cozy Cabin',
    imageUrl: 'https://picsum.photos/seed/cabin/800/1000',
    creator: {
      id: 'system',
      name: 'Coziness',
      username: '@cozy',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cozy',
      initials: 'CZ',
      isVerified: false,
    },
    prompt: 'Small wooden cabin in a snowy forest at night, warm light glowing from windows, chimney smoke',
    tags: ['cozy', 'cabin', 'winter'],
    category: 'Lifestyle',
    style: 'Photography',
    aspectRatio: '4:5',
    views: 3400,
    likes: 1250,
    saves: 310,
    comments: 56,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isSaved: false,
    isShort: false,
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [credits, setCredits] = useState(40);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploadingPost, setUploadingPost] = useState<UploadingPost | null>(null);

  const { deferredPrompt, promptInstall: installApp } = usePWAInstall();

  const startUpload = async (data: Omit<UploadingPost, 'id' | 'progress' | 'status'>) => {
    const uploadId = `upload-${Date.now()}`;
    const newUpload: UploadingPost = {
      ...data,
      id: uploadId,
      progress: 0,
      status: 'uploading'
    };
    setUploadingPost(newUpload);
    performUpload(newUpload);
  };

  const retryUpload = async () => {
    if (!uploadingPost) return;
    const retrying = { ...uploadingPost, status: 'uploading' as const, progress: 0, error: undefined };
    setUploadingPost(retrying);
    performUpload(retrying);
  };

  const clearUpload = () => {
    setUploadingPost(null);
  };

  const performUpload = async (upload: UploadingPost) => {
    if (!user) {
      setUploadingPost(prev => prev ? { ...prev, status: 'error', error: 'User not logged in' } : null);
      return;
    }

    try {
      // Ensure profile exists before posting (prevents foreign key constraint error)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
        const displayName = user.user_metadata?.display_name || username;
        await supabase.from('profiles').insert({ id: user.id, username, display_name: displayName });
      }

      let finalUrl = upload.previewUrl;

      if (upload.file) {
        setUploadingPost(prev => prev ? { ...prev, progress: 10 } : null);
        
        const fileExt = upload.file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const bucket = 'prompt-images';
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, upload.file, {
            contentType: upload.file.type,
            upsert: false
          });
          
        if (uploadError) throw uploadError;
        
        setUploadingPost(prev => prev ? { ...prev, progress: 60 } : null);
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        finalUrl = data.publicUrl;
      }

      const postData: any = {
        creator_id: user.id,
        title: upload.title.trim(),
        prompt: upload.prompt.trim(),
        image_url: finalUrl,
        is_short: upload.type === 'short',
        tags: upload.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const { error } = await supabase.from('posts').insert(postData);
      if (error) throw error;

      setUploadingPost(prev => prev ? { ...prev, progress: 100, status: 'success' } : null);
      toast.success(`${upload.type === 'short' ? 'Short' : 'Post'} published!`);
      fetchPosts();
      
      // Auto clear after 3 seconds on success
      setTimeout(() => {
        setUploadingPost(current => current?.id === upload.id ? null : current);
      }, 3000);

    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadingPost(prev => prev ? { ...prev, status: 'error', error: err.message || 'Upload failed' } : null);
      toast.error(`Upload failed: ${err.message}`);
    }
  };

  const fetchPosts = async () => {
    if (isPlaceholder) {
      setPosts(MOCK_POSTS);
      setInitialLoading(false);
      return;
    }
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
          isLiked: false,
          isSaved: false,
          isShort: p.is_short || false,
        }));
        
        if (formattedPosts.length === 0) {
          // If it's a real database but empty, keep it empty so we can show a welcome screen
          // If it's placeholder mode, we use mock posts
          setPosts(isPlaceholder ? MOCK_POSTS : []);
        } else {
          setPosts(formattedPosts);
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      if (isPlaceholder) setPosts(MOCK_POSTS); // Only fallback to mock on error if in placeholder mode
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchProfile = async (currentUser: User) => {
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (error?.code === 'PGRST116') {
      // Profile doesn't exist yet — create it
      const username = currentUser?.user_metadata?.username || currentUser?.email?.split('@')[0] || 'user';
      const displayName = currentUser?.user_metadata?.display_name || username;
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: currentUser.id, username, display_name: displayName })
        .select()
        .single();
      data = newProfile;
    }

    if (data) {
      // Auto-assign admin role to specific email
      if (currentUser.email === 'omprakashseth248@gmail.com' && (data as any).role !== 'admin') {
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({ role: 'admin' } as any)
          .eq('id', currentUser.id)
          .select()
          .single();
        if (updatedProfile) data = updatedProfile;
      }

      setProfile(data as Profile);
      setCredits(data.credits);
    }
  };

  useEffect(() => {
    if (isPlaceholder) {
      console.log('🚀 Supabase Mode: Placeholder/Mock Data (Check your AI Studio Secrets)');
    } else {
      console.log('✅ Supabase Connected: Real Database is active');
    }
    
    fetchPosts().catch(console.error); // Fetch posts on mount

    if (isPlaceholder) return;

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
    if (!user || isPlaceholder) return; // Must be logged in
    
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
    if (!user || isPlaceholder) return; // Must be logged in
    
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
    if (isPlaceholder) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }
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
      posts, setPosts, initialLoading, user, session, profile, isLoggedIn, isPro, credits, setCredits,
      uploadingPost, startUpload, retryUpload, clearUpload,
      toggleLike, toggleSave, addPost, deletePost, signOut, refreshProfile, fetchPosts,
      deferredPrompt, installApp
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
