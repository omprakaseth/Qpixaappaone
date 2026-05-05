import { useState, useEffect } from 'react';
import { Shield, Users, Image as ImageIcon, MessageSquare, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { supabase, isPlaceholder } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const { profile } = useAppState();
  const [stats, setStats] = useState({ users: 0, posts: 0, reports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
        const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true });
        
        setStats({
          users: userCount || 0,
          posts: postCount || 0,
          reports: reportCount || 0
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <Shield size={64} className="text-muted-foreground mb-4 opacity-20" />
        <h1 className="text-xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-sm mb-6">You don't have permission to view this page.</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4 safe-top">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-secondary">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Shield size={20} className="text-primary" />
          Admin Panel
        </h1>
      </div>

      <div className="p-6 space-y-8 pb-32">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/30 p-5 rounded-2xl border border-border/50">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
              <Users size={20} />
            </div>
            <p className="text-2xl font-black">{stats.users}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Users</p>
          </div>
          <div className="bg-secondary/30 p-5 rounded-2xl border border-border/50">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
              <ImageIcon size={20} />
            </div>
            <p className="text-2xl font-black">{stats.posts}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Posts</p>
          </div>
          <div className="bg-secondary/30 p-5 rounded-2xl border border-border/50 col-span-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-3">
              <AlertTriangle size={20} />
            </div>
            <p className="text-2xl font-black">{stats.reports}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Active Reports</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Management</h2>
          <Button variant="secondary" className="w-full justify-between h-14 rounded-2xl px-5 text-sm font-bold">
            <span className="flex items-center gap-3"><Users size={18} /> Manage Users</span>
            <span className="text-[10px] bg-secondary px-2 py-1 rounded-lg">View</span>
          </Button>
          <Button variant="secondary" className="w-full justify-between h-14 rounded-2xl px-5 text-sm font-bold">
            <span className="flex items-center gap-3"><ImageIcon size={18} /> Moderate Content</span>
            <span className="text-[10px] bg-secondary px-2 py-1 rounded-lg">Review</span>
          </Button>
          <Button variant="secondary" className="w-full justify-between h-14 rounded-2xl px-5 text-sm font-bold">
            <span className="flex items-center gap-3"><AlertTriangle size={18} /> Violation Reports</span>
            <span className="text-[10px] bg-orange-500/20 text-orange-500 px-2 py-1 rounded-lg font-black">{stats.reports}</span>
          </Button>
        </div>

        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
          <h3 className="text-sm font-bold text-primary mb-2">Admin Notice</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All administrative actions are logged. Ensure you follow community guidelines when moderating content or managing users.
          </p>
        </div>
      </div>
    </div>
  );
}
