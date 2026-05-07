import React from 'react';
import { Home, PlaySquare, Sparkles, User, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  visible: boolean;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Market', icon: Globe },
  { id: 'studio', label: 'Studio', icon: Sparkles },
  { id: 'shorts', label: 'Shorts', icon: PlaySquare },
  { id: 'profile', label: 'Profile', icon: User },
];

const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(
  ({ activeTab, onTabChange, visible }, ref) => {
    const notificationContext = useNotifications();
    const unreadCount = notificationContext?.unreadCount || 0;

    return (
      <nav
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out safe-bottom border-t",
          activeTab === 'shorts' ? "bg-black border-white/10" : "bg-white dark:bg-black border-border",
          !visible && "translate-y-full opacity-0"
        )}
      >
        <div className="relative flex items-center justify-around h-16 max-w-lg mx-auto">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const isShortsTab = activeTab === 'shorts';
            
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="relative flex flex-col items-center justify-center flex-1 h-full outline-none group"
              >
                {/* Top Indicator Line - Slides only */}
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(139,92,246,0.3)]"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  <Icon
                    size={22}
                    className={cn(
                      "transition-colors duration-300",
                      isActive 
                        ? (isShortsTab ? "text-white" : "text-primary") 
                        : (isShortsTab ? "text-white/40" : "text-muted-foreground")
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={cn(
                    "text-[9px] font-bold mt-1 transition-all duration-300 uppercase tracking-tighter",
                    isActive 
                      ? (isShortsTab ? "text-white opacity-100" : "text-primary opacity-100") 
                      : (isShortsTab ? "text-white/30 opacity-60" : "text-muted-foreground/60 opacity-60")
                  )}>
                    {label}
                  </span>
                </div>
                
                {((id === 'profile' && unreadCount > 0) || (id === 'studio' && false)) && !isActive && (
                  <span className="absolute top-4 right-1/4 w-2 h-2 bg-primary rounded-full border-2 border-background shadow-sm animate-pulse" />
                )}
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
