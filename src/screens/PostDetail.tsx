import { useState } from 'react';
import { ArrowLeft, Download, Copy, UserPlus, UserMinus, Heart, Eye, Bookmark, ZoomIn, ZoomOut, Share2, Play, Star, MessageSquare, Trash2, ShieldAlert } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Post } from '@/context/AppContext';
import { useAppState } from '@/context/AppContext';
import { useFollows } from '@/hooks/useFollows';
import VerifiedBadge from '@/components/VerifiedBadge';
import WatermarkedImage from '@/components/WatermarkedImage';
import { toast } from 'sonner';

interface PostDetailProps {
  post: Post;
  onBack: () => void;
  onUsePrompt?: (prompt: string) => void;
  onCreatorTap?: (creatorName: string, creatorId?: string) => void;
}

export default function PostDetail({ post, onBack, onUsePrompt, onCreatorTap }: PostDetailProps) {
  const { toggleLike, toggleSave, isPro, isLoggedIn, user, deletePost } = useAppState();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();
  const [zoomed, setZoomed] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState<{rating: number, text: string, user: string}[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);

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

  const handleSubmitReview = () => {
    if (!isLoggedIn) {
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
    
    setReviews([{ rating, text: reviewText, user: 'You' }, ...reviews]);
    setReviewText('');
    setRating(0);
    toast.success('Review submitted!');
  };

  const handleDelete = async () => {
    await deletePost(post.id);
    onBack();
  };

  const handleReport = () => {
    setShowReportConfirm(false);
    toast.success('Report submitted. Our team will review this content.');
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background overflow-y-auto scrollbar-hide animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-sm safe-top">
        <button onClick={onBack} className="active:scale-95 transition-transform">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex-1 truncate">{post.title}</h1>
        {isOwner ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="active:scale-95 transition-transform text-destructive">
            <Trash2 size={20} />
          </button>
        ) : (
          <button onClick={() => setShowReportConfirm(true)} className="active:scale-95 transition-transform text-muted-foreground hover:text-destructive">
            <ShieldAlert size={20} />
          </button>
        )}
      </div>

      {showReportConfirm && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground mb-2">Report Copyright Violation?</h3>
            <p className="text-sm text-muted-foreground mb-6">If you believe this content violates copyright or community guidelines, please report it. False reports may lead to account suspension.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowReportConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleReport}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground mb-2">Delete Post?</h3>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone. Are you sure you want to delete this post?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image */}
      <div className="relative cursor-pointer" onClick={() => setZoomed(!zoomed)}>
        <WatermarkedImage
          src={post.imageUrl}
          alt={post.title}
          className={`w-full transition-transform duration-300 ${zoomed ? 'scale-150' : 'scale-100'}`}
          isPro={isPro}
        />
        <div className="absolute bottom-3 right-3 bg-black/50 rounded-full p-2">
          {zoomed ? <ZoomOut size={16} className="text-white" /> : <ZoomIn size={16} className="text-white" />}
        </div>
      </div>

      {/* Creator - tappable */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => onCreatorTap?.(post.creator.name, post.creator.id)}
          className="flex items-center gap-2.5 active:opacity-70 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-bold text-secondary-foreground">{post.creator.initials}</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
              {post.creator.name} {post.creator.isVerified && <VerifiedBadge size={14} />}
            </p>
            <p className="text-[11px] text-muted-foreground">{post.creator.username}</p>
          </div>
        </button>
        <button
          onClick={handleFollow}
          disabled={followLoading || isOwner}
          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all ${
            following
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-primary text-primary-foreground'
          } ${isOwner ? 'opacity-50 cursor-not-allowed hidden' : ''}`}
        >
          {following ? <UserMinus size={14} /> : <UserPlus size={14} />}
          {following ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Prompt */}
      <div className="px-4 pb-3">
        <h3 className="text-xs font-semibold text-muted-foreground mb-1">PROMPT</h3>
        <p className="text-sm text-foreground leading-relaxed">{post.prompt}</p>
      </div>

      {/* Tags */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {post.tags.map(tag => (
          <span key={tag} className="px-2.5 py-1 rounded-full bg-secondary text-xs text-secondary-foreground">
            #{tag}
          </span>
        ))}
      </div>

      {/* Stats - interactive */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-border">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Eye size={16} /> {formatNumber(post.views)}
        </span>
        <button onClick={handleLike} className="flex items-center gap-1.5 text-sm text-muted-foreground active:scale-95 transition-transform">
          <Heart size={16} fill={post.isLiked ? 'hsl(var(--primary))' : 'none'} color={post.isLiked ? 'hsl(var(--primary))' : 'currentColor'} />
          {formatNumber(post.likes)}
        </button>
        <button onClick={() => toggleSave(post.id)} className="flex items-center gap-1.5 text-sm text-muted-foreground active:scale-95 transition-transform">
          <Bookmark size={16} fill={post.isSaved ? 'hsl(var(--primary))' : 'none'} color={post.isSaved ? 'hsl(var(--primary))' : 'currentColor'} />
          {formatNumber(post.saves)}
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2.5 px-4 py-3 pb-8">
        <button
          onClick={handleCopy}
          className="py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
        >
          <Copy size={16} /> Copy Prompt
        </button>
        <button
          onClick={handleDownload}
          className="py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
        >
          <Download size={16} /> Download
        </button>
        <button
          onClick={handleShare}
          className="py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
        >
          <Share2 size={16} /> Share
        </button>
        <button
          onClick={() => toggleSave(post.id)}
          className="py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
        >
          <Bookmark size={16} fill={post.isSaved ? 'hsl(var(--primary))' : 'none'} color={post.isSaved ? 'hsl(var(--primary))' : 'currentColor'} />
          {post.isSaved ? 'Saved' : 'Save'}
        </button>
        <button
          onClick={() => onUsePrompt?.(post.prompt)}
          className="py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 col-span-2 active:scale-[0.97] transition-transform"
        >
          <Play size={16} /> Use Prompt
        </button>
      </div>

      {/* Reviews Section */}
      <div className="px-4 pb-12 border-t border-border pt-4">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare size={16} /> Reviews ({reviews.length})
        </h3>
        
        <div className="bg-secondary/50 rounded-xl p-3 mb-6">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)}>
                <Star size={20} fill={star <= rating ? '#FFB800' : 'none'} color={star <= rating ? '#FFB800' : 'currentColor'} className="text-muted-foreground" />
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write a review..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none mb-2"
            rows={2}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmitReview}
              className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg active:scale-95 transition-transform"
            >
              Submit
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {reviews.map((review, idx) => (
            <div key={idx} className="border-b border-border/50 pb-3 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground">{review.user}</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} fill={i < review.rating ? '#FFB800' : 'none'} color={i < review.rating ? '#FFB800' : 'currentColor'} className="text-muted-foreground" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{review.text}</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No reviews yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}
