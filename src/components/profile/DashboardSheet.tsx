import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TrendingUp, Coins, ShoppingBag, Star, Activity, ArrowUpRight, BarChart3 } from 'lucide-react';

interface DashboardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  earnings: { totalSales: number; totalEarnings: number; avgRating: number };
  promptCount: number;
}

export default function DashboardSheet({ open, onOpenChange, earnings, promptCount }: DashboardSheetProps) {
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
              <div className="mt-2 flex items-center gap-1 text-[10px] text-green-500 font-medium bg-green-500/10 w-fit px-2 py-0.5 rounded-full">
                <TrendingUp size={10} /> +12% this month
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
              <div className="mt-2 flex items-center gap-1 text-[10px] text-green-500 font-medium bg-green-500/10 w-fit px-2 py-0.5 rounded-full">
                <TrendingUp size={10} /> +8% this month
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

          {/* Recent Activity Mockup */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 px-1">Recent Activity</h3>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <ShoppingBag size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Prompt Sale</p>
                      <p className="text-xs text-muted-foreground">Someone bought your prompt</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-500 flex items-center justify-end gap-1">
                      +50 <Coins size={12} />
                    </p>
                    <p className="text-xs text-muted-foreground">2h ago</p>
                  </div>
                </div>
              ))}
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
