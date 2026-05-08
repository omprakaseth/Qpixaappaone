import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TrendingUp, Coins, ShoppingBag, Star, Activity, ArrowUpRight, BarChart3, Heart, MessageSquare } from 'lucide-react';

interface DashboardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  earnings: { totalSales: number; totalEarnings: number; avgRating: number };
  promptCount: number;
  postEngagement?: { totalLikes: number; totalComments: number; totalViews: number };
  activities?: any[];
}

export default function DashboardSheet({ open, onOpenChange, earnings, promptCount, postEngagement, activities = [] }: DashboardSheetProps) {
  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-background border-border p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border text-left shrink-0">
          <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 size={24} className="text-primary" />
            Creator Dashboard
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-1">Track your performance and earnings</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Engagement Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary/30 rounded-2xl p-4 border border-border/30 text-center">
              <div className="flex justify-center mb-1 text-red-500">
                <Heart size={16} fill="currentColor" />
              </div>
              <p className="text-xl font-bold">{postEngagement?.totalLikes || 0}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Likes</p>
            </div>
            <div className="bg-secondary/30 rounded-2xl p-4 border border-border/30 text-center">
              <div className="flex justify-center mb-1 text-blue-500">
                <MessageSquare size={16} fill="currentColor" />
              </div>
              <p className="text-xl font-bold">{postEngagement?.totalComments || 0}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Comments</p>
            </div>
            <div className="bg-secondary/30 rounded-2xl p-4 border border-border/30 text-center">
              <div className="flex justify-center mb-1 text-primary">
                <TrendingUp size={16} />
              </div>
              <p className="text-xl font-bold">{postEngagement?.totalViews || 0}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Views</p>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-2xl p-4 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Coins size={16} className="text-yellow-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Earnings</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{earnings.totalEarnings.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">coins</span>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-2xl p-4 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <ShoppingBag size={16} className="text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{earnings.totalSales.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Activity size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Active Prompts</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{promptCount}</span>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Star size={16} className="text-yellow-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">Avg Rating</span>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {earnings.avgRating > 0 ? earnings.avgRating.toFixed(1) : '0.0'}
              </span>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 px-1">Recent Activity</h3>
            <div className="bg-card border border-border rounded-2xl overflow-hidden min-h-[100px]">
              {activities.length > 0 ? (
                activities.map((activity, i) => (
                  <div key={activity.id || i} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <ShoppingBag size={16} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{activity.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-500 flex items-center justify-end gap-1">
                        +{activity.amount} <Coins size={12} />
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Activity size={24} className="text-muted-foreground opacity-20 mb-2" />
                  <p className="text-xs text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Withdraw Button */}
          <button className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            Withdraw Earnings <ArrowUpRight size={18} />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
