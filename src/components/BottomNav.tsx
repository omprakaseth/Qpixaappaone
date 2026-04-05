import React from 'react';
import { Home, PlaySquare, Sparkles, Bell, User } from 'lucide-react';
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
  { id: 'notifications', label: 'Alerts', icon: Bell },
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
                <div className="relative">
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
                  {id === 'notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground border border-background">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
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
