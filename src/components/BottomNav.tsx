import React from 'react';
import { Home, PlaySquare, Sparkles, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    return (
      <nav
        ref={ref}
        className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
        style={{
          backgroundColor: activeTab === 'shorts' ? 'transparent' : 'hsl(var(--background))',
          backdropFilter: activeTab === 'shorts' ? 'none' : 'none',
          borderTop: activeTab === 'shorts' ? 'none' : '1px solid hsl(var(--border))',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s',
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
                className="flex flex-col items-center gap-0.5 flex-1 py-1 active:scale-95 transition-transform"
              >
                <Icon
                  size={22}
                  className="transition-all duration-200"
                  style={{
                    color: isActive 
                      ? (isShortsTab ? '#fff' : 'hsl(var(--primary))') 
                      : (isShortsTab ? 'rgba(255,255,255,0.6)' : 'hsl(var(--muted-foreground))'),
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
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
