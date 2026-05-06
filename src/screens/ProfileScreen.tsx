import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Settings, LogIn, UserPlus, Grid3X3, Sparkles, Coins, ShoppingBag, Star, Edit3, Share2, Image as ImageIcon, Info, SlidersHorizontal, PlaySquare, Bell, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/context/AppContext';
import { supabase, isPlaceholder } from '@/integrations/supabase/client';
import EditProfileSheet from '@/components/profile/EditProfileSheet';
import DashboardSheet from '@/components/profile/DashboardSheet';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useFollows } from '@/hooks/useFollows';
import AdminScreen from './AdminScreen';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileScreenProps {
  scrollRef?: React.RefObject<HTMLDivElement>;
  onOpenSettings: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  onPostTap?: (post: any) => void;
  navVisible?: boolean;
}

interface UserPrompt {
  id: string;
  title: string;
  preview_image: string | null;
  price: number;
  rating: number;
  sales_count: number;
  model_type: string;
  category: string;
}

export default function ProfileScreen({ scrollRef, onOpenSettings, onOpenAuth, onPostTap, navVisible = true }: ProfileScreenProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(52);
  const [isMounted, setIsMounted] = useState(false);
  const [showTopHeader, setShowTopHeader] = useState(true);
  const lastScrollY = useRef(0);
  const { isLoggedIn, profile, user, refreshProfile } = useAppState();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;

    const handleScroll = () => {
      const currentScrollY = el.scrollTop;
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setShowTopHeader(false);
      } else {
        setShowTopHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  const { followingIds } = useFollows();
  const [activeTab, setActiveTab] = useState<'posts' | 'shorts' | 'prompts' | 'about'>('posts');
  const [myPrompts, setMyPrompts] = useState<UserPrompt[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myShorts, setMyShorts] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [earnings, setEarnings] = useState({ totalSales: 0, totalEarnings: 0, avgRating: 0 });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [promptFilter, setPromptFilter] = useState<string>('All');
  
  const { deferredPrompt, installApp: handleInstallApp } = useAppState();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      fetchMyPrompts();
      fetchMyPosts();
      fetchMyShorts();
      fetchFollowerCount();
    }
  }, [user]);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target instanceof HTMLElement) {
          setHeaderHeight(entry.target.offsetHeight);
        }
      }
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchMyShorts = async () => {
    if (!user || isPlaceholder) return;
    try {
      const { data, error } = await (supabase
        .from('posts')
        .select('*, profiles:creator_id(username, avatar_url)')
        .eq('creator_id', user.id)
        .eq('is_short', true)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      
      if (data) {
        const formattedShorts = data.map((p: any) => ({
          id: p.id,
          thumbnail: p.image_url,
          views: p.views || 0,
          likes: p.likes || 0,
          comments: p.comments || 0,
          prompt: p.prompt || '',
          creator: {
            username: p.profiles?.username || profile?.username || 'User',
            avatar: p.profiles?.avatar_url || profile?.avatar_url || '',
          }
        }));
        setMyShorts(formattedShorts);
      }
    } catch (error) {
      console.error('Error fetching shorts:', error);
      setMyShorts([]);
    }
  };

  const fetchMyPosts = async () => {
    if (!user || isPlaceholder) return;
    try {
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
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.warn('Profile fetch post error (retrying simple):', error);
        // Fallback to simple fetch
        const { data: simpleData, error: simpleError } = await supabase
          .from('posts')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (simpleError) throw simpleError;
        if (simpleData) {
          const formatted = simpleData.map((p: any) => ({
            ...p,
            imageUrl: p.image_url,
            creator: {
               id: user.id,
               name: profile?.display_name || 'You',
               username: `@${profile?.username || 'user'}`,
               avatar: profile?.avatar_url || '',
               initials: (profile?.display_name || 'U').substring(0, 2).toUpperCase(),
               isVerified: profile?.is_verified || false
            }
          }));
          setMyPosts(formatted);
        }
      } else if (data) {
        const formattedPosts = data.map((p: any) => ({
          id: p.id,
          title: p.title || 'Untitled',
          imageUrl: p.image_url,
          creator: {
            id: p.creator_id || user?.id || '',
            name: p.profiles?.display_name || profile?.display_name || 'Unknown',
            username: p.profiles?.username ? `@${p.profiles.username}` : (profile?.username ? `@${profile.username}` : '@user'),
            avatar: p.profiles?.avatar_url || profile?.avatar_url || '',
            initials: (p.profiles?.display_name || profile?.display_name || 'U').substring(0, 2).toUpperCase(),
            isVerified: p.profiles?.is_verified || profile?.is_verified || false,
          },
          prompt: p.prompt || '',
          tags: p.tags || [],
          likes: p.likes || 0,
          views: p.views || 0,
          saves: p.saves || 0,
          comments: p.comments || 0,
          isLiked: false,
          isSaved: false,
          category: p.category,
          style: p.style,
          aspectRatio: p.aspect_ratio,
          creator_id: p.creator_id
        }));
        setMyPosts(formattedPosts);
      } else {
        setMyPosts([]);
      }
    } catch (err) {
      console.error('Critical error in fetchMyPosts:', err);
      setMyPosts([]);
    }
  };

  const fetchFollowerCount = async () => {
    if (!user || isPlaceholder) return;
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);
    if (error) {
      console.error('Error fetching followers:', error);
    } else {
      setFollowerCount(count || 0);
    }
  };

  const fetchMyPrompts = async () => {
    if (!user || isPlaceholder) return;
    const { data, error } = await supabase
      .from('marketplace_prompts')
      .select('id, title, preview_image, price, rating, sales_count, model_type, category')
      .eq('creator_id', user.id);
    if (error) {
      console.error('Error fetching prompts:', error);
      setMyPrompts([]);
    } else if (data && data.length > 0) {
      setMyPrompts(data);
      const totalSales = data.reduce((s, p) => s + p.sales_count, 0);
      const totalEarnings = data.reduce((s, p) => s + p.sales_count * p.price, 0);
      const avgRating = data.length > 0 ? data.reduce((s, p) => s + p.rating, 0) / data.length : 0;
      setEarnings({ totalSales, totalEarnings, avgRating });
    } else {
      setMyPrompts([]);
    }
  };

  if (showAdmin && profile?.role === 'admin') {
    return <AdminScreen onBack={() => setShowAdmin(false)} />;
  }

  if (!isLoggedIn) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <span className="text-2xl">👤</span>
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">Sign in to your profile</h2>
        <p className="text-sm text-muted-foreground mb-6">Share your AI creations with the community</p>
        <button onClick={() => onOpenAuth?.('login')} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 mb-3">
          <LogIn size={16} /> Sign In
        </button>
        <button onClick={() => onOpenAuth?.('signup')} className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm flex items-center justify-center gap-2">
          <UserPlus size={16} /> Create Account
        </button>
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.username || 'User';
  const username = profile?.username || 'user';
  const initial = displayName.charAt(0).toUpperCase();

  const categories = ['All', ...Array.from(new Set(myPrompts.map(p => p.category)))];

  const tabs = [
    { id: 'posts' as const, icon: Grid3X3, label: 'Posts' },
    { id: 'shorts' as const, icon: PlaySquare, label: 'Shorts' },
    { id: 'prompts' as const, icon: ShoppingBag, label: 'Prompt Store' },
    { id: 'about' as const, icon: Info, label: 'About' },
  ];

  return (
    <>
      <div ref={scrollRef} className="h-full overflow-y-auto scrollbar-hide bg-[#09090b]">
        {/* Fixed Header - Mobile Only or Scrolling Desktop */}
        <div 
          ref={headerRef}
          className={cn(
            "fixed top-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-md px-4 pb-3 flex items-center justify-between transition-all duration-300 ease-in-out border-b border-white/5",
            showTopHeader ? "translate-y-0" : "-translate-y-full",
            !isMobile && "left-[240px] px-8 py-4"
          )}
          style={{ paddingTop: isMobile ? 'max(env(safe-area-inset-top), 0.75rem)' : '1rem' }}
        >
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">@{username}</h1>
          <div className="flex items-center gap-2">
            <button onClick={onOpenSettings} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors">
              <Settings size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Desktop Profile Layout */}
        {!isMobile ? (
          <div className="max-w-6xl mx-auto pt-24 px-8 pb-20">
            {/* Header / Hero Section */}
            <div className="flex items-start gap-10 mb-12">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-tr from-primary to-purple-500 shadow-2xl">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover border-4 border-[#09090b]" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center border-4 border-[#09090b]">
                      <span className="text-5xl font-black italic text-white/20">{initial}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setShowEditProfile(true)}
                  className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-primary border-4 border-[#09090b] flex items-center justify-center text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 size={18} />
                </button>
              </div>

              <div className="flex-1 pt-4">
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                    {displayName}
                    {profile?.is_verified && <VerifiedBadge size={24} />}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEditProfile(true)}
                      className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest italic transition-all"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setShowDashboard(true)}
                      className="px-6 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest italic transition-all hover:shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                    >
                      Dashboard
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-8 mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black italic text-white tracking-tight">{followerCount}</span>
                    <span className="text-[10px] font-black uppercase italic tracking-widest text-white/40">Followers</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black italic text-white tracking-tight">{followingIds.size}</span>
                    <span className="text-[10px] font-black uppercase italic tracking-widest text-white/40">Following</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black italic text-white tracking-tight">{myPosts.length}</span>
                    <span className="text-[10px] font-black uppercase italic tracking-widest text-white/40">Posts</span>
                  </div>
                </div>

                <p className="text-white/60 text-sm leading-relaxed max-w-xl">
                  {profile?.bio || 'Explore my worlds. Powered by Qpixa AI.'}
                </p>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="border-t border-white/5">
              <div className="flex gap-10 mb-8">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "group flex items-center gap-2 py-4 border-t-2 -mt-0.5 transition-all relative",
                      activeTab === t.id 
                        ? "border-primary text-white" 
                        : "border-transparent text-white/30 hover:text-white/60"
                    )}
                  >
                    <t.icon size={16} className={cn("transition-colors", activeTab === t.id ? "text-primary" : "text-white/30")} />
                    <span className="text-[10px] font-black uppercase italic tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Grid Content */}
              <div className="min-h-[400px]">
                {activeTab === 'posts' && (
                  myPosts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-6">
                      {myPosts.map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => onPostTap?.(p)} 
                          className="relative aspect-square overflow-hidden rounded-3xl group active:opacity-80 transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(167,139,250,0.15)] ring-1 ring-white/5"
                        >
                          <img src={p.imageUrl || '/placeholder.svg'} alt={p.prompt} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1 italic">Vision Prompt</p>
                            <p className="text-sm text-white font-black italic uppercase tracking-tighter truncate w-full">{p.prompt}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={ImageIcon} title="No Posts Yet" sub="Start creating with Qpixa Studio" />
                  )
                )}

                {activeTab === 'shorts' && (
                  myShorts.length > 0 ? (
                    <div className="grid grid-cols-4 gap-6">
                      {myShorts.map(s => (
                        <button key={s.id} className="relative aspect-[9/16] overflow-hidden rounded-3xl group active:opacity-80 transition-all hover:scale-[1.02] bg-zinc-900 border border-white/5 shadow-2xl">
                          <img src={s.thumbnail} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlaySquare size={48} className="text-white drop-shadow-2xl" />
                          </div>
                          <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                            <PlaySquare size={14} className="text-primary" />
                            <span className="text-[11px] font-black italic text-white uppercase">{s.views || 0}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={PlaySquare} title="No AI Shorts" sub="Turn your prompts into motion" />
                  )
                )}

                {activeTab === 'prompts' && (
                   myPrompts.length > 0 ? (
                    <div className="grid grid-cols-4 gap-6">
                      {myPrompts.map(p => (
                        <div key={p.id} className="group relative bg-[#0f0f13] rounded-2xl border border-white/5 overflow-hidden transition-all hover:border-primary/50 hover:shadow-2xl">
                          <div className="aspect-square relative">
                            <img src={p.preview_image || '/placeholder.svg'} className="w-full h-full object-cover" alt="" />
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1 border border-white/10">
                              <Coins size={10} className="text-primary" />
                              <span className="text-[10px] font-black italic text-white uppercase">{p.price}</span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="text-xs font-black uppercase italic italic text-white tracking-tighter truncate mb-2">{p.title}</h4>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase italic tracking-widest text-primary px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
                                {p.model_type}
                              </span>
                              <div className="flex items-center gap-1">
                                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-[10px] font-black italic text-white">{p.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={ShoppingBag} title="No Prompts Listed" sub="Monetize your best creations" />
                  )
                )}

                {activeTab === 'about' && (
                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-[#0f0f13] border border-white/5 rounded-3xl p-8">
                      <h3 className="text-sm font-black uppercase italic tracking-widest text-primary mb-6">Bio</h3>
                      <p className="text-sm text-white/70 leading-relaxed font-medium italic">
                        {profile?.bio || 'No bio added yet. Explore the potential of AI with Qpixa.'}
                      </p>
                    </div>
                    <div className="bg-[#0f0f13] border border-white/5 rounded-3xl p-8">
                      <h3 className="text-sm font-black uppercase italic tracking-widest text-primary mb-6">Creator Statistics</h3>
                      <div className="grid grid-cols-2 gap-6">
                        {[
                          { label: 'Total Sales', value: earnings.totalSales },
                          { label: 'Total Earnings', value: earnings.totalEarnings + ' Credits' },
                          { label: 'Avg Rating', value: earnings.avgRating.toFixed(1) },
                          { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' }
                        ].map(item => (
                          <div key={item.label}>
                            <p className="text-[10px] font-black uppercase italic tracking-widest text-white/30 mb-1">{item.label}</p>
                            <p className="text-sm font-black italic text-white uppercase">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-10">
            {/* Cover Photo */}
            <div 
              className={cn(
                "relative w-full overflow-hidden bg-secondary transition-all duration-300",
              )}
              style={{ height: 180, marginTop: headerHeight }}
            >
              <img
                src={profile?.cover_url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80'}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Profile Hero Mobile */}
            <div className="px-4 pb-2 -mt-10 relative z-10">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-[88px] h-[88px] rounded-full p-[3px] bg-[#09090b]">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                        <span className="text-3xl font-black italic uppercase text-white/20">{initial}</span>
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white mt-3 flex items-center gap-1">
                  {displayName}
                  {profile?.is_verified && <VerifiedBadge size={16} />}
                </h2>
                
                {profile?.bio && (
                  <p className="text-[13px] text-white/60 text-center max-w-[300px] leading-relaxed mt-2 uppercase font-black italic tracking-tighter opacity-80">{profile.bio}</p>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-center gap-10 mt-8 mb-8">
                <div className="text-center">
                  <p className="text-xl font-black italic text-white leading-none">{followerCount > 1000 ? (followerCount/1000).toFixed(1) + 'k' : followerCount}</p>
                  <p className="text-[9px] font-black uppercase italic tracking-widest text-white/40 mt-1.5">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black italic text-white leading-none">{followingIds.size}</p>
                  <p className="text-[9px] font-black uppercase italic tracking-widest text-white/40 mt-1.5">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black italic text-white leading-none">{myPosts.length}</p>
                  <p className="text-[9px] font-black uppercase italic tracking-widest text-white/40 mt-1.5">Posts</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 px-2">
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase italic tracking-widest active:scale-[0.98] transition-transform"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowDashboard(true)}
                  className="flex-1 py-3 rounded-2xl bg-primary text-white text-[11px] font-black uppercase italic tracking-widest active:scale-[0.98] transition-transform shadow-[0_4px_15px_rgba(var(--primary),0.3)]"
                >
                  Dashboard
                </button>
              </div>
            </div>

            {/* Tabs Mobile */}
            <div className="flex border-b border-white/5 mt-8 px-2 overflow-x-auto no-scrollbar">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex-shrink-0 flex items-center justify-center gap-2 px-6 py-4 border-b-2 transition-all",
                    activeTab === t.id 
                      ? 'border-primary text-white' 
                      : 'border-transparent text-white/30'
                  )}
                >
                  <t.icon size={16} className={activeTab === t.id ? "text-primary" : ""} />
                  <span className="text-[10px] font-black uppercase italic tracking-widest whitespace-nowrap">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content Mobile */}
            <div className="pt-0.5">
              {activeTab === 'posts' && (
                myPosts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-0.5">
                    {myPosts.map(p => (
                      <button key={p.id} onClick={() => onPostTap?.(p)} className="relative aspect-square overflow-hidden active:opacity-80 transition-opacity">
                        <img src={p.imageUrl || '/placeholder.svg'} alt={p.prompt} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={ImageIcon} title="No Posts Yet" sub="Your creations will appear here" />
                )
              )}

              {activeTab === 'shorts' && (
                myShorts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-0.5">
                    {myShorts.map(s => (
                      <button key={s.id} className="relative aspect-[9/16] overflow-hidden group active:opacity-80 transition-opacity bg-zinc-900">
                        <img src={s.thumbnail} className="w-full h-full object-cover" alt="" />
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-md">
                          <PlaySquare size={10} className="text-primary" />
                          <span className="text-[9px] font-black italic text-white">{s.views || 0}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                   <EmptyState icon={PlaySquare} title="No Shorts Yet" sub="Your ai shorts will appear here" />
                )
              )}

              {activeTab === 'prompts' && (
                myPrompts.length > 0 ? (
                  <div className="p-4 space-y-6">
                    {['All', ...Array.from(new Set(myPrompts.map(p => p.category)))].filter(c => c !== 'All').map(cat => {
                      const catPrompts = myPrompts.filter(p => p.category === cat);
                      if (catPrompts.length === 0) return null;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-[11px] font-black uppercase italic tracking-widest text-[#a78bfa]">{cat}</h3>
                            <ChevronRight size={14} className="text-white/20" />
                          </div>
                          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                            {catPrompts.map(p => (
                              <PromptMiniCard key={p.id} prompt={p} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                   <EmptyState icon={ShoppingBag} title="No Prompts" sub="Your marketplace prompts" />
                )
              )}

              {activeTab === 'about' && (
                <div className="space-y-4 p-5">
                  <div className="bg-[#0f0f13] border border-white/5 rounded-3xl p-6">
                    <h3 className="text-xs font-black uppercase italic tracking-widest text-primary mb-3">Bio</h3>
                    <p className="text-[13px] text-white/60 leading-relaxed font-medium italic">
                      {profile?.bio || 'No bio added yet. Explore the potential of AI with Qpixa.'}
                    </p>
                  </div>
                  <div className="bg-[#0f0f13] border border-white/5 rounded-3xl p-6">
                    <h3 className="text-xs font-black uppercase italic tracking-widest text-primary mb-4">Stats</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Total Posts', value: myPosts.length },
                        { label: 'Prompts Listed', value: myPrompts.length },
                        { label: 'Total Sales', value: earnings.totalSales },
                        { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' }
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                          <span className="text-[10px] font-black uppercase italic tracking-widest text-white/30">{item.label}</span>
                          <span className="text-[11px] font-black italic text-white uppercase">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showEditProfile && (profile || user) && (
        <EditProfileSheet
          profile={profile || {
            id: user?.id || '',
            username: user?.email?.split('@')[0] || 'user',
            display_name: user?.email?.split('@')[0] || 'User',
            avatar_url: '',
            bio: '',
            cover_url: ''
          }}
          onClose={() => setShowEditProfile(false)}
          onSaved={refreshProfile}
        />
      )}

      <DashboardSheet
        open={showDashboard}
        onOpenChange={setShowDashboard}
        earnings={earnings}
        promptCount={myPrompts.length}
      />
    </>
  );
}

const EmptyState = ({ icon: Icon, title, sub }: { icon: any, title: string, sub: string }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-[#0f0f13]/30 rounded-3xl border border-white/5 mx-4 mt-4">
    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
      <Icon size={32} className="text-white/20" />
    </div>
    <h3 className="text-sm font-black uppercase italic tracking-widest text-white mb-2">{title}</h3>
    <p className="text-[10px] font-black uppercase italic tracking-widest text-white/30">{sub}</p>
  </div>
);

/* Compact prompt card for profile store */
const PromptMiniCard: React.FC<{ prompt: { id: string; title: string; preview_image: string | null; price: number; rating: number; sales_count: number; model_type: string } }> = ({ prompt }) => {
  return (
    <div className="flex-shrink-0 w-[140px] rounded-2xl overflow-hidden bg-[#0f0f13] border border-white/5 transition-all hover:border-primary/50 group">
      <div className="relative aspect-square w-full overflow-hidden">
        <img src={prompt.preview_image || '/placeholder.svg'} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
        <div className="absolute top-2 left-2">
          <span className="bg-primary/80 backdrop-blur-md text-white text-[8px] font-black uppercase italic tracking-widest px-2 py-0.5 rounded-md">
            {prompt.model_type}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-[10px] font-black uppercase italic italic text-white tracking-tighter truncate mb-2">{prompt.title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <Star size={8} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[9px] font-black italic text-white">{prompt.rating}</span>
          </div>
          <span className="flex items-center gap-0.5 text-[9px] font-black italic text-primary">
            <Coins size={8} />{prompt.price}
          </span>
        </div>
      </div>
    </div>
  );
}
