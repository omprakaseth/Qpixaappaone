import React, { useState } from 'react';
import { Search, Bell, Upload, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/context/AppContext';

interface HeaderProps {
  onSearch: (query: string) => void;
  onUpload: () => void;
  onNotifications: () => void;
}

export function DesktopHeader({ onSearch, onUpload, onNotifications }: HeaderProps) {
  const { profile, isLoggedIn, isPro } = useAppState();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <header className="h-[72px] bg-[#09090b]/80 backdrop-blur-xl border-b border-[#1f1f23] sticky top-0 z-40 px-8 flex items-center justify-between gap-8">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-2xl relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search amazing AI art, creators, or prompts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-11 bg-[#0f0f13] border border-[#1f1f23] rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50"
        />
      </form>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        {isLoggedIn && (
          <>
            <button 
              onClick={onUpload}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Upload size={16} /> Upload
            </button>
            <button 
              onClick={onNotifications}
              className="p-2.5 rounded-xl border border-[#1f1f23] text-muted-foreground hover:text-white hover:bg-white/5 transition-all relative"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-[#09090b]" />
            </button>
          </>
        )}
        
        {/* User Stats / Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-[#1f1f23]">
          <div className="text-right hidden xl:block">
            <p className="text-xs font-bold text-white leading-none mb-1">
              {isLoggedIn ? profile?.display_name : 'Guest User'}
            </p>
            <p className="text-[10px] text-primary font-bold flex items-center justify-end gap-1 uppercase tracking-wider">
              {isLoggedIn && isPro ? 'Pro Member ✨' : 'Free Plan'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-secondary border border-white/10 overflow-hidden">
             {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                  {profile?.display_name?.charAt(0) || 'G'}
                </div>
              )}
          </div>
        </div>
      </div>
    </header>
  );
}
