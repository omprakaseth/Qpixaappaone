import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isPlaceholder } from '@/integrations/supabase/client';
import { MOCK_POSTS } from './mock_posts';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { analytics } from '@/lib/analytics';

import { usePWAInstall } from '@/hooks/usePWAInstall';

// We redefine Post interface here to match Supabase schema
export interface Post {
  id: string;
  title: string;
  imageUrl: string; // Used as thumbnail or main image
  videoUrl?: string; // New field for video posts
  type: 'image' | 'video'; // Explicit content type
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
  type: 'image' | 'video' | 'short'; // Consistent with Post type
  file: File | null;
  previewUrl: string | null;
  thumbnailUrl?: string; // New field
  videoBlob?: Blob;      // For trimmed video
  duration?: number;     // In seconds
  progress: number;
  status: 'uploading' | 'processing' | 'publishing' | 'error' | 'success'; // Added 'processing' and 'publishing'
  error?: string;
}

interface AppState {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  initialLoading: boolean;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [userInterests, setUserInterests] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('qpixa_user_interests');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [initialLoading, setInitialLoading] = useState(true);

  // Persist interests
  useEffect(() => {
    localStorage.setItem('qpixa_user_interests', JSON.stringify(userInterests));
  }, [userInterests]);
  const [credits, setCredits] = useState(40);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
      
      // Robust tag handling (Instagram style: multiple separators, no duplicates)
      const tagsString = upload.tags || '';
      const tagsArray = tagsString
        .replace(/#/g, ' ') // Treat hashtag symbols as separators
        .split(/[,;\s]+/)   // Split by comma, semicolon, or whitespace
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0 && t !== '#')
        .slice(0, 30);      // Limit to 30 tags

      // Smart Category Logic: Check if tags match any known categories
      const availableCategories = ['Portrait', 'Anime', 'Cars', 'Fantasy', 'Nature', 'Shorts', 'Summer', 'IPL 2026', 'Trending'];
      let detectedCategory = upload.type === 'short' ? 'Shorts' : 'Trending';
      
      for (const cat of availableCategories) {
        if (tagsArray.includes(cat.toLowerCase())) {
          detectedCategory = cat;
          break;
        }
      }

      const postData: any = {
        creator_id: user.id,
        title: safeTitle,
        prompt: safePrompt,
        image_url: upload.thumbnailUrl || finalUrl,
        video_url: upload.type === 'video' || upload.type === 'short' ? finalUrl : null,
        type: (upload.type === 'short' || upload.type === 'video') ? 'video' : 'image',
        tags: tagsArray,
        category: detectedCategory,
        is_short: upload.type === 'short',
        is_hidden: false,
        views: 0,
        likes: 0,
        comments: 0,
        created_at: new Date().toISOString()
      };

      console.log('Attempting to insert post with full metadata:', postData);
      
      const { data: insertedData, error } = await supabase.from('posts').insert(postData).select(`
        *,
        profiles:creator_id (*)
      `).single();
      
      if (error) {
        console.error('Failed to insert post:', error);
        
        // Final fallback if the above still fails (dropping optional fields)
        const minimalData = {
          creator_id: user.id,
          title: safeTitle,
          prompt: safePrompt,
          image_url: finalUrl || '',
        };
        
        const { data: retryData, error: retryError } = await supabase.from('posts').insert(minimalData).select(`
          *,
          profiles:creator_id (*)
        `).single();
        
        if (retryError) {
          throw new Error(`Critical upload failure: ${retryError.message}`);
        }
        
        if (retryData) {
          const newPost = formatPost(retryData);
          setPosts(prev => [newPost, ...prev]);
        }
        toast.info('Post published with limited metadata.');
      } else if (insertedData) {
        const newPost = formatPost(insertedData);
        setPosts(prev => [newPost, ...prev]);
        analytics.trackPostPublished(upload.id, detectedCategory, upload.type === 'short');
        toast.success(`${upload.type === 'short' ? 'Short' : 'Post'} published successfully!`);
      }

      setUploadingPost(prev => prev ? { ...prev, progress: 100, status: 'success' } : null);
      
