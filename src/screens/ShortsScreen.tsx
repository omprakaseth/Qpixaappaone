import React, { useEffect, useRef, useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Share, Repeat, MoreVertical, Music, Heart } from 'lucide-react';

const REELS_DATA = [
  {
    id: '1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    username: '@ai_creator',
    description: 'How to generate viral AI videos in 10 seconds! 🤯 #ai #tech',
    likes: '124K',
    comments: '1,204',
    shares: '45K',
    audio: 'Original Audio - AI Creator',
  },
  {
    id: '2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    username: '@tech_hacks',
    description: 'Top 3 AI tools you need in 2026. Number 2 is crazy! 🔥',
    likes: '89K',
    comments: '842',
    shares: '12K',
    audio: 'Trending Sound - Tech Hacks',
  },
  {
    id: '3',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    username: '@future_now',
    description: 'Behind the scenes of our new AI app update! 🚀',
    likes: '250K',
    comments: '3,400',
    shares: '88K',
    audio: 'Epic Cinematic - Future Now',
  }
];

export default function ShortsScreen() {
  const [reels, setReels] = useState(REELS_DATA.map(r => ({ ...r, isLiked: false })));
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observerOptions = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.6,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        const index = Number(video.dataset.index);

        if (entry.isIntersecting) {
          setActiveVideoIndex(index);
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              if (error.name !== 'AbortError') {
                console.log("Auto-play prevented:", error);
              }
            });
          }
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, []);

  const togglePlay = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'AbortError') {
            console.log("Play prevented:", error);
          }
        });
      }
    } else {
      video.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleLike = (index: number, forceLike: boolean = false) => {
    setReels(prev => prev.map((reel, i) => {
      if (i === index) {
        return { ...reel, isLiked: forceLike ? true : !reel.isLiked };
      }
      return reel;
    }));
    
    if (forceLike || !reels[index].isLiked) {
      // Show heart animation
      setShowHeartAnimation(index);
      setTimeout(() => setShowHeartAnimation(null), 1000);
    }
  };

  const handleVideoClick = (index: number) => {
    if (clickTimeoutRef.current) {
      // Double click
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      handleLike(index, true);
    } else {
      // Single click
      clickTimeoutRef.current = setTimeout(() => {
        togglePlay(index);
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const currentProgress = (video.currentTime / video.duration) * 100;
    setProgress(currentProgress || 0);
  };

  return (
    <div 
      ref={containerRef}
      className="h-full w-full bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative"
    >
      <div className="absolute top-0 left-0 w-full p-4 pt-safe-top z-20 flex justify-between items-center pointer-events-none">
        <h1 className="text-xl font-bold text-white drop-shadow-md">Shorts</h1>
        <button className="pointer-events-auto p-2">
          <MoreVertical className="w-6 h-6 text-white drop-shadow-md" />
        </button>
      </div>

      {reels.map((reel, index) => (
        <div 
          key={reel.id} 
          className="h-full w-full snap-start snap-always relative bg-zinc-900"
        >
          <video
            ref={(el) => (videoRefs.current[index] = el)}
            data-index={index}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            poster={`https://picsum.photos/seed/${reel.id}/600/1000`}
            onClick={() => handleVideoClick(index)}
            onTimeUpdate={handleTimeUpdate}
          >
            <source src={reel.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Double Tap Heart Animation */}
          {showHeartAnimation === index && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart className="w-32 h-32 text-white fill-white animate-in zoom-in duration-300 fade-out-0 slide-out-to-top-8" />
            </div>
          )}

          {/* Right Action Column */}
          <div className="absolute right-2 bottom-[calc(56px+env(safe-area-inset-bottom)+24px)] flex flex-col items-center gap-5 z-10">
            <button className="flex flex-col items-center gap-1 group" onClick={() => handleLike(index)}>
              <ThumbsUp className={`w-7 h-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${reel.isLiked ? 'fill-white text-white' : 'text-white fill-transparent'}`} strokeWidth={1.5} />
              <span className="text-white text-[11px] font-semibold drop-shadow-md">{reel.likes}</span>
            </button>

            <button className="flex flex-col items-center gap-1 group">
              <ThumbsDown className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] fill-transparent" strokeWidth={1.5} />
              <span className="text-white text-[11px] font-semibold drop-shadow-md">Dislike</span>
            </button>

            <button className="flex flex-col items-center gap-1 group">
              <MessageSquare className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] fill-transparent" strokeWidth={1.5} />
              <span className="text-white text-[11px] font-semibold drop-shadow-md">{reel.comments}</span>
            </button>

            <button className="flex flex-col items-center gap-1 group">
              <Share className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] fill-transparent" strokeWidth={1.5} />
              <span className="text-white text-[11px] font-semibold drop-shadow-md">Share</span>
            </button>

            <button className="flex flex-col items-center gap-1 group">
              <Repeat className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" strokeWidth={1.5} />
              <span className="text-white text-[11px] font-semibold drop-shadow-md">Remix</span>
            </button>

            <div className="w-10 h-10 mt-2 rounded-lg overflow-hidden border-2 border-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              <img src={`https://picsum.photos/seed/${reel.username}/100/100`} alt="avatar" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Bottom Left Info */}
          <div className="absolute bottom-[calc(56px+env(safe-area-inset-bottom))] left-0 w-[80%] p-4 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 pointer-events-none">
            <div className="flex items-center gap-2 mb-2 pointer-events-auto">
              <h3 className="text-white font-bold text-[15px] drop-shadow-md">{reel.username}</h3>
              <button className="px-3 py-1 rounded-full bg-white text-black text-xs font-bold ml-2">
                Subscribe
              </button>
            </div>
            
            <p className="text-white text-sm mb-3 drop-shadow-md line-clamp-2 pointer-events-auto">
              {reel.description}
            </p>
            
            <div className="flex items-center gap-2 text-white/90 pointer-events-auto">
              <Music className="w-4 h-4 animate-pulse" />
              <div className="w-[80%] overflow-hidden">
                <div className="whitespace-nowrap animate-[marquee_5s_linear_infinite] text-sm font-medium">
                  {reel.audio} • {reel.audio}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-[calc(56px+env(safe-area-inset-bottom))] left-0 w-full h-[2px] bg-white/20 z-20">
            <div 
              className="h-full bg-red-600 transition-all duration-100 ease-linear" 
              style={{ width: activeVideoIndex === index ? `${progress}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
