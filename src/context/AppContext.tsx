import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isPlaceholder } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { analytics } from '@/lib/analytics';

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
  isMock?: boolean;
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
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  fetchPosts: () => Promise<void>;
  fetchPostById: (id: string) => Promise<Post | null>;
  deferredPrompt: any;
  installApp: () => Promise<void>;
}

export const AppContext = createContext<AppState | null>(null);

import { MOCK_POSTS } from './mock_posts';

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
      } else if (finalUrl && finalUrl.startsWith('data:')) {
        // If it's a base64 string (from AI generation), upload it to storage instead of storing base64 in DB
        try {
          setUploadingPost(prev => prev ? { ...prev, progress: 30 } : null);
          const res = await fetch(finalUrl);
          const blob = await res.blob();
          const fileName = `ai-${Date.now()}.png`;
          const bucket = 'prompt-images';
          const filePath = `${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, blob, { contentType: 'image/png' });
            
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);
            finalUrl = publicUrl;
          } else {
            console.error('Failed to upload base64 to storage, falling back to direct URL:', uploadError);
          }
        } catch (e) {
          console.error('Error processing base64 for storage:', e);
        }
      }

      // Prepare post data with absolute fallback to prevent NOT NULL constraint violations
      const rawTitle = upload.title;
      const rawPrompt = upload.prompt;
      
      const safeTitle = (typeof rawTitle === 'string' ? rawTitle : 'Untitled').trim() || 'Untitled';
      const safePrompt = (typeof rawPrompt === 'string' ? rawPrompt : 'No prompt provided').trim() || 'No prompt provided';
      
      const postData: any = {
        creator_id: user.id,
        title: safeTitle,
        prompt: safePrompt,
        image_url: finalUrl || '',
      };

      // Smart Category Logic: Check if tags match any known categories
      const availableCategories = ['Portrait', 'Anime', 'Cars', 'Fantasy', 'Nature', 'Shorts'];
      const tagsArray = (upload.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      let detectedCategory = 'Trending';
      
      for (const cat of availableCategories) {
        if (tagsArray.includes(cat.toLowerCase())) {
          detectedCategory = cat;
          break;
        }
      }

      // Add optional fields only if they exist in the schema (we'll try to insert them and fallback if it fails)
      const extendedData = {
        ...postData,
        is_short: upload.type === 'short',
        tags: (upload.tags || '').split(',').map(t => t.trim()).filter(Boolean),
        category: detectedCategory, // Smart category detection
        is_hidden: false,
      };

      console.log('Final check before insert - Title:', extendedData.title);
      if (!extendedData.title) {
        console.error('CRITICAL: Title is still null or empty despite safeTitle logic!');
        extendedData.title = 'Untitled Creation';
      }

      console.log('Attempting to insert post:', extendedData);
      const { data: insertedData, error } = await supabase.from('posts').insert(extendedData).select(`
        *,
        profiles:creator_id (*)
      `).single();
      
      if (error) {
        console.warn('Failed to insert with extended fields, trying minimal insert:', error);
        // Fallback to minimal insert if columns are missing
        const { data: retryData, error: retryError } = await supabase.from('posts').insert(postData).select(`
          *,
          profiles:creator_id (*)
        `).single();
        if (retryError) throw retryError;
        
        if (retryData) {
          const newPost = formatPost(retryData);
          setPosts(prev => [newPost, ...prev]);
        }
        toast.info('Post published (some metadata like title/tags might be missing due to DB schema)');
      } else if (insertedData) {
        const newPost = formatPost(insertedData);
        setPosts(prev => [newPost, ...prev]);
        analytics.trackPostPublished(upload.id, 'Trending', upload.type === 'short');
        toast.success(`${upload.type === 'short' ? 'Short' : 'Post'} published!`);
      }

      setUploadingPost(prev => prev ? { ...prev, progress: 100, status: 'success' } : null);
      
      // Wait a bit for DB consistency before full refetch
      setTimeout(() => {
        fetchPosts();
      }, 1500);
      
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

  // Helper to format a single post from DB
  const formatPost = (p: any): Post => ({
    id: p.id,
    title: p.title || 'Untitled',
    imageUrl: p.image_url || '',
    creator: {
      id: p.creator_id,
      name: p.profiles?.display_name || 'Unknown',
      username: p.profiles?.username ? `@${p.profiles.username}` : '@user',
      avatar: p.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.creator_id}`,
      initials: (p.profiles?.display_name || 'U').substring(0, 2).toUpperCase(),
      isVerified: p.profiles?.is_verified || false,
    },
    prompt: p.prompt || '',
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
  });

  const fetchPosts = async () => {
    console.log('fetchPosts called');
    if (isPlaceholder) {
      setPosts(MOCK_POSTS);
      setInitialLoading(false);
      return;
    }
    try {
      console.log('Fetching posts from Supabase...');
      // Fetch posts with creator profile
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:creator_id (*)
        `)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('Error fetching posts with join, trying simple fetch:', error);
        const { data: simpleData, error: simpleError } = await supabase
          .from('posts')
          .select('*')
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (simpleError) {
          console.error('Simple fetch also failed:', simpleError);
          throw simpleError;
        }
        
        if (simpleData) {
          console.log(`Fetched ${simpleData.length} posts (simple)`);
          const formattedPosts: Post[] = simpleData.map(formatPost);
          
          // Logic: Real posts first. Only add mock if real posts < 10
          let finalPosts = formattedPosts;
          if (formattedPosts.length < 10) {
            finalPosts = [...formattedPosts, ...MOCK_POSTS];
          }
          
          setPosts(finalPosts);
          console.log('setPosts called with', finalPosts.length, 'posts');
        }
      } else if (data) {
        console.log(`Fetched ${data.length} posts (with join)`);
        const formattedPosts: Post[] = data.map(formatPost);
        
        // Logic: Real posts first. Only add mock if real posts < 10
        let finalPosts = formattedPosts;
        if (formattedPosts.length < 10) {
          finalPosts = [...formattedPosts, ...MOCK_POSTS];
        }
        
        setPosts(finalPosts);
        console.log('setPosts called with', finalPosts.length, 'posts');
      } else {
        // Fallback if data is null but no error
        console.log('No data and no error, setting mock posts');
        setPosts(MOCK_POSTS);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      // Always fallback to mock posts on error
      setPosts(MOCK_POSTS);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchPostById = async (id: string): Promise<Post | null> => {
    if (isPlaceholder) return MOCK_POSTS.find(p => p.id === id) || null;
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:creator_id (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data ? formatPost(data) : null;
    } catch (err) {
      console.error('Error fetching post by id:', err);
      return null;
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
        if (_event === 'SIGNED_IN') {
          analytics.trackUserGrowth(sess.user.id, sess.user.email, sess.user.app_metadata.provider || 'email');
        } else {
          analytics.identify(sess.user.id, { $email: sess.user.email });
        }
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
    
    const post = posts.find(p => p.id === id);
    if (!post) return;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p
    ));

    if (post.isMock) return; // Don't call Supabase for mock posts

    try {
      if (post.isLiked) {
        // Unlike
        await supabase.from('post_likes').delete().match({ post_id: id, user_id: user.id });
      } else {
        // Like
        await supabase.from('post_likes').insert({ post_id: id, user_id: user.id });
        
        // Send notification to post creator
        if (post.creator.id !== user.id && post.creator.id !== 'system') {
          await (supabase as any).from('user_notifications').insert({
            user_id: post.creator.id,
            actor_id: user.id,
            type: 'like',
            title: 'New Like! ❤️',
            message: `${profile?.display_name || 'Someone'} liked your post "${post.title}"`,
            link: `/post/${post.id}`
          });
        }
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
    
    const post = posts.find(p => p.id === id);
    if (!post) return;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, isSaved: !p.isSaved, saves: p.isSaved ? p.saves - 1 : p.saves + 1 } : p
    ));

    if (post.isMock) return; // Don't call Supabase for mock posts

    try {
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
    if (id.startsWith('mock-')) {
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Sample post removed');
      return;
    }
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

  const updatePost = async (id: string, updates: Partial<Post>) => {
    if (!user) return;
    if (id.startsWith('mock-')) {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      toast.success('Sample post updated locally');
      return;
    }
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: updates.title,
          prompt: updates.prompt,
          tags: updates.tags,
        })
        .eq('id', id)
        .eq('creator_id', user.id);

      if (error) throw error;

      setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      toast.success('Post updated successfully');
    } catch (err) {
      console.error('Error updating post:', err);
      toast.error('Failed to update post');
    }
  };

  const signOut = async () => {
    if (isPlaceholder) {
      setUser(null);
      setSession(null);
      setProfile(null);
      analytics.reset();
      return;
    }
    await supabase.auth.signOut();
    analytics.reset();
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
      toggleLike, toggleSave, addPost, deletePost, updatePost, signOut, refreshProfile, fetchPosts, fetchPostById,
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
