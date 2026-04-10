"use client";

import React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Bell, Heart, MessageCircle, UserPlus, Info, Check, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const NotificationScreen: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="text-red-500 fill-red-500" size={18} />;
      case 'comment': return <MessageCircle className="text-blue-500" size={18} />;
      case 'follow': return <UserPlus className="text-green-500" size={18} />;
      case 'system': return <Info className="text-primary" size={18} />;
      default: return <Bell className="text-muted-foreground" size={18} />;
    }
  };

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            <Check size={14} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bell size={32} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">No notifications yet</h2>
            <p className="text-sm text-muted-foreground">
              When someone likes your posts or follows you, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            <AnimatePresence initial={false}>
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex gap-3 px-4 py-4 cursor-pointer transition-colors ${
                    !notif.is_read ? 'bg-primary/5' : 'hover:bg-secondary/30'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary border border-border">
                      {notif.actor?.avatar_url ? (
                        <img 
                          src={notif.actor.avatar_url} 
                          alt={notif.actor.display_name || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                          {(notif.actor?.display_name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                      {getIcon(notif.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground leading-tight">
                        <span className="font-bold">{notif.actor?.display_name || 'Someone'}</span>{' '}
                        {notif.message}
                      </p>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationScreen;
