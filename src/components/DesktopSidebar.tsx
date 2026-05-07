import React from 'react';
import { Home, PlaySquare, Sparkles, Heart, User, Store, Bell, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { useAppState } from '@/context/AppContext';
import { motion } from 'motion/react';
import { Logo } from './Logo';

interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Marketplace', icon: Store },
  { id: 'shorts', label: 'AI Shorts', icon: PlaySquare },
  { id: 'studio', label: 'AI Studio', icon: Sparkles },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
];

export const DesktopSidebar = ({ activeTab, onTabChange, onOpenAuth }: DesktopSidebarProps) => {
  const { unreadCount } = useNotifications();
  const { isLoggedIn, profile } = useAppState();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border h-screen sticky top-0 z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Logo size={40} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            Qpixa
          </h1>
        </div>

        <nav className="space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarIndicator"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                  />
                )}
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{label}</span>
                {id === 'notifications' && unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-[10px] rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        {isLoggedIn ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/50">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-foreground">{profile?.display_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate italic">@{profile?.username}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onOpenAuth('login')}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Sign In / Join
          </button>
        )}
        
        <div className="flex items-center justify-between px-2">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Settings">
                <Settings size={20} />
            </button>
            <p className="text-[10px] text-muted-foreground font-mono">v3.0.0-PRO</p>
        </div>
      </div>
    </aside>
  );
};
