import React from 'react';
import { Home, PlaySquare, Sparkles, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  visible: boolean;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'shorts', label: 'Shorts', icon: PlaySquare },
  { id: 'studio', label: 'Studio', icon: Sparkles },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
];

const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(
  ({ activeTab, onTabChange, visible }, ref) => {
    const { unreadCount } = useNotifications();

    return (
      <nav
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 safe-bottom border-t border-border transition-all duration-300 ease-in-out",
          !visible && "translate-y-full opacity-0 pointer-events-none"
        )}
        style={{
          backgroundColor: activeTab === 'shorts' ? 'black' : 'hsl(var(--background))',
        }}
      >
        <div className={cn(
          "flex items-center justify-around h-14 max-w-lg mx-auto transition-all duration-300",
          activeTab === 'shorts' ? "bg-gradient-to-t from-black/60 to-transparent" : ""
        )}>
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const isShortsTab = activeTab === 'shorts';
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="flex flex-col items-center gap-0.5 flex-1 py-1 active:scale-95 transition-transform relative"
              >
                <div className="relative group">
                  <Icon
                    size={24}
                    className="transition-all duration-300"
                    style={{
                      color: isActive 
                        ? (isShortsTab ? '#fff' : 'hsl(var(--primary))') 
                        : (isShortsTab ? 'rgba(255,255,255,0.6)' : 'hsl(var(--muted-foreground))'),
                      transform: isActive ? 'scale(1.15)' : 'scale(1)',
                      filter: isActive ? (isShortsTab ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'drop-shadow(0 0 8px rgba(139,92,246,0.5))') : 'none'
                    }}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className="text-[10px] font-medium transition-colors"
                  style={{ 
                    color: isActive 
                      ? (isShortsTab ? '#fff' : 'hsl(var(--primary))') 
                      : (isShortsTab ? 'rgba(255,255,255,0.6)' : 'hsl(var(--muted-foreground))')
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }
);

BottomNav.displayName = 'BottomNav';
export default BottomNav;
