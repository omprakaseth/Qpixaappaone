import React, { useState, useEffect, useRef } from 'react';
import { Heart, LogIn, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/context/AppContext';

interface FavoritesScreenProps {
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  navVisible?: boolean;
}

export default function FavoritesScreen({ scrollRef, onOpenAuth, navVisible = true }: FavoritesScreenProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(100);
  const [isMounted, setIsMounted] = useState(false);
  const { isLoggedIn, posts } = useAppState();
  const [activeTab, setActiveTab] = useState<'saved' | 'generated' | 'collections'>('saved');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target instanceof HTMLElement) {
          setHeaderHeight(entry.target.offsetHeight);
        }
      }
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Heart size={28} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">Sign in to view favorites</h2>
        <p className="text-sm text-muted-foreground mb-6">Save your favorite AI creations and access them anytime</p>
        <button
          onClick={() => onOpenAuth?.('login')}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 mb-3"
        >
          <LogIn size={16} /> Sign In
        </button>
        <button
          onClick={() => onOpenAuth?.('signup')}
          className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm flex items-center justify-center gap-2"
        >
          <UserPlus size={16} /> Create Account
        </button>
      </div>
    );
  }

  const savedPosts = posts.filter(p => p.isSaved);
  const tabs = [
    { id: 'saved' as const, label: 'Saved' },
    { id: 'generated' as const, label: 'Generated' },
    { id: 'collections' as const, label: 'Collections' },
  ];

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto scrollbar-hide relative">
      <div 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-md px-4 pt-2 pb-3 transition-all duration-300 ease-in-out" 
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top), 0.5rem)',
          transform: !navVisible ? 'translateY(-100%)' : 'translateY(0)',
          opacity: !navVisible ? 0 : 1
        }}
      >
        <h1 className="text-lg font-bold text-foreground mb-3">Favorites</h1>
        <div className="flex gap-2 mb-4">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold ${
                activeTab === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div 
        className={cn(
          "px-3 pb-safe-nav",
          isMounted && "transition-all duration-300 ease-in-out"
        )}
        style={{ paddingTop: headerHeight }}
      >
        {activeTab === 'saved' && (
          savedPosts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">No saved items yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {savedPosts.map(p => (
                <div key={p.id} className="rounded-xl overflow-hidden bg-card">
                  <img src={p.imageUrl} alt={p.title} className="w-full aspect-square object-cover" />
                  <div className="p-2">
                    <p className="text-xs font-semibold text-foreground truncate">{p.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {activeTab === 'generated' && (
          <p className="text-center text-sm text-muted-foreground py-12">No generated images yet</p>
        )}
        {activeTab === 'collections' && (
          <p className="text-center text-sm text-muted-foreground py-12">No collections yet</p>
        )}
      </div>
    </div>
  );
}
