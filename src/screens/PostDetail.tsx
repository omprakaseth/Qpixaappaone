import { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Download, Copy, UserPlus, UserMinus, Heart, Eye, Bookmark, ZoomIn, ZoomOut, Share2, Play, Star, MessageSquare, Trash2, ShieldAlert, Sparkles, Check, X, Edit2, Save, MoreVertical, Maximize } from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { generateAltText } from '@/lib/seo-utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageViewer } from '@/components/ImageViewer';
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

  const [showFullViewer, setShowFullViewer] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState<Comment[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTimer, setDeleteTimer] = useState<number | null>(null);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  const initiateDelete = () => {
    setIsDeleting(true);
    setDeleteTimer(5);
    
    const countdown = setInterval(() => {
      setDeleteTimer(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    timerRef.current = setTimeout(async () => {
      clearInterval(countdown);
      await deletePost(post.id);
      onBack();
      toast.success('Post deleted permanently');
    }, 5000);
  };

  const cancelDelete = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsDeleting(false);
    setDeleteTimer(null);
    toast.info('Deletion cancelled');
  };
  
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
    <div 
      ref={scrollRef}
      onScroll={handleContainerScroll}
      className="fixed inset-0 z-[70] bg-background overflow-y-auto scrollbar-hide animate-in slide-in-from-bottom-4 duration-500"
    >
      {/* Undo Delete Overlay */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-4 right-4 z-[100] bg-zinc-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-[11px] font-bold">
                {deleteTimer}
              </div>
              <p className="text-sm font-medium">Deleting post permanently...</p>
            </div>
            <button
              onClick={cancelDelete}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Confirmation */}
      <AlertDialog open={showReportConfirm} onOpenChange={setShowReportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report this post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this post for a community guidelines violation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReport}>
              Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-[80] flex items-center justify-between p-4 safe-top pointer-events-none">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }} 
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-all text-white shadow-xl pointer-events-auto"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={handleShare} className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-all text-white shadow-xl">
            <Share2 size={20} />
          </button>
          <button onClick={handleDownload} className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-all text-white shadow-xl">
            <Download size={20} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-all text-white shadow-xl">
                <MoreVertical size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit2 size={16} /> Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={initiateDelete} className="gap-2 text-destructive">
                    <Trash2 size={16} /> Delete Post
                  </DropdownMenuItem>
                </>
              )}
              {!isOwner && (
                <DropdownMenuItem onClick={() => setShowReportConfirm(true)} className="gap-2 text-destructive">
                  <ShieldAlert size={16} /> Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="relative w-full h-[65vh] bg-black flex items-center justify-center overflow-hidden">
        <motion.button 
          style={{ y: scrollY * 0.3 }}
          className="w-full h-full p-0 border-none bg-transparent active:scale-[0.98] transition-transform"
          onClick={() => setShowFullViewer(true)}
        >
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </motion.button>
        <div className="absolute bottom-4 right-4 text-[10px] bg-black/20 text-white/40 px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none">
          Tap to zoom
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-background relative -mt-4 rounded-t-[24px] z-10 px-6 pt-8 pb-32">
        {/* Title & Stats */}
        <div className="mb-6">
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-2xl font-bold bg-secondary/30 w-full px-4 py-2 rounded-xl border border-primary/20 mb-2 focus:border-primary outline-none"
            />
          ) : (
            <h1 className="text-[24px] font-bold tracking-tight text-foreground mb-1 leading-tight">
              {post.title}
            </h1>
          )}
          
          <div className="flex items-center gap-4 text-muted-foreground/70">
            <span className="flex items-center gap-1 text-[13px] font-medium">
              <Eye size={12} /> {formatNumber(post.views)}
            </span>
            <span className="flex items-center gap-1 text-[13px] font-medium">
              <Heart size={12} /> {formatNumber(post.likes)}
            </span>
            <span className="flex items-center gap-1 text-[13px] font-medium">
              <MessageSquare size={12} /> {reviews.length}
            </span>
          </div>
        </div>

        {/* Creator Info */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onCreatorTap?.(post.creator.name, post.creator.id)}
            className="flex items-center gap-3 active:opacity-70 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border border-border">
              {post.creator.avatar ? (
                <img src={post.creator.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                  {post.creator.initials}
                </div>
              )}
            </div>
            <div className="text-left">
              <p className="text-[15px] font-semibold text-foreground flex items-center gap-1 leading-none">
                {post.creator.name} {post.creator.isVerified && <VerifiedBadge size={14} />}
              </p>
              <p className="text-[13px] text-muted-foreground">@{post.creator.username}</p>
            </div>
          </button>
          
          {!isOwner && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={cn(
                "px-5 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95",
                following ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"
              )}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={handleLike}
            className={cn(
              "flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold transition-all active:scale-95",
              post.isLiked ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-secondary text-foreground"
            )}
          >
            <Heart size={18} className={post.isLiked ? "fill-current" : ""} />
            {formatNumber(post.likes)}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-all shrink-0"
              >
                <MoreVertical size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={handleShare} className="gap-2">
                <Share2 size={16} /> Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} className="gap-2">
                <Download size={16} /> Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Sticky Bottom Actions */}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 z-50 p-6 pb-10 transition-all duration-500 ease-out",
          scrollY > 400 
            ? "translate-y-0 opacity-100" 
            : "translate-y-full opacity-0"
        )}>
          <div className="max-w-md mx-auto relative group">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Button 
               onClick={() => toggleSave(post.id)}
               className="w-full h-16 rounded-3xl bg-primary/95 backdrop-blur-xl text-primary-foreground text-[16px] font-black shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 border border-white/10 relative"
            >
              <Bookmark size={22} className={post.isSaved ? "fill-current" : ""} />
              {post.isSaved ? "Saved to Favorites" : "Save Image"}
            </Button>
          </div>
        </div>

        {/* Prompt Section */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-secondary/10">
          <button 
            onClick={() => setIsPromptExpanded(!isPromptExpanded)}
            className="w-full flex items-center justify-between p-4 bg-secondary/20"
          >
            <span className="text-[13px] font-bold uppercase tracking-wider text-primary">Prompt Details</span>
            <div className={cn("transition-transform", isPromptExpanded ? "rotate-180" : "")}>
              <ArrowLeft size={16} className="-rotate-90" />
            </div>
          </button>
          <AnimatePresence>
            {isPromptExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="p-4 pt-0">
                  {isEditing ? (
                    <textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      className="w-full bg-secondary/30 p-4 rounded-xl border border-primary/20 focus:border-primary outline-none text-[14px] text-foreground leading-relaxed font-medium resize-none"
                      rows={4}
                    />
                  ) : (
                    <div className="pt-4">
                      <p className="text-[15px] text-foreground leading-relaxed italic">
                        "{post.prompt}"
                      </p>
                      <button 
                        onClick={handleCopy}
                        className="mt-4 flex items-center gap-2 text-[12px] font-bold text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Copy size={14} /> Copy full prompt
                      </button>
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="mt-4 flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-[13px]">Cancel</Button>
                      <Button onClick={handleUpdate} disabled={isUpdating} className="text-[13px]">
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Meta / Tags */}
        <div className="flex flex-wrap gap-2 mb-10">
          {post.tags.map(tag => (
            <span key={tag} className="px-3 py-1.5 rounded-lg bg-secondary text-[12px] font-medium text-muted-foreground border border-border/50">
              #{tag}
            </span>
          ))}
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-foreground">Comments</h2>
            <span className="text-xs font-bold text-primary">{reviews.length} Total</span>
          </div>
          
          <div className="bg-secondary/20 p-6 rounded-[2rem] border border-border/50">
            <p className="text-sm font-bold text-foreground mb-4">Add a comment</p>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your thoughts on this creation..."
              className="w-full bg-transparent text-sm text-foreground outline-none resize-none mb-4"
              rows={2}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)}>
                    <Star size={18} fill={star <= rating ? '#FFB800' : 'none'} className={cn(star <= rating ? "text-yellow-400" : "text-muted-foreground/30")} />
                  </button>
                ))}
              </div>
              <button
                onClick={handleSubmitReview}
                className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-black rounded-xl"
              >
                Post Comment
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary shrink-0 overflow-hidden">
                  {review.profiles?.avatar_url && <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold">{review.profiles?.display_name || 'User'}</p>
                    <span className="text-[10px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
                </div>
              </div>
            ))}
          </div>

          {relatedPosts.length > 0 && (
            <div className="pt-10 border-t border-border mt-10">
              <h2 className="text-xl font-black text-foreground mb-6">Related Creations</h2>
              <div className="grid grid-cols-2 gap-4">
                {relatedPosts.map((p) => (
                  <button 
                    key={p.id} 
                    onClick={() => onBack()} // In a real app we'd navigate to this post
                    className="aspect-square rounded-2xl overflow-hidden bg-secondary active:scale-95 transition-transform"
                  >
                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFullViewer && (
          <ImageViewer
            url={post.imageUrl}
            alt={post.title}
            onClose={() => setShowFullViewer(false)}
            onDownload={handleDownload}
            onShare={handleShare}
            isOwner={isOwner}
            onDelete={initiateDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
