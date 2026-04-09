"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Sparkles, 
  MoreVertical, 
  Music, 
  ChevronDown, 
  ChevronUp,
  X,
  Flag,
  Ban,
  Bookmark,
  Copy,
  Video,
  ArrowLeft,
  Play,
  Pause
} from 'lucide-react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase, isPlaceholder } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/LogoLoader';

interface Reel {
  id: string;
  videoUrl: string;
  username: string;
  profilePic: string;
  description: string;
  likes: string;
  comments: string;
  shares: string;
  audio: string;
  prompt: string;
  isFollowing: boolean;
  isLiked: boolean;
  isSaved: boolean;
}

const MOCK_REELS: Reel[] = [
  {
    id: 'mock-reel-1',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    username: 'cyber_artist',
    profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cyber',
    description: 'AI Generated Cyberpunk Girl #AI #Cyberpunk',
    likes: '1.2k',
    comments: '45',
    shares: '128',
    audio: 'Cyberpunk 2077 - Rebel Path',
    prompt: 'A girl standing in neon lights, futuristic fashion, high detail',
    isFollowing: false,
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'mock-reel-2',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    username: 'nature_lover',
    profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nature',
    description: 'Beautiful AI Nature Simulation #Nature #AI',
    likes: '850',
    comments: '23',
    shares: '45',
    audio: 'Birds Chirping - Nature Sounds',
    prompt: 'A beautiful tree with yellow flowers, cinematic nature shot',
    isFollowing: false,
    isLiked: false,
    isSaved: false,
  }
];

interface ShortsScreenProps {
  onBack?: () => void;
  onCreatorTap?: (username: string) => void;
}

