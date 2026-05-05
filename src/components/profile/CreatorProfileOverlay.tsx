import { ArrowLeft, Star, ShoppingBag, Grid3X3, Info, UserPlus, UserMinus, Sparkles, Coins, SlidersHorizontal, MapPin, Calendar, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Post } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useFollows } from '@/hooks/useFollows';
import { useAppState } from '@/context/AppContext';

interface CreatorProfileOverlayProps {
  creatorName: string;
  posts: Post[];
  onBack: () => void;
  onPostTap: (post: Post) => void;
}

interface CreatorPrompt {
  id: string;
  title: string;
  preview_image: string | null;
  price: number;
  rating: number;
  sales_count: number;
  model_type: string;
  category: string;
}

export default function CreatorProfileOverlay({ creatorName, posts, onBack, onPostTap }: CreatorProfileOverlayProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'prompts' | 'about'>('posts');
  const [creatorPrompts, setCreatorPrompts] = useState<CreatorPrompt[]>([]);
  const [promptFilter, setPromptFilter] = useState('All');
  const [isVerified, setIsVerified] = useState(false);
  const [creatorUserId, setCreatorUserId] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const { user } = useAppState();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();
  const initial = creatorName.charAt(0).toUpperCase();
  const isMockVerified = creatorName === 'Qpixa';
  const creatorPosts = posts.filter(p => p.creator.name === creatorName);
  const totalLikes = creatorPosts.reduce((sum, p) => sum + p.likes, 0);
  const isOwner = user?.id === creatorUserId;

  const totalSales = creatorPrompts.reduce((s, p) => s + p.sales_count, 0);
  const avgRating = creatorPrompts.length > 0 ? creatorPrompts.reduce((s, p) => s + p.rating, 0) / creatorPrompts.length : 0;

  useEffect(() => {
    const fetchCreatorPrompts = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, is_verified')
        .or(`display_name.eq.${creatorName},username.eq.${creatorName}`)
        .maybeSingle();

      if (profileData) {
        setIsVerified(profileData.is_verified || false);
        setCreatorUserId(profileData.id);
        
        // Fetch follower count
        const { count } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profileData.id);
        setFollowerCount(count || 0);

        const { data: prompts } = await supabase
          .from('marketplace_prompts')
          .select('id, title, preview_image, price, rating, sales_count, model_type, category')
          .eq('creator_id', profileData.id);
        if (prompts) setCreatorPrompts(prompts);
      }
    };
    fetchCreatorPrompts();
  }, [creatorName]);

  const categories = ['All', ...Array.from(new Set(creatorPrompts.map(p => p.category)))];
  const filteredPrompts = promptFilter === 'All' ? creatorPrompts : creatorPrompts.filter(p => p.category === promptFilter);

  const tabs = [
    { id: 'posts' as const, icon: Grid3X3, label: 'Posts' },
    { id: 'prompts' as const, icon: ShoppingBag, label: 'Prompt Store' },
    { id: 'about' as const, icon: Info, label: 'About' },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-in slide-in-from-right duration-200">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-4 pb-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }} 
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-secondary active:scale-90 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1 truncate">{creatorName}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative h-[140px] w-full overflow-hidden">
          <img src="/default-cover.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        <div className="px-4 pb-2 -mt-12">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-[88px] h-[88px] rounded-full p-[3px] bg-gradient-to-br from-primary via-accent to-primary/40">
                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center border-[3px] border-background">
                  <span className="text-2xl font-bold text-secondary-foreground">{initial}</span>
                </div>
              </div>
            </div>

            <h2 className="text-[15px] font-bold text-foreground mt-2.5 flex items-center gap-1">
              {creatorName}
              {(isVerified || isMockVerified) && <VerifiedBadge size={15} />}
            </h2>
            <p className="text-[11px] text-muted-foreground">@{creatorName.toLowerCase().replace(/\s+/g, '')}</p>
            <p className="text-[12px] text-muted-foreground mt-1 text-center max-w-[240px]">AI Art Creator</p>

            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Sparkles size={9} /> Creator
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                <Calendar size={8} /> 2025
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-0 mt-4 py-3 rounded-xl bg-card/60 border border-border/50">
            <div className="text-center flex-1">
              <p className="text-[15px] font-bold text-foreground">{creatorPosts.length}</p>
              <p className="text-[10px] text-muted-foreground">Posts</p>
            </div>
            <div className="w-px h-7 bg-border/60" />
            <div className="text-center flex-1">
              <p className="text-[15px] font-bold text-foreground">{followerCount}</p>
              <p className="text-[10px] text-muted-foreground">Followers</p>
            </div>
            <div className="w-px h-7 bg-border/60" />
            <div className="text-center flex-1">
              <p className="text-[15px] font-bold text-foreground">{totalSales}</p>
              <p className="text-[10px] text-muted-foreground">Sales</p>
            </div>
            <div className="w-px h-7 bg-border/60" />
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-0.5">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <p className="text-[15px] font-bold text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Rating</p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            {!isOwner && (
              <button
                onClick={async () => {
                  if (!creatorUserId) return;
                  const wasFollowing = isFollowing(creatorUserId);
                  await toggleFollow(creatorUserId);
                  setFollowerCount(prev => wasFollowing ? Math.max(0, prev - 1) : prev + 1);
                  toast.success(wasFollowing ? 'Unfollowed' : 'Following!');
                }}
                disabled={followLoading || !creatorUserId}
                className={`flex-1 py-[7px] rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all ${
                  creatorUserId && isFollowing(creatorUserId)
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {creatorUserId && isFollowing(creatorUserId) ? <UserMinus size={13} /> : <UserPlus size={13} />}
                {creatorUserId && isFollowing(creatorUserId) ? 'Following' : 'Follow'}
              </button>
            )}
            <button
              onClick={() => {
                const url = `${window.location.origin}?profile=${creatorName.toLowerCase().replace(/\s+/g, '')}`;
                if (navigator.share) {
                  navigator.share({ title: `${creatorName} on Qpixa`, url }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(url);
                  toast('Profile link copied!');
                }
              }}
              className="py-[7px] px-4 rounded-lg bg-secondary text-secondary-foreground text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
            >
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>

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

        <div className="pb-20">
          {activeTab === 'posts' && (
            creatorPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5">
                {creatorPosts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onPostTap(p)}
                    className="aspect-square overflow-hidden active:opacity-80 transition-opacity"
                  >
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-3">
                  <Grid3X3 size={28} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-foreground">No Posts</p>
              </div>
            )
          )}

          {activeTab === 'prompts' && (
            creatorPrompts.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide">
                  <SlidersHorizontal size={14} className="text-muted-foreground flex-shrink-0" />
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setPromptFilter(cat)}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                        promptFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2.5 px-3 overflow-x-auto scrollbar-hide flex-wrap pb-1 pt-1">
                  {filteredPrompts.map(p => (
                    <div key={p.id} className="flex-shrink-0 w-[130px] rounded-xl overflow-hidden bg-card border border-border">
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <img src={p.preview_image || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1">
                          <span className="bg-primary/80 text-primary-foreground text-[7px] font-semibold px-1.5 py-0.5 rounded-full">{p.model_type}</span>
                        </div>
                      </div>
                      <div className="p-2">
                        <h3 className="text-[10px] font-semibold text-foreground truncate">{p.title}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-0.5">
                            <Star size={8} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-[9px] font-medium text-foreground">{p.rating}</span>
                          </div>
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-primary">
                            <Coins size={8} />{p.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-3">
                  <ShoppingBag size={28} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-foreground">No Prompts Listed</p>
              </div>
            )
          )}

          {activeTab === 'about' && (
            <div className="space-y-3 p-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">About @{creatorName.toLowerCase().replace(/\s+/g, '')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI art creator sharing stunning AI-generated artwork and prompts with the community.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">Stats</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total Posts</span>
                    <span className="text-xs font-semibold text-foreground">{creatorPosts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total Likes</span>
                    <span className="text-xs font-semibold text-foreground">{totalLikes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total Sales</span>
                    <span className="text-xs font-semibold text-foreground">{totalSales}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Average Rating</span>
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}