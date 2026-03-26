import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Post, generatePosts } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(() => generatePosts(20));
  const [credits, setCredits] = useState(40);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

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

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const toggleSave = (id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, isSaved: !p.isSaved, saves: p.isSaved ? p.saves - 1 : p.saves + 1 } : p
    ));
  };

  const addPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
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
      toggleLike, toggleSave, addPost, signOut, refreshProfile,
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