export default function ShortsScreen({ onBack, onCreatorTap }: ShortsScreenProps) {
  const [viewMode, setViewMode] = useState<'Shorts' | 'Following'>('Shorts');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      
      // Skip fetch if using placeholder supabase URL
      if (isPlaceholder) {
        setReels(MOCK_REELS);
        setLoading(false);
        return;
      }

      // @ts-ignore - Deep type instantiation issue in this environment
      const { data, error } = await (supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('is_short', true)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;

      if (data) {
        const formattedReels: Reel[] = data.map((item: any) => ({
          id: item.id,
          videoUrl: item.image_url,
          username: item.profiles?.username || 'anonymous',
          profilePic: item.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}`,
          description: item.title || '',
          likes: item.likes_count?.toString() || '0',
          comments: '0',
          shares: '0',
          audio: 'Original Audio',
          prompt: item.prompt || 'AI Generated Content',
          isFollowing: false,
          isLiked: false,
          isSaved: false,
        }));
        if (formattedReels.length === 0) {
          setReels(MOCK_REELS);
        } else {
          setReels(formattedReels);
        }
      }
    } catch (error) {
      // Suppress the console error to avoid cluttering when falling back to mock data
      setReels(MOCK_REELS);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [activeIndex]);

  return (
    <div className="h-full w-full bg-black relative overflow-hidden flex flex-col pb-14">
      {/* Top Navigation - Glass Pill Style */}
      <motion.div 
        initial={{ y: 0, opacity: 1 }}
        animate={{ 
          y: activeIndex >= 3 ? -100 : 0,
          opacity: activeIndex >= 3 ? 0 : 1
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute top-0 left-0 w-full z-50 px-4 pt-[max(env(safe-area-inset-top),1rem)] flex items-center justify-between pointer-events-none"
      >
        <button 
          onClick={onBack}
          className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white transition-all active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 drop-shadow-md" />
        </button>

        <div className="relative pointer-events-auto absolute left-1/2 -translate-x-1/2">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md text-white font-bold text-sm transition-all active:scale-95"
          >
            {viewMode}
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 opacity-80" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-36 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
              >
                {(['Shorts', 'Following'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setViewMode(mode);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-sm font-bold text-left transition-colors hover:bg-white/5",
                      viewMode === mode ? "text-white" : "text-white/40"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-10 h-10" /> {/* Spacer for centering */}
      </motion.div>

      {/* Video Feed */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-black">
            <LogoLoader size={80} text="Opening Shorts..." />
          </div>
        ) : reels.length > 0 ? (
          reels.map((reel, index) => (
            <VideoItem 
              key={reel.id}
              reel={reel}
              isActive={index === activeIndex}
              onUpdateReel={(updated) => {
                const newReels = [...reels];
                newReels[index] = updated;
                setReels(newReels);
              }}
              onShowComments={() => setShowComments(true)}
              onCreatorTap={onCreatorTap}
              onBack={onBack}
            />
          ))
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-white/40 gap-2">
            <Video size={48} className="opacity-20 mb-2" />
            <p className="text-sm font-medium">No shorts found</p>
            <p className="text-xs">Be the first to upload a short!</p>
          </div>
        )}
      </div>

      {/* Comments Drawer */}
      <Drawer.Root open={showComments} onOpenChange={setShowComments}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[100]" />
          <Drawer.Content className="bg-zinc-950 border-t border-white/10 flex flex-col rounded-t-[32px] h-[75vh] fixed bottom-0 left-0 right-0 z-[101] outline-none">
            <Drawer.Title className="sr-only">Comments</Drawer.Title>
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 my-4" />
            
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Comments</h3>
              <button onClick={() => setShowComments(false)} className="p-1 rounded-full hover:bg-white/5 transition-colors">
                <X size={18} className="text-white/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col items-center justify-center h-40 text-white/40">
                <MessageSquare size={32} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">No comments yet</p>
                <p className="text-xs mt-1">Be the first to share your thoughts!</p>
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-zinc-950 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                />
                <button className="text-primary text-sm font-bold active:scale-95 transition-transform">Post</button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

interface VideoItemProps {
  reel: Reel;
  isActive: boolean;
  onUpdateReel: (reel: Reel) => void;
  onShowComments: () => void;
  onCreatorTap?: (username: string) => void;
  onBack?: () => void;
}

const VideoItem: React.FC<VideoItemProps> = ({ reel, isActive, onUpdateReel, onShowComments, onCreatorTap, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [showHeart, setShowHeart] = useState(false);
  const [isFollowing, setIsFollowing] = useState(reel.isFollowing);
  const [isSaved, setIsSaved] = useState(reel.isSaved);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // New states for loading, controls, and gestures
  const [isBuffering, setIsBuffering] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  const lastTapRef = useRef(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsBuffering(true);
    }
  }, [isActive]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap
      if (!isLiked) {
        setIsLiked(true);
        onUpdateReel({ ...reel, isLiked: true });
        // Background sync
        if (!reel.id.startsWith('mock-') && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder-project.supabase.co') {
          (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('post_likes').insert({ post_id: reel.id, user_id: user.id });
            }
          })();
        }
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      // Single tap - play/pause
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        setShowCenterIcon(true);
        setTimeout(() => setShowCenterIcon(false), 1000);
        showControlsTemporarily();
      }
    }
    lastTapRef.current = now;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const p = x / rect.width;
    videoRef.current.currentTime = p * videoRef.current.duration;
    showControlsTemporarily();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    
    // Check if it's a horizontal swipe (more horizontal than vertical, and significant distance)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0) {
        // Swipe right -> Exit
        onBack?.();
      } else {
        // Swipe left -> Creator profile
        onCreatorTap?.(reel.username);
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div className="h-full w-full snap-start relative bg-black flex items-center justify-center overflow-hidden">
      {/* Video Container - Truly Fullscreen */}
      <div 
        className="relative w-full h-full overflow-hidden bg-zinc-950"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {reel.videoUrl && !hasError ? (
          <motion.video
            ref={videoRef}
            src={reel.videoUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onClick={handleVideoClick}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
            onCanPlay={() => setIsBuffering(false)}
            animate={{ scale: isActive ? 1.02 : 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onError={(e) => {
              console.error('Video load error');
              setHasError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 px-10 text-center">
            <Video size={48} className="text-white/20 mb-4" />
            <p className="text-white/40 text-sm font-medium">Video failed to load</p>
            <button 
              onClick={() => setHasError(false)}
              className="mt-6 px-6 py-2 rounded-full bg-white/10 text-white/80 text-xs font-bold hover:bg-white/20 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        <AnimatePresence>
          {isBuffering && !hasError && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20 z-30 pointer-events-none"
            >
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Play/Pause Icon */}
        <AnimatePresence>
          {showCenterIcon && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
            >
              <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                {isPlaying ? <Play className="w-8 h-8 text-white fill-white ml-1" /> : <Pause className="w-8 h-8 text-white fill-white" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double Tap Heart */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
            >
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Gradient Overlay - More intense for readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

        {/* Hide interactions while buffering */}
        <AnimatePresence>
          {!isBuffering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-20"
            >
              {/* Right Side Actions - AI Focused */}
              <div className="absolute right-3 bottom-20 flex flex-col items-center gap-3 pointer-events-auto h-[300px] justify-end">
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => {
                      const newLikedState = !isLiked;
                      setIsLiked(newLikedState);
                      onUpdateReel({ ...reel, isLiked: newLikedState });
                      
                      // Background sync
                      if (!reel.id.startsWith('mock-') && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder-project.supabase.co') {
                        (async () => {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (user) {
                            if (newLikedState) {
                              await supabase.from('post_likes').insert({ post_id: reel.id, user_id: user.id });
                            } else {
                              await supabase.from('post_likes').delete().eq('post_id', reel.id).eq('user_id', user.id);
                            }
                          }
                        })();
                      }
                    }}
                    className="w-11 h-11 flex items-center justify-center transition-all active:scale-90 group"
                  >
                    <Heart className={cn("w-6 h-6 transition-colors drop-shadow-md", isLiked ? "fill-red-500 text-red-500" : "text-white group-hover:text-white/80")} />
                  </button>
                  <span className="text-[11px] font-bold text-white drop-shadow-md">{reel.likes}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => onShowComments()}
                    className="w-11 h-11 flex items-center justify-center transition-all active:scale-90 group"
                  >
                    <MessageSquare className="w-6 h-6 text-white drop-shadow-md group-hover:text-white/80" />
                  </button>
                  <span className="text-[11px] font-bold text-white drop-shadow-md">{reel.comments}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Check out @${reel.username}'s AI Short`,
                          text: reel.description,
                          url: window.location.href,
                        }).catch(() => {});
                      }
                    }}
                    className="w-11 h-11 flex items-center justify-center transition-all active:scale-90 group"
                  >
                    <Share2 className="w-6 h-6 text-white drop-shadow-md group-hover:text-white/80" />
                  </button>
                  <span className="text-[11px] font-bold text-white drop-shadow-md">{reel.shares}</span>
                </div>

                {reel.prompt && (
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onClick={() => toast.success('Analyzing content to generate similar...')}
                      className="w-11 h-11 flex items-center justify-center transition-all active:scale-90 group"
                    >
                      <Sparkles className="w-6 h-6 text-primary drop-shadow-md group-hover:text-primary/80" />
                    </button>
                    <span className="text-[11px] font-bold text-primary drop-shadow-md">Remix</span>
                  </div>
                )}

                <button 
                  onClick={() => setIsMoreMenuOpen(true)}
                  className="w-11 h-11 flex items-center justify-center transition-all active:scale-90 group mt-1"
                >
                  <MoreVertical className="w-6 h-6 text-white drop-shadow-md group-hover:text-white/80" />
                </button>
              </div>

              {/* Bottom Left Creator Section */}
              <div className="absolute left-4 bottom-10 right-20 flex flex-col gap-3 pointer-events-auto">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-11 h-11 rounded-full border-2 border-white/30 overflow-hidden shadow-2xl flex-shrink-0 cursor-pointer"
                    onClick={() => onCreatorTap?.(reel.username)}
                  >
                    <img src={reel.profilePic} alt={reel.username} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-white font-bold text-sm drop-shadow-md cursor-pointer"
                      onClick={() => onCreatorTap?.(reel.username)}
                    >
                      @{reel.username}
                    </span>
                    <button 
                      onClick={() => {
                        setIsFollowing(!isFollowing);
                        onUpdateReel({ ...reel, isFollowing: !isFollowing });
                      }}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95",
                        isFollowing 
                          ? "bg-white/10 border-white/20 text-white/60" 
                          : "bg-white border-white text-black"
                      )}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-white text-sm font-medium line-clamp-2 leading-relaxed drop-shadow-md">
                    {reel.description}
                  </p>
                  <div className="flex items-center gap-2 text-white/80 text-xs w-48 overflow-hidden">
                    <Music className="w-3 h-3 flex-shrink-0" />
                    <div className="flex-1 overflow-hidden relative h-4">
                      <motion.div 
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ 
                          duration: 10, 
                          repeat: Infinity, 
                          ease: "linear" 
                        }}
                        className="flex gap-8 whitespace-nowrap absolute left-0"
                      >
                        <span className="font-medium">{reel.audio}</span>
                        <span className="font-medium">{reel.audio}</span>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Permanent Progress Bar (Thin) */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/10 z-20 pointer-events-none">
          <motion.div 
            className="h-full bg-primary/60"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Interactive Progress Bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-0 left-0 w-full h-6 flex items-end cursor-pointer z-30 group"
              onClick={handleSeek}
            >
              <div className="w-full h-[3px] bg-white/20 relative overflow-hidden group-hover:h-[6px] transition-all">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* More Menu Bottom Sheet */}
      <Drawer.Root open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[100]" />
          <Drawer.Content className="bg-zinc-950 border-t border-white/10 flex flex-col rounded-t-[32px] h-auto max-h-[80vh] fixed bottom-0 left-0 right-0 z-[101] outline-none">
            <Drawer.Title className="sr-only">Video Options</Drawer.Title>
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 my-4" />
            <div className="p-4 pt-0 overflow-y-auto">
              <div className="grid grid-cols-1 gap-1">
                <button 
                  onClick={() => {
                    setIsSaved(!isSaved);
                    onUpdateReel({ ...reel, isSaved: !isSaved });
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-white/5 text-white transition-colors"
                >
                  <Bookmark className={cn("w-6 h-6", isSaved && "fill-white")} />
                  <span className="font-bold">Save to Collection</span>
                </button>
                
                <button className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-white/5 text-white transition-colors">
                  <Ban className="w-6 h-6" />
                  <span className="font-bold">Not Interested</span>
                </button>
                
                <button className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-white/5 text-red-500 transition-colors">
                  <Flag className="w-6 h-6" />
                  <span className="font-bold">Report Content</span>
                </button>
                
                <div className="h-px bg-white/5 my-2 mx-4" />
                
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(reel.prompt);
                    setIsMoreMenuOpen(false);
                    toast.success('Prompt copied!');
                  }}
                  className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-white/5 text-white transition-colors"
                >
                  <Copy className="w-6 h-6" />
                  <div className="flex flex-col items-start">
                    <span className="font-bold">Copy AI Prompt</span>
                    <span className="text-xs text-white/40 truncate max-w-[250px]">{reel.prompt}</span>
                  </div>
                </button>
              </div>
              
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="mt-4 w-full py-4 rounded-2xl bg-white/5 text-white font-bold text-sm transition-all active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
