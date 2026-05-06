import React from 'react';
import { motion } from 'motion/react';
import { Home, Compass, PlusSquare, Heart, User, Bell, LogOut, CreditCard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/context/AppContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAuth: (mode: 'login' | 'signup') => void;
  isLoggedIn: boolean;
}

export function DesktopSidebar({ activeTab, onTabChange, onAuth, isLoggedIn }: SidebarProps) {
  const { profile, user } = useAppState();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Marketplace', icon: Compass },
    { id: 'shorts', label: 'Shorts', icon: PlusSquare },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="w-[240px] h-full bg-[#0f0f13] border-r border-[#1f1f23] flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles size={18} className="text-white fill-current" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">QPIXA</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={20} className={cn("transition-transform group-active:scale-90", isActive && "fill-current")} />
              <span className="font-semibold text-[15px]">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info / Auth */}
      <div className="p-4 mt-auto border-t border-[#1f1f23]">
        {isLoggedIn ? (
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border border-white/10 group-hover:border-primary/50 transition-colors">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                  {profile?.display_name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{profile?.display_name || 'User'}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CreditCard size={10} /> {profile?.credits || 0} Credits
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onAuth('login')}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}
