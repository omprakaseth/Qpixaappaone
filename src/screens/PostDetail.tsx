"use client";
import { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Download, Copy, UserPlus, UserMinus, Heart, Eye, Bookmark, ZoomIn, ZoomOut, Share2, Play, Star, MessageSquare, Trash2, ShieldAlert, Sparkles, Check, X, Edit2, Save, Plus } from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { generateAltText } from '@/lib/seo-utils';
import { Button } from '@/components/ui/button';
import { Post } from '@/types';
import { useAppState } from '@/context/AppContext';
import { useFollows } from '@/hooks/useFollows';
import VerifiedBadge from '@/components/VerifiedBadge';
import WatermarkedImage from '@/components/WatermarkedImage';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Image from 'next/image';

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
  onPostTap?: (post: Post) => void;
}

export default function PostDetail({ post, onBack, onUsePrompt, onCreatorTap, onPostTap }: PostDetailProps) {
  const { toggleLike, toggleSave, isPro, isLoggedIn, user, profile, deletePost, updatePost, posts } = useAppState();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();
  
  const contentVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 + i * 0.1,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    })
  };

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
    <div className="h-full w-full bg-background overflow-y-auto scrollbar-hide flex flex-col">
      <div className="flex-1 w-full bg-background relative mb-24">
        {/* Header - Floating Back Button */}
        <div className="absolute top-4 left-4 z-[60] safe-top">
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-all text-white hover:bg-black/60 shadow-lg border border-white/10"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Image Section */}
        <div className="relative w-full">
          <div className="cursor-pointer overflow-hidden sm:rounded-t-3xl" onClick={() => setZoomed(!zoomed)}>
            <WatermarkedImage
              src={post.imageUrl}
              alt={generateAltText(post.prompt, post.category)}
              className={cn(
                "w-full h-auto min-h-[300px] object-cover transition-transform duration-700 ease-out",
                zoomed ? "scale-105" : "scale-100"
              )}
              isPro={isPro}
            />
          </div>

          {/* Post Action Bar (Subtle Overlays) */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-10">
            <button
              onClick={() => toggleSave(post.id)}
              className={cn(
                "w-12 h-12 rounded-full backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all active:scale-90 shadow-2xl group",
                post.isSaved ? "bg-primary text-primary-foreground" : "bg-black/30 text-white hover:bg-black/40"
              )}
            >
              <Bookmark size={22} className={cn("transition-transform group-hover:scale-110", post.isSaved ? "fill-current" : "")} />
            </button>
          </div>
        </div>

        <div className="px-5 pt-6">
          {/* Interaction Row */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-1">
              <button
                onClick={handleLike}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all active:scale-90",
                  post.isLiked ? "text-red-500" : "text-foreground/70 hover:text-foreground"
                )}
              >
                <Heart size={24} className={post.isLiked ? "fill-current" : ""} />
                <span className="text-[10px] font-bold">{formatNumber(post.likes)}</span>
              </button>
              <button
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-2xl text-foreground/70 hover:text-foreground transition-all active:scale-90"
                onClick={() => {
                   const reviewsEl = document.getElementById('reviews-section');
                   reviewsEl?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <MessageSquare size={24} />
                <span className="text-[10px] font-bold">{reviews.length}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-2xl text-foreground/70 hover:text-foreground transition-all active:scale-90"
              >
                <Share2 size={24} />
                <span className="text-[10px] font-bold">Share</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-95 transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive active:scale-95 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
              <button
                onClick={handleDownload}
                className="h-12 px-6 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
              >
                Save Photo
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Title & Info */}
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Title</label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full bg-secondary/30 rounded-xl px-4 py-3 outline-none border border-border focus:border-primary text-foreground font-bold"
                  />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground mb-1">{post.title}</h1>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye size={12} /> {formatNumber(post.views)} views</span>
                      <span>•</span>
                      <span>{post.category}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] bg-secondary px-2 py-0.5 rounded">ID: {post.id}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Creator Row */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50">
              <button
                onClick={() => onCreatorTap?.(post.creator.name, post.creator.id)}
                className="flex items-center gap-3 active:opacity-70 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {post.creator.avatar ? (
                    <Image src={post.creator.avatar} alt="" width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-foreground">{post.creator.initials}</span>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground flex items-center gap-1">
                    {post.creator.name} {post.creator.isVerified && <VerifiedBadge size={14} />}
                  </p>
                  <p className="text-xs text-muted-foreground">{post.creator.username}</p>
                </div>
              </button>
              <button
                onClick={handleFollow}
                disabled={followLoading || isOwner}
                className={cn(
                  "px-6 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95",
                  following ? "bg-background text-foreground border border-border" : "bg-foreground text-background",
                  isOwner && "hidden"
                )}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* Prompt Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  AI Prompt
                </h3>
                <button 
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-full bg-secondary/50 text-[10px] font-bold text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5"
                >
                  <Copy size={12} /> COPY
                </button>
              </div>
              {isEditing ? (
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="w-full bg-secondary/30 p-4 rounded-2xl border border-border focus:border-primary outline-none text-sm text-foreground leading-relaxed font-medium resize-none"
                  rows={4}
                />
              ) : (
                <div className="relative group">
                  <p className="text-sm text-foreground leading-relaxed bg-secondary/20 p-5 rounded-2xl border border-border/40 font-medium">
                    {post.prompt}
                  </p>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-foreground">Tags & Keywords</h3>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTags}
                  onChange={(e) => setEditedTags(e.target.value)}
                  className="w-full bg-secondary/30 px-4 py-3 rounded-xl border border-border focus:border-primary outline-none text-sm text-foreground"
                  placeholder="Art, Digital, Cool"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-4 py-2 rounded-xl bg-secondary/40 text-[11px] font-bold text-muted-foreground border border-border/30 hover:bg-secondary/60 transition-colors cursor-default">
                      #{tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isEditing && (
              <Button 
                onClick={handleUpdate} 
                className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            )}

            {/* Divider */}
            <div className="h-px bg-border/50 w-full" />

            {/* More details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Star size={16} className="text-primary" />
                  Copyright Info
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  © 2026 Qpixa Creative Rights. This content belongs to <span className="font-bold text-foreground">{post.creator.name}</span>. 
                  Purchasing or using this prompt grants you a standard license for personal and commercial projects.
                  <br /><span className="mt-2 block font-mono">Content UID: {post.id}</span>
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  Best Use Cases
                </h3>
                <div className="flex flex-wrap gap-2">
                  {useCases.map((uc, i) => (
                    <div key={i} className="px-3 py-1.5 rounded-xl bg-primary/5 text-[10px] font-bold text-primary border border-primary/10">
                      {uc}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Related Prompts */}
            {relatedPosts.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-foreground">More to explore</h3>
                <div className="grid grid-cols-2 gap-4">
                  {relatedPosts.map((rp) => (
                    <div 
                      key={rp.id} 
                      className="group cursor-pointer space-y-2"
                      onClick={() => onPostTap?.(rp)}
                    >
                      <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-secondary relative">
                        <Image 
                          src={rp.imageUrl} 
                          alt=""
                          fill
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus size={24} className="text-white" />
                        </div>
                      </div>
                      <div className="px-1">
                        <p className="text-[11px] font-bold text-foreground truncate">{rp.title}</p>
                        <p className="text-[10px] text-muted-foreground">{rp.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div id="reviews-section" className="space-y-6 pt-4 pb-12">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">
                  Reviews & Feedback ({reviews.length})
                </h3>
              </div>
              
              <div className="bg-secondary/20 rounded-3xl p-5 border border-border/50">
                <p className="text-xs font-bold text-foreground mb-4">Rate this prompt</p>
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} className="transition-transform active:scale-125">
                      <Star size={24} fill={star <= rating ? '#FFB800' : 'none'} color={star <= rating ? '#FFB800' : 'currentColor'} className={cn(star <= rating ? "text-yellow-400" : "text-muted-foreground/30")} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What do you think about this result?"
                  className="w-full bg-background/50 rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-all resize-none mb-4"
                  rows={3}
                />
                <button
                  onClick={handleSubmitReview}
                  className="w-full py-3 bg-foreground text-background text-xs font-bold rounded-xl active:scale-[0.98] transition-all"
                >
                  Post Review
                </button>
              </div>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="flex gap-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-secondary shrink-0 overflow-hidden mt-1">
                      {review.profiles?.avatar_url && <Image src={review.profiles.avatar_url} alt="" width={32} height={32} className='w-full h-full object-cover' />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{review.profiles?.display_name || 'Creator'}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={8} fill={i < review.rating ? '#FFB800' : 'none'} color={i < review.rating ? '#FFB800' : 'currentColor'} className="text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{review.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
