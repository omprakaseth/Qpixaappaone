import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Settings, LogIn, UserPlus, Grid3X3, Sparkles, Coins, ShoppingBag, Star, Edit3, Share2, Image as ImageIcon, Info, SlidersHorizontal, PlaySquare } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import EditProfileSheet from '@/components/profile/EditProfileSheet';
import DashboardSheet from '@/components/profile/DashboardSheet';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useFollows } from '@/hooks/useFollows';

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
  const { isLoggedIn, profile, user, refreshProfile } = useAppState();
  const { followingIds } = useFollows();
  const [activeTab, setActiveTab] = useState<'posts' | 'shorts' | 'prompts' | 'about'>('posts');
  const [myPrompts, setMyPrompts] = useState<UserPrompt[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [earnings, setEarnings] = useState({ totalSales: 0, totalEarnings: 0, avgRating: 0 });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [promptFilter, setPromptFilter] = useState<string>('All');

  useEffect(() => {
    if (user) {
      fetchMyPrompts();
      fetchMyPosts();
      fetchFollowerCount();
    }
  }, [user]);

  const fetchMyPosts = async () => {
    if (!user) return;
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
      console.error('Error fetching posts:', error);
      setMyPosts([]);
    } else if (data && data.length > 0) {
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
  };

  const fetchFollowerCount = async () => {
    if (!user) return;
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
    if (!user) return;
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
  const filteredPrompts = promptFilter === 'All' ? myPrompts : myPrompts.filter(p => p.category === promptFilter);

  const tabs = [
    { id: 'posts' as const, icon: Grid3X3, label: 'Posts' },
    { id: 'shorts' as const, icon: PlaySquare, label: 'Shorts' },
    { id: 'prompts' as const, icon: ShoppingBag, label: 'Prompt Store' },
    { id: 'about' as const, icon: Info, label: 'About' },
  ];

  return (
    <>
      <div ref={scrollRef} className="h-full overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div 
          className={`sticky top-0 z-20 bg-background/95 backdrop-blur-md px-4 pt-2 pb-3 flex items-center justify-between transition-transform duration-300 ${!navVisible ? '-translate-y-full' : 'translate-y-0'}`} 
          style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}
        >
          <h1 className="text-lg font-bold text-foreground">@{username}</h1>
          <button onClick={onOpenSettings} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <Settings size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Cover Photo */}
        <div className="relative h-[160px] w-full overflow-hidden bg-secondary">
          <img
            src={profile?.cover_url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80'}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Profile Hero */}
        <div className="px-4 pb-2 -mt-12">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-[96px] h-[96px] rounded-full p-[3px] bg-background">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-3xl font-bold text-secondary-foreground">{initial}</span>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-lg font-bold text-foreground mt-2 flex items-center gap-1">
              {displayName}
              {profile?.is_verified && <VerifiedBadge size={16} />}
            </h2>
            {profile?.bio && (
              <p className="text-[13px] text-muted-foreground mt-1 text-center max-w-[280px] leading-relaxed">{profile.bio}</p>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center flex flex-col items-center">
              <p className="text-base font-bold text-foreground">{followerCount > 1000 ? (followerCount/1000).toFixed(1) + 'k' : followerCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Followers</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <p className="text-base font-bold text-foreground">{followingIds.size}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Followings</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <p className="text-base font-bold text-foreground">{myPosts.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Posts</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setShowEditProfile(true)}
              className="flex-1 py-2 rounded-xl bg-secondary/50 text-foreground text-[13px] font-semibold active:scale-[0.98] transition-transform"
            >
              Edit Profile
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}?profile=${username}`;
                if (navigator.share) {
                  navigator.share({ title: `${displayName} on Qpixa`, url }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(url);
                  toast.success('Profile link copied!');
                }
              }}
              className="flex-1 py-2 rounded-xl bg-secondary/50 text-foreground text-[13px] font-semibold active:scale-[0.98] transition-transform"
            >
              Share
            </button>
            <button
              onClick={() => setShowDashboard(true)}
              className="flex-1 py-2 rounded-xl bg-secondary/50 text-foreground text-[13px] font-semibold active:scale-[0.98] transition-transform"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mt-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 transition-colors ${
                activeTab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
              }`}
            >
              <t.icon size={15} />
              <span className="text-[10px] font-semibold">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="pb-safe-nav">
          {activeTab === 'posts' && (
            myPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5">
                {myPosts.map(p => (
                  <button key={p.id} onClick={() => onPostTap?.(p)} className="relative aspect-square overflow-hidden group active:opacity-80 transition-opacity">
                    <img src={p.imageUrl || '/placeholder.svg'} alt={p.prompt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-3">
                  <ImageIcon size={28} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-foreground">No Posts Yet</p>
                <p className="text-xs text-muted-foreground mt-1">Your creations will appear here</p>
              </div>
            )
          )}

          {activeTab === 'shorts' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-3">
                <PlaySquare size={28} className="text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-foreground">No Shorts Yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your short videos will appear here</p>
            </div>
          )}

          {activeTab === 'prompts' && (
            myPrompts.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide">
                  <SlidersHorizontal size={14} className="text-muted-foreground flex-shrink-0" />
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setPromptFilter(cat)}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                        promptFilter === cat
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {promptFilter === 'All' ? (
                  categories.filter(c => c !== 'All').map(cat => {
                    const catPrompts = myPrompts.filter(p => p.category === cat);
                    if (catPrompts.length === 0) return null;
                    return (
                      <div key={cat} className="mb-3">
                        <div className="flex items-center justify-between px-3 py-2">
                          <h3 className="text-[12px] font-bold text-foreground">{cat}</h3>
                          <span className="text-[10px] text-muted-foreground">{catPrompts.length}</span>
                        </div>
                        <div className="flex gap-2.5 px-3 overflow-x-auto scrollbar-hide pb-1">
                          {catPrompts.map(p => (
                            <PromptMiniCard key={p.id} prompt={p} />
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex gap-2.5 px-3 overflow-x-auto scrollbar-hide flex-wrap pb-1 pt-1">
                    {filteredPrompts.map(p => (
                      <PromptMiniCard key={p.id} prompt={p} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-3">
                  <ShoppingBag size={28} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-foreground">No Prompts Yet</p>
                <p className="text-xs text-muted-foreground mt-1">Your marketplace prompts will appear here</p>
              </div>
            )
          )}

          {activeTab === 'about' && (
            <div className="space-y-3 p-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">About</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {profile?.bio || 'No bio added yet. Tap Edit Profile to add one.'}
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">Stats</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total Posts</span>
                    <span className="text-xs font-semibold text-foreground">{myPosts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Prompts Listed</span>
                    <span className="text-xs font-semibold text-foreground">{myPrompts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total Sales</span>
                    <span className="text-xs font-semibold text-foreground">{earnings.totalSales}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Average Rating</span>
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      {earnings.avgRating > 0 ? earnings.avgRating.toFixed(1) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Member Since</span>
                    <span className="text-xs font-semibold text-foreground">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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

/* Compact prompt card for profile store */
const PromptMiniCard: React.FC<{ prompt: { id: string; title: string; preview_image: string | null; price: number; rating: number; sales_count: number; model_type: string } }> = ({ prompt }) => {
  return (
    <div className="flex-shrink-0 w-[130px] rounded-xl overflow-hidden bg-card border border-border">
      <div className="relative aspect-square w-full overflow-hidden">
        <img src={prompt.preview_image || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-1 left-1">
          <span className="bg-primary/80 text-primary-foreground text-[7px] font-semibold px-1.5 py-0.5 rounded-full">
            {prompt.model_type}
          </span>
        </div>
      </div>
      <div className="p-2">
        <h3 className="text-[10px] font-semibold text-foreground truncate">{prompt.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-0.5">
            <Star size={8} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[9px] font-medium text-foreground">{prompt.rating}</span>
          </div>
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-primary">
            <Coins size={8} />{prompt.price}
          </span>
        </div>
      </div>
    </div>
  );
}