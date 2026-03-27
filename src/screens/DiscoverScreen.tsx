import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Eye, Search } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { formatNumber } from '@/lib/utils';
import { Post } from '@/context/AppContext';
import { useDoubleTap } from '@/hooks/useDoubleTap';
import QuickActions from '@/components/QuickActions';
import ScrollToTop from '@/components/ScrollToTop';

interface DiscoverScreenProps {
  scrollRef: React.RefObject<HTMLDivElement>;
  onPostTap: (post: Post) => void;
}

const DiscoverCard: React.FC<{ post: Post; onPostTap: () => void }> = ({ post, onPostTap }) => {
  const { toggleLike, toggleSave } = useAppState();
  const [showHeart, setShowHeart] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const handleDoubleTap = useDoubleTap(
    () => {},
    () => {
      toggleLike(post.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 600);
    }
  );

  return (
    <div className="bg-card rounded-xl overflow-hidden mb-3">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-xs font-bold text-secondary-foreground">{post.creator.initials}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{post.creator.name}</p>
            <p className="text-[11px] text-muted-foreground">{post.creator.username}</p>
          </div>
        </div>
        <button className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          Follow
        </button>
      </div>

      <div className="px-3 pb-2">
        <span className="text-xs text-muted-foreground">Image • {post.style}</span>
      </div>

      <div
        className="relative cursor-pointer"
        onClick={handleDoubleTap}
        onContextMenu={(e) => { e.preventDefault(); setQuickOpen(true); }}
      >
        <img src={post.imageUrl} alt={post.title} className="w-full aspect-square object-cover" loading="lazy" />
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart size={56} fill="#FF7A00" color="#FF7A00" className="animate-heart-burst" />
          </div>
        )}
      </div>

      <div className="px-3 pt-2">
        <p className="text-xs text-muted-foreground line-clamp-2">{post.prompt}</p>
      </div>

      <div className="flex items-center gap-4 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Eye size={12} />{formatNumber(post.views)}</span>
        <span className="flex items-center gap-1"><Heart size={12} />{formatNumber(post.likes)}</span>
        <span className="flex items-center gap-1"><MessageCircle size={12} />{formatNumber(post.comments)}</span>
      </div>

      <div className="flex items-center justify-around border-t border-border py-2">
        <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5">
          <Heart size={18} fill={post.isLiked ? '#FF7A00' : 'none'} color={post.isLiked ? '#FF7A00' : 'rgba(255,255,255,0.5)'} />
          <span className="text-xs text-muted-foreground">Like</span>
        </button>
        <button className="flex items-center gap-1.5">
          <MessageCircle size={18} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Comment</span>
        </button>
        <button className="flex items-center gap-1.5">
          <Share2 size={18} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Share</span>
        </button>
        <button onClick={() => toggleSave(post.id)} className="flex items-center gap-1.5">
          <Bookmark size={18} fill={post.isSaved ? '#FF7A00' : 'none'} color={post.isSaved ? '#FF7A00' : 'rgba(255,255,255,0.5)'} />
          <span className="text-xs text-muted-foreground">Save</span>
        </button>
      </div>

      <QuickActions
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onAction={(action) => {
          if (action === 'save') toggleSave(post.id);
          if (action === 'copy') navigator.clipboard?.writeText(post.prompt);
        }}
      />
    </div>
  );
}

export default function DiscoverScreen({ scrollRef, onPostTap }: DiscoverScreenProps) {
  const { posts } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    return p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.creator.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto scrollbar-hide">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm px-4 pb-3 space-y-2 pt-[max(env(safe-area-inset-top),2rem)]">
        <h1 className="text-lg font-bold text-foreground">Discover</h1>
        <div className="flex items-center bg-secondary search-glow rounded-xl px-3 h-10">
          <Search size={16} className="text-muted-foreground mr-2" />
          <input
            type="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Search posts, prompts, creators..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
          />
        </div>
      </div>
      <div className="px-3 pb-20">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search size={40} className="mb-3 opacity-40" />
            <p className="text-sm">No results found</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <DiscoverCard key={post.id} post={post} onPostTap={() => onPostTap(post)} />
          ))
        )}
      </div>
      <ScrollToTop scrollRef={scrollRef} />
    </div>
  );
}
