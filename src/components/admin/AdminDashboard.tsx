import { useEffect, useState } from 'react';
import { Users, Image, Sparkles, Flag, Activity, DollarSign, Search, ArrowRight, Ban, CheckCircle, Crown, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  credits: number;
  is_banned: boolean;
  subscription_plan: string;
  created_at: string;
}

interface Post {
  id: string;
  creator_id: string;
  prompt: string;
  image_url: string | null;
  likes: number;
  views: number;
  is_hidden: boolean;
  is_featured: boolean;
  created_at: string;
}

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export default function AdminDashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({ users: 0, posts: 0, generations: 0, reports: 0, bannedUsers: 0, proUsers: 0 });
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'banned' | 'pro'>('all');

  useEffect(() => {
    const fetchAll = async () => {
      const [usersRes, postsRes, reportsRes, bannedRes, proRes, genRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_plan', 'pro'),
        supabase.from('generations').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        users: usersRes.count || 0,
        posts: postsRes.count || 0,
        generations: genRes.count || 0,
        reports: reportsRes.count || 0,
        bannedUsers: bannedRes.count || 0,
        proUsers: proRes.count || 0,
      });

      // Fetch recent users & posts
      const { data: ru } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5);
      setRecentUsers((ru as UserProfile[]) || []);

      const { data: rp } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(5);
      setRecentPosts((rp as Post[]) || []);
    };
    fetchAll();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-400', tab: 'users' },
    { label: 'Pro Users', value: stats.proUsers, icon: Crown, color: 'text-yellow-400', tab: 'users' },
    { label: 'Banned Users', value: stats.bannedUsers, icon: Ban, color: 'text-red-400', tab: 'users' },
    { label: 'Total Posts', value: stats.posts, icon: Image, color: 'text-green-400', tab: 'content' },
    { label: 'Generations', value: stats.generations, icon: Sparkles, color: 'text-purple-400', tab: '' },
    { label: 'Reports', value: stats.reports, icon: Flag, color: 'text-red-400', tab: 'reports' },
  ];

  const filteredUsers = recentUsers.filter(u => {
    if (userFilter === 'banned' && !u.is_banned) return false;
    if (userFilter === 'pro' && u.subscription_plan !== 'pro') return false;
    if (userSearch) {
      const q = userSearch.toLowerCase();
      return (u.display_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q));
    }
    return true;
  });

  const filteredPosts = recentPosts.filter(p => {
    if (postSearch && !p.prompt.toLowerCase().includes(postSearch.toLowerCase())) return false;
    return true;
  });

  const chartData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 700 },
    { name: 'Sat', value: 900 },
    { name: 'Sun', value: 1100 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-foreground">Dashboard Overview</h2>
        <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">System Live</span>
        </div>
      </div>

      {/* Stat Cards - clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <button
            key={c.label}
            onClick={() => c.tab && onNavigate?.(c.tab)}
            className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-all hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{c.label}</span>
              <c.icon size={16} className={c.color} />
            </div>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            {c.tab && (
              <span className="text-[9px] text-muted-foreground group-hover:text-primary flex items-center gap-1 mt-1 transition-colors">
                View detail <ArrowRight size={8} />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Activity Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Creation Activity</h3>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Last 7 Days</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#666' }} 
                />
                <YAxis 
                  hide={true} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#00E5FF' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00E5FF" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#00E5FF', strokeWidth: 0 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Server Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">API Latency</span>
              <span className="text-xs font-bold text-green-400">42ms</span>
            </div>
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div className="w-[15%] h-full bg-green-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Storage Used</span>
              <span className="text-xs font-bold text-blue-400">12.4 GB</span>
            </div>
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div className="w-[35%] h-full bg-blue-500" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Generations Today</span>
              <span className="text-xs font-bold text-purple-400">1,240</span>
            </div>
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div className="w-[65%] h-full bg-purple-500" />
            </div>
            
            <button className="w-full mt-2 py-2 rounded-lg bg-secondary/50 text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground">
              Run System Diagnostics
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users with search & filter */}
        <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-foreground">Recent Users</h3>
          <div className="flex items-center gap-2">
            <div className="flex bg-secondary rounded-lg overflow-hidden text-[10px]">
              {(['all', 'pro', 'banned'] as const).map(f => (
                <button key={f} onClick={() => setUserFilter(f)} className={`px-2.5 py-1 font-medium ${userFilter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center bg-secondary rounded-lg px-2 h-7">
              <Search size={12} className="text-muted-foreground mr-1.5" />
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-xs text-foreground outline-none w-20" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
          ) : filteredUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-secondary/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground overflow-hidden">
                  {u.avatar_url ? <img src={u.avatar_url} alt={u.username || 'User'} className="w-full h-full object-cover" /> : (u.display_name || '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{u.display_name || u.username || 'Unknown'}</p>
                  <p className="text-[10px] text-muted-foreground">@{u.username || 'user'} · {u.credits} credits</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {u.subscription_plan === 'pro' && <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/20 text-primary font-medium">PRO</span>}
                {u.is_banned && <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 font-medium">BAN</span>}
                {!u.is_banned && u.subscription_plan !== 'pro' && <CheckCircle size={12} className="text-green-400" />}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate?.('users')} className="w-full mt-3 py-2 rounded-lg bg-secondary text-muted-foreground text-xs font-medium hover:text-foreground flex items-center justify-center gap-1">
          View All Users <ArrowRight size={12} />
        </button>
      </div>

      {/* Recent Posts with search */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Posts</h3>
          <div className="flex items-center bg-secondary rounded-lg px-2 h-7">
            <Search size={12} className="text-muted-foreground mr-1.5" />
            <input value={postSearch} onChange={e => setPostSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-xs text-foreground outline-none w-20" />
          </div>
        </div>
        <div className="space-y-2">
          {filteredPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No posts found</p>
          ) : filteredPosts.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/50">
              {p.image_url ? (
                <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-secondary flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{p.prompt}</p>
                <p className="text-[10px] text-muted-foreground">{p.likes} likes · {p.views} views · {new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1">
                {p.is_featured && <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-400">★</span>}
                {p.is_hidden && <span className="px-1.5 py-0.5 rounded text-[9px] bg-yellow-500/20 text-yellow-400">Hidden</span>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate?.('content')} className="w-full mt-3 py-2 rounded-lg bg-secondary text-muted-foreground text-xs font-medium hover:text-foreground flex items-center justify-center gap-1">
          View All Posts <ArrowRight size={12} />
        </button>
      </div>
      </div>
    </div>
  );
}
