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
import { useIsMobile } from '@/hooks/use-mobile';
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
  // Defensive defaults for malformed post objects
  const safePost = useMemo(() => ({
    ...post,
    prompt: post?.prompt || '',
    tags: post?.tags || [],
    category: post?.category || 'General',
    likes: post?.likes ?? 0,
    views: post?.views ?? 0,
    creator: post?.creator || { id: '', name: 'Unknown', username: 'user', initials: 'U', avatar: '' }
  }), [post]);

  const { toggleLike, toggleSave, isPro, isLoggedIn, user, profile, deletePost, updatePost, posts } = useAppState();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();
  
  const relatedPosts = useMemo(() => {
    return posts
      .filter(p => p.id !== safePost.id && (p.category === safePost.category || (p.tags && p.tags.some(t => safePost.tags.includes(t)))))
      .slice(0, 4);
  }, [posts, safePost]);

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
    const seed = safePost.prompt.length;
    return [cases[seed % cases.length], cases[(seed + 1) % cases.length]];
  }, [safePost.prompt]);

  const [showFullViewer, setShowFullViewer] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState<Comment[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTimer, setDeleteTimer] = useState<number | null>(null);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMobile = useIsMobile();

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
  const [editedTitle, setEditedTitle] = useState(safePost.title);
  const [editedPrompt, setEditedPrompt] = useState(safePost.prompt);
  const [editedTags, setEditedTags] = useState(safePost.tags.join(', '));
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
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

        if (error) {
          if (error.message?.includes('not found') || error.code === 'PGRST116') {
            console.warn('Comments table not yet available in this database instance.');
          } else {
            console.error('Error fetching comments:', error);
          }
          setReviews([]);
        } else if (data) {
          setReviews(data as unknown as Comment[]);
        }
      } catch (err) {
        console.error('Catch fetching comments:', err);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [post.id]);

  if (!post) {
    return (
      <div className="fixed inset-0 z-[70] bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Post not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  // Use creator id if available, fallback
  const creatorId = safePost.creator.id || '';
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
        await navigator.share({ title: safePost.title, text: safePost.prompt, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard?.writeText(safePost.prompt);
      toast.success('Prompt copied!');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = safePost.imageUrl;
    a.download = `${safePost.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    a.target = '_blank';
    a.click();
  };

  const handleLike = () => {
    toggleLike(safePost.id);
    if (!safePost.isLiked) toast.success('Liked!');
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(safePost.prompt);
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
          post_id: safePost.id,
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
      if (safePost.creator.id !== user.id) {
        await (supabase as any).from('user_notifications').insert({
          user_id: safePost.creator.id,
          actor_id: user.id,
          type: 'comment',
          title: 'New Comment! 💬',
          message: `${profile?.display_name || 'Someone'} commented on your post "${safePost.title}"`,
          link: `/post/${safePost.id}`
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
    await deletePost(safePost.id);
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
      await updatePost(safePost.id, {
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
    <div className="fixed inset-0 z-[70] flex justify-end pointer-events-none">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onBack}
        className="absolute inset-0 bg-black/60 pointer-events-auto backdrop-blur-sm"
      />

      <motion.div 
        ref={scrollRef}
        onScroll={handleContainerScroll}
        initial={isMobile ? { y: '100%' } : { x: '100%' }}
        animate={isMobile ? { y: 0 } : { x: 0 }}
        exit={isMobile ? { y: '100%' } : { x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "relative h-full bg-background overflow-y-auto scrollbar-hide pointer-events-auto shadow-2xl flex flex-col",
          isMobile ? "w-full" : "w-[600px] xl:w-[800px]"
        )}
      >
        {/* Header Controls (Sticky) */}
        <div className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto active:scale-90 transition-all"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button onClick={handleShare} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
              <Share2 size={18} />
            </button>
            <button onClick={handleDownload} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className={cn(
          "flex flex-col",
          !isMobile && "xl:flex-row h-full"
        )}>
          {/* Image Section */}
          <div className={cn(
            "relative bg-black flex items-center justify-center overflow-hidden shrink-0",
            isMobile ? "h-[60vh] w-full" : "xl:w-1/2 xl:h-full"
          )}>
            <img
              src={safePost.imageUrl}
              alt={safePost.title}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={() => setShowFullViewer(true)}
              className="absolute bottom-4 right-4 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors"
            >
              <Maximize size={18} />
            </button>
          </div>

          {/* Details Scroll Area */}
          <div className={cn(
            "flex-1 bg-background",
            !isMobile && "overflow-y-auto"
          )}>
            <div className="p-6 md:p-8">
              {/* Title & Stats */}
              <div className="mb-6">
                <h1 className="text-2xl font-black tracking-tight mb-2 uppercase italic">{safePost.title}</h1>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1 text-xs font-bold ring-1 ring-border px-2 py-1 rounded">
                    <Eye size={12} /> {formatNumber(safePost.views)}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold ring-1 ring-border px-2 py-1 rounded">
                    <Heart size={12} /> {formatNumber(safePost.likes)}
                  </span>
                </div>
              </div>

              {/* Creator Card */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary">
                    {safePost.creator.avatar ? <img src={safePost.creator.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{safePost.creator.initials}</div>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-1">
                      {safePost.creator.name} {safePost.creator.isVerified && <VerifiedBadge size={12} />}
                    </p>
                    <p className="text-xs text-muted-foreground">@{safePost.creator.username}</p>
                  </div>
                </div>
                {!isOwner && (
                  <button 
                    onClick={handleFollow}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      following ? "bg-white/10 text-white" : "bg-primary text-white"
                    )}
                  >
                    {following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 mb-8">
                <button onClick={handleLike} className={cn("flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all active:scale-95", safePost.isLiked ? "bg-red-500/10 border-red-500 text-red-500" : "bg-white/5 border-white/5 text-white")}>
                  <Heart size={18} className={safePost.isLiked ? "fill-current" : ""} /> {formatNumber(safePost.likes)}
                </button>
                <button onClick={() => toggleSave(safePost.id)} className={cn("flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all active:scale-95", safePost.isSaved ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/5 text-white")}>
                  <Bookmark size={18} className={safePost.isSaved ? "fill-current" : ""} /> Save
                </button>
              </div>

              {/* Prompt Box */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 mb-8">
                <p className="text-[10px] font-black tracking-widest text-primary uppercase mb-3">Generation Prompt</p>
                <p className="text-sm text-foreground/80 leading-relaxed italic mb-4">"{safePost.prompt}"</p>
                <button 
                  onClick={handleCopy}
                  className="w-full h-10 rounded-xl bg-white/10 text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                >
                  <Copy size={14} /> Copy Prompt
                </button>
              </div>

              {/* Comments Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold">Comments ({reviews.length})</h3>
                
                <div className="bg-white/5 p-4 rounded-xl space-y-4">
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full bg-transparent text-sm outline-none resize-none"
                    rows={2}
                  />
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setRating(s)}>
                          <Star size={16} fill={s <= rating ? '#FFB800' : 'none'} className={s <= rating ? "text-yellow-400" : "text-white/20"} />
                        </button>
                      ))}
                    </div>
                    <button onClick={handleSubmitReview} className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold">Post</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 shrink-0 overflow-hidden">
                        {r.profiles?.avatar_url && <img src={r.profiles.avatar_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold">{r.profiles?.display_name || 'User'}</p>
                          <span className="text-[10px] text-muted-foreground opacity-50">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{r.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Undo Delete Overlay */}
      {/* ... */}

      <AnimatePresence>
        {showFullViewer && (
          <ImageViewer
            url={safePost.imageUrl}
            alt={safePost.title}
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
