import React from 'react';
import { Home, PlaySquare, Sparkles, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';

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
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md transition-all duration-300 ease-in-out",
          !visible && "translate-y-24 opacity-0"
        )}
      >
        <div className={cn(
          "relative flex items-center justify-around h-16 px-4 rounded-2xl border border-white/10 shadow-2xl overflow-hidden",
          activeTab === 'shorts' 
            ? "bg-black/60 backdrop-blur-xl" 
            : "bg-background/70 backdrop-blur-xl"
        )}>
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const isShortsTab = activeTab === 'shorts';
            
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="relative flex flex-col items-center justify-center flex-1 h-full outline-none group"
              >
                {/* Top Indicator Line */}
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_10px_rgba(139,92,246,0.5)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                {/* Subtle Glow Effect */}
                {isActive && (
                  <motion.div
                    layoutId="navGlow"
                    className="absolute inset-0 bg-primary/5 rounded-xl blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}

                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="relative z-10 flex flex-col items-center"
                >
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
                      : "opacity-0 scale-75 translate-y-2"
                  )}>
                    {label}
                  </span>
                </motion.div>
                
                {id === 'studio' && unreadCount > 0 && !isActive && (
                  <span className="absolute top-4 right-1/4 w-2 h-2 bg-primary rounded-full border-2 border-background/50 shadow-sm" />
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
