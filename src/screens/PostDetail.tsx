import { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Download, Copy, UserPlus, UserMinus, Heart, Eye, Bookmark, ZoomIn, ZoomOut, Share2, Play, Star, MessageSquare, Trash2, ShieldAlert, Sparkles, Check, X, Edit2, Save } from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { generateAltText } from '@/lib/seo-utils';
import { Button } from '@/components/ui/button';
import { Post } from '@/context/AppContext';
import { useAppState } from '@/context/AppContext';
import { useFollows } from '@/hooks/useFollows';
import VerifiedBadge from '@/components/VerifiedBadge';
import WatermarkedImage from '@/components/WatermarkedImage';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/integrations/supabase/client';

interface Comment {
  id: string;
  content: string;
  rating: number;
  user_id: string;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string;
  };
}

interface PostDetailProps {
  post: Post;
  onBack: () => void;
  onUsePrompt?: (prompt: string) => void;
  onCreatorTap?: (creatorName: string, creatorId?: string) => void;
}

export default function PostDetail({ post, onBack, onUsePrompt, onCreatorTap }: PostDetailProps) {
  const { toggleLike, toggleSave, isPro, isLoggedIn, user, profile, deletePost, updatePost, posts } = useAppState();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();
  
  const relatedPosts = useMemo(() => {
    return posts
      .filter(p => p.id !== post.id && (p.category === post.category || p.tags.some(t => post.tags.includes(t))))
      .slice(0, 4);
  }, [posts, post]);

  const useCases = useMemo(() => {
    const cases = [
      "Digital Art & Illustration",
      "Social Media Content",
      "Website Hero Images",
      "Marketing Materials",
      "Creative Inspiration",
      "Personal Projects"
    ];
    // Deterministic selection based on prompt
    const seed = post.prompt.length;
    return [cases[seed % cases.length], cases[(seed + 1) % cases.length]];
  }, [post.prompt]);

  const [zoomed, setZoomed] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState<Comment[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedPrompt, setEditedPrompt] = useState(post.prompt);
  const [editedTags, setEditedTags] = useState(post.tags.join(', '));
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      const { data, error } = await (supabase as any)
        .from('post_comments')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReviews(data as unknown as Comment[]);
      }
      setLoadingReviews(false);
    };

    fetchReviews();
  }, [post.id]);

  if (!post || !post.creator) {
    return (
      <div className="fixed inset-0 z-[70] bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Post not found or malformed.</p>
        <button onClick={onBack} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  // Use creator id if available, fallback
  const creatorId = post.creator.id || '';
  const following = isFollowing(creatorId);
  const isOwner = Boolean(user?.id && creatorId && user.id === creatorId);

  const handleFollow = async () => {
    if (!isLoggedIn) {
      toast.error('Please sign in to follow creators');
      return;
    }
    if (!creatorId) return;
    await toggleFollow(creatorId);
    toast.success(following ? 'Unfollowed' : 'Following!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.prompt, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard?.writeText(post.prompt);
      toast.success('Prompt copied!');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = post.imageUrl;
    a.download = `${post.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    a.target = '_blank';
    a.click();
  };

  const handleLike = () => {
    toggleLike(post.id);
    if (!post.isLiked) toast.success('Liked!');
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(post.prompt);
    toast.success('Prompt copied!');
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn || !user) {
      toast.error('Please sign in to leave a review');
      return;
    }
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Please write a review');
      return;
    }
    
    try {
      const { data, error } = await (supabase as any)
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: reviewText,
          rating: rating
        })
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Send notification to post creator
      if (post.creator.id !== user.id) {
        await (supabase as any).from('user_notifications').insert({
          user_id: post.creator.id,
          actor_id: user.id,
          type: 'comment',
          title: 'New Comment! 💬',
          message: `${profile?.display_name || 'Someone'} commented on your post "${post.title}"`,
          link: `/post/${post.id}`
        });
      }

      setReviews([data as unknown as Comment, ...reviews]);
      setReviewText('');
      setRating(0);
      toast.success('Review submitted!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    }
  };

  const handleDelete = async () => {
    await deletePost(post.id);
    onBack();
  };

  const handleReport = () => {
    setShowReportConfirm(false);
    toast.success('Report submitted. Our team will review this content.');
  };

  const handleUpdate = async () => {
    if (!editedTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }
    if (!editedPrompt.trim()) {
      toast.error('Prompt cannot be empty');
      return;
    }

    setIsUpdating(true);
    try {
      await updatePost(post.id, {
        title: editedTitle.trim(),
        prompt: editedPrompt.trim(),
        tags: editedTags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setIsEditing(false);
    } catch (err) {
      // Error handled in AppContext
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background overflow-y-auto scrollbar-hide animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-md safe-top">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-sm font-bold text-foreground flex-1 truncate">
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full bg-secondary/50 rounded-lg px-2 py-1 outline-none border border-primary/20 focus:border-primary"
              placeholder="Post Title"
              autoFocus
            />
          ) : (
            post.title
          )}
        </h1>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground"
                  >
                    <X size={16} />
                  </button>
                  <button 
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20"
                  >
                    {isUpdating ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center active:scale-95 transition-transform text-primary"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center active:scale-95 transition-transform text-destructive">
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <button onClick={() => setShowReportConfirm(true)} className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center active:scale-95 transition-transform text-muted-foreground hover:text-destructive">
              <ShieldAlert size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Image Section */}
      <div className="relative group">
        <div className="cursor-pointer" onClick={() => setZoomed(!zoomed)}>
          <WatermarkedImage
            src={post.imageUrl}
            alt={generateAltText(post.prompt, post.category)}
            className={cn(
              "w-full transition-transform duration-500 ease-out",
              zoomed ? 'scale-110' : 'scale-100'
            )}
            isPro={isPro}
          />
        </div>

        {/* Image Overlays */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
          <button
            onClick={handleLike}
            className={cn(
              "w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-lg",
              post.isLiked ? "bg-red-500 text-white" : "bg-black/30 text-white border border-white/10"
            )}
          >
            <Heart size={20} className={post.isLiked ? "fill-current" : ""} />
          </button>
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-10">
          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all active:scale-90 shadow-lg"
          >
            <Download size={20} />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all active:scale-90 shadow-lg"
          >
            <Share2 size={20} />
          </button>
          <button
            onClick={() => toggleSave(post.id)}
            className={cn(
              "w-10 h-10 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-all active:scale-90 shadow-lg",
              post.isSaved ? "bg-primary text-white" : "bg-black/30 text-white"
            )}
          >
            <Bookmark size={20} className={post.isSaved ? "fill-current" : ""} />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 text-white">
            <Eye size={14} />
            <span className="text-xs font-bold">{formatNumber(post.views)}</span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-32">
        {/* Creator Row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onCreatorTap?.(post.creator.name, post.creator.id)}
            className="flex items-center gap-3 active:opacity-70 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
              {post.creator.avatar ? (
                <img src={post.creator.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-foreground">{post.creator.initials}</span>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground flex items-center gap-1">
                {post.creator.name} {post.creator.isVerified && <VerifiedBadge size={14} />}
              </p>
              <p className="text-[11px] text-muted-foreground">{post.creator.username}</p>
            </div>
          </button>
          <button
            onClick={handleFollow}
            disabled={followLoading || isOwner}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-bold transition-all active:scale-95",
              following ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground",
              isOwner && "hidden"
            )}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Prompt Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prompt</h3>
            {!isEditing && (
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <Copy size={12} /> COPY
              </button>
            )}
          </div>
          {isEditing ? (
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="w-full bg-secondary/20 p-4 rounded-2xl border border-primary/20 focus:border-primary outline-none text-sm text-foreground leading-relaxed font-medium resize-none"
              rows={4}
              placeholder="Write your prompt..."
            />
          ) : (
            <p className="text-sm text-foreground leading-relaxed font-medium bg-secondary/20 p-4 rounded-2xl border border-border/50">
              {post.prompt}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="mb-8">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Tags</h3>
          {isEditing ? (
            <input
              type="text"
              value={editedTags}
              onChange={(e) => setEditedTags(e.target.value)}
              className="w-full bg-secondary/20 px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-xs text-foreground font-medium"
              placeholder="comma, separated, tags"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-secondary/50 text-[10px] font-bold text-muted-foreground border border-border/30">
                  #{tag.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* About this Prompt Section */}
        <div className="border-t border-border pt-6 mt-6">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-primary" />
            About this Prompt
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This high-quality AI prompt is designed to generate stunning {post.category.toLowerCase()} images. 
            It uses advanced descriptive keywords to ensure consistent and professional results. 
            Perfect for creators looking for inspiration in the {post.category} space.
          </p>
        </div>

        {/* Use Cases Section */}
        <div className="border-t border-border pt-6 mt-6">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Check size={16} className="text-primary" />
            Best Use Cases
          </h3>
          <div className="flex flex-wrap gap-2">
            {useCases.map((uc, i) => (
              <div key={i} className="px-3 py-1.5 rounded-xl bg-primary/5 text-[10px] font-medium text-primary border border-primary/10">
                {uc}
              </div>
            ))}
          </div>
        </div>

        {/* Related Prompts Section (Internal Linking) */}
        {relatedPosts.length > 0 && (
          <div className="border-t border-border pt-6 mt-6">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-primary" />
              Related AI Prompts
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {relatedPosts.map((rp) => (
                <div 
                  key={rp.id} 
                  className="group cursor-pointer"
                  onClick={() => {
                    onBack();
                    // We need a way to open the new post, but for now this is good for SEO
                    // In a real app, this would navigate to /prompt/:id
                    window.location.href = `/prompt/${rp.id}`;
                  }}
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-secondary relative mb-2">
                    <img 
                      src={rp.imageUrl} 
                      alt={generateAltText(rp.prompt, rp.category)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye size={20} className="text-white" />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-foreground truncate">{rp.title}</p>
                  <p className="text-[9px] text-muted-foreground">{rp.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" /> 
              Reviews ({reviews.length})
            </h3>
          </div>
          
          <div className="bg-secondary/30 rounded-2xl p-4 mb-6 border border-border/50">
            <div className="flex items-center gap-1.5 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="transition-transform active:scale-110">
                  <Star size={20} fill={star <= rating ? '#FFB800' : 'none'} color={star <= rating ? '#FFB800' : 'currentColor'} className={cn(star <= rating ? "text-yellow-400" : "text-muted-foreground/40")} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none mb-3"
              rows={2}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmitReview}
                className="px-6 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                Submit Review
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loadingReviews ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-secondary/10 rounded-2xl p-4 border border-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden">
                        {review.profiles?.avatar_url && <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-xs font-bold text-foreground">{review.profiles?.display_name || 'User'}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < review.rating ? '#FFB800' : 'none'} color={i < review.rating ? '#FFB800' : 'currentColor'} className="text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{review.content}</p>
                </div>
              ))
            )}
            {!loadingReviews && reviews.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare size={32} className="mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">No reviews yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent pt-10 z-50">
        <Button
          onClick={() => onUsePrompt?.(post.prompt)}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Sparkles size={20} />
          Use Prompt in Studio
        </Button>
      </div>
    </div>
  );
}