      // Wait a bit for DB consistency before full refetch
      setTimeout(async () => {
        await fetchPosts();
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
    videoUrl: p.video_url || undefined,
    type: p.type || (p.video_url ? 'video' : 'image'),
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
    console.log('fetchPosts called, isPlaceholder:', isPlaceholder);
    
    // Prevent redundant fetches if posts are fresh (within 2 minutes)
    const now = Date.now();
    if (posts.length > 0 && (now - lastFetchTime) < 120000) {
      console.log('Reusing cached posts');
      return;
    }

    if (isPlaceholder) {
      console.log('Using mock data because Supabase is not configured');
      setPosts(rankPosts(MOCK_POSTS));
      setInitialLoading(false);
      setLastFetchTime(now);
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
        .order('created_at', { ascending: false })
        .limit(200); // Increased limit for better ranking

      if (error) {
        console.warn('Error fetching posts with join, trying simple fetch:', error);
        const { data: simpleData, error: simpleError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
          
        if (simpleError) {
          console.error('Simple fetch also failed:', simpleError);
          throw simpleError;
        }
        
        if (simpleData) {
          console.log(`Fetched ${simpleData.length} posts (simple)`);
          const formattedPosts: Post[] = simpleData.map(formatPost);
          setPosts(rankPosts(formattedPosts));
        }
      } else if (data) {
        console.log(`Fetched ${data.length} posts (with join)`);
        const formattedPosts: Post[] = data.map(formatPost);
        setPosts(rankPosts(formattedPosts));
      } else {
        setPosts([]);
      }
      setLastFetchTime(now);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  // --- AI Discovery Algorithm V2.5 ---
  const rankPosts = (postsToRank: Post[]): Post[] => {
    const now = new Date().getTime();
    
    return [...postsToRank].sort((a, b) => {
      const getScore = (p: Post) => {
        // 1. Recency Decay (Newton's cooling law simulation)
        const ageHours = (now - new Date(p.createdAt).getTime()) / (1000 * 60 * 60);
        // Base score starts at 1, drops as age increases
        const recencyFactor = 1 / Math.pow(ageHours + 2, 1.8);
        
        // 2. Engagement Rate Score (Quality over Quantity)
        const engagementRate = p.views > 0 ? (p.likes / p.views) : 0.05;
        const engagementScore = (p.likes * 10) + (p.views * 0.2) + (p.saves * 25);
        
        // 3. User Interest Alignment (Personalization)
        let interestBoost = 0;
        if (userInterests[p.category]) interestBoost += userInterests[p.category] * 20;
        p.tags.forEach(tag => {
          if (userInterests[tag]) interestBoost += userInterests[tag] * 8;
        });

        // 4. Social Status & Credibility
        const statusScore = p.creator.isVerified ? 50 : 0;
        
        // 5. Video Content Boost (Platform priority for videos)
        const formatBoost = p.type === 'video' ? 30 : 0;

        // Final score combines all with emphasis on hot content
        return ((engagementScore * (1 + engagementRate)) + interestBoost + formatBoost) * recencyFactor + statusScore;
      };

      return getScore(b) - getScore(a);
    });
  };

  // Update interests when interacting
  const trackInterest = (category: string, tags: string[]) => {
    setUserInterests(prev => {
      const next = { ...prev };
      next[category] = (next[category] || 0) + 1;
      tags.forEach(t => {
        next[t] = (next[t] || 0) + 1;
      });
      return next;
    });
  };

  const fetchPostById = async (id: string): Promise<Post | null> => {
    if (isPlaceholder || id.startsWith('mock-')) {
      return MOCK_POSTS.find(p => p.id === id) || null;
    }
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
    if (isPlaceholder) return;
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
      setProfile(data as Profile);
      setCredits(data.credits);
      
      // Check admin status securely via RPC
      const { data: hasAdminRole } = await supabase.rpc('has_role', {
        _user_id: currentUser.id,
        _role: 'admin'
      });
      setIsAdmin(!!hasAdminRole);
    }
  };

  useEffect(() => {
    fetchPosts().catch(console.error); // Fetch posts on mount

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user && !isPlaceholder) {
        if (_event === 'SIGNED_IN') {
          analytics.trackUserGrowth(sess.user.id, sess.user.email, sess.user.app_metadata.provider || 'email');
        } else {
          analytics.identify(sess.user.id, { $email: sess.user.email });
        }
        fetchProfile(sess.user);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setCredits(40);
      }
    });

    // Real-time updates for posts (likes, views, etc.)
    let channel: any = null;
    
    if (!isPlaceholder) {
      channel = supabase
        .channel('public:posts')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, payload => {
          const updatedPost = payload.new;
          setPosts(prev => prev.map(p => p.id === updatedPost.id ? { 
            ...p, 
            likes: updatedPost.likes, 
            views: updatedPost.views, 
            comments: updatedPost.comments,
            saves: updatedPost.saves
          } : p));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
          // Only add if not already in list (prevents duplicates from local optimistic adds)
          const newPost = payload.new;
          setPosts(prev => {
            if (prev.some(p => p.id === newPost.id)) return prev;
            // We need to fetch the profile to format it properly, or just use payload.new and fetch later
            // For simplicity, let's just trigger a fetch if it's a new post we don't have
            fetchPosts(); // Standard refetch is safer for new posts to get profiles
            return prev;
          });
        })
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const toggleLike = async (id: string) => {
    if (!user) return; // Must be logged in
    
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const wasLiked = post.isLiked;
    const originalLikes = post.likes;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, isLiked: !wasLiked, likes: wasLiked ? originalLikes - 1 : originalLikes + 1 } : p
    ));

    if (!wasLiked) {
      trackInterest(post.category, post.tags);
    }

    try {
      if (wasLiked) {
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
      // Revert to original state
      setPosts(prev => prev.map(p =>
        p.id === id ? { ...p, isLiked: wasLiked, likes: originalLikes } : p
      ));
    }
  };

  const toggleSave = async (id: string) => {
    if (!user) return; // Must be logged in
    
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const wasSaved = post.isSaved;
    const originalSaves = post.saves;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, isSaved: !wasSaved, saves: wasSaved ? originalSaves - 1 : originalSaves + 1 } : p
    ));

    try {
      if (wasSaved) {
        // Unsave
        await supabase.from('favorites').delete().match({ image_url: post.imageUrl, user_id: user.id });
      } else {
        // Save
        await supabase.from('favorites').insert({ image_url: post.imageUrl, prompt: post.prompt, user_id: user.id });
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      toast.error('Failed to update save status');
      // Revert to original state
      setPosts(prev => prev.map(p =>
        p.id === id ? { ...p, isSaved: wasSaved, saves: originalSaves } : p
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
    // Clear local storage items that might leak data between accounts
    localStorage.removeItem('qpixa_studio_sessions');
    localStorage.removeItem('qpixa_recent_models');
    
    await supabase.auth.signOut();
    analytics.reset();
    setUser(null);
    setSession(null);
    setProfile(null);
    setCredits(40);
    setPosts([]);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  const isLoggedIn = !!user;
  const isPro = profile?.subscription_plan === 'pro';

  return (
    <AppContext.Provider value={{
      posts, setPosts, initialLoading, user, session, profile, isAdmin, isLoggedIn, isPro, credits, setCredits,
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
