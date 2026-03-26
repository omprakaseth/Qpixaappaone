import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const mockDAU = [
  { date: 'Mar 1', users: 12 }, { date: 'Mar 2', users: 18 }, { date: 'Mar 3', users: 15 },
  { date: 'Mar 4', users: 22 }, { date: 'Mar 5', users: 28 }, { date: 'Mar 6', users: 25 }, { date: 'Mar 7', users: 30 },
];

const mockGenerations = [
  { date: 'Mar 1', count: 45 }, { date: 'Mar 2', count: 62 }, { date: 'Mar 3', count: 38 },
  { date: 'Mar 4', count: 80 }, { date: 'Mar 5', count: 95 }, { date: 'Mar 6', count: 72 }, { date: 'Mar 7', count: 110 },
];

const chartStyle = { background: 'hsl(240 10% 8%)', border: '1px solid hsl(0 0% 100% / 0.08)', borderRadius: '8px', color: 'white' };

export default function AdminAnalytics() {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily Active Users</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockDAU}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
              <XAxis dataKey="date" stroke="hsl(0 0% 55%)" fontSize={11} />
              <YAxis stroke="hsl(0 0% 55%)" fontSize={11} />
              <Tooltip contentStyle={chartStyle} />
              <Area type="monotone" dataKey="users" stroke="hsl(28 100% 50%)" fill="hsl(28 100% 50% / 0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Image Generations</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockGenerations}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
              <XAxis dataKey="date" stroke="hsl(0 0% 55%)" fontSize={11} />
              <YAxis stroke="hsl(0 0% 55%)" fontSize={11} />
              <Tooltip contentStyle={chartStyle} />
              <Line type="monotone" dataKey="count" stroke="hsl(280 80% 60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Prompts</h3>
          <div className="space-y-3">
            {['Cyberpunk city at night', 'Fantasy landscape sunset', 'Anime girl portrait', 'Abstract neon art', 'Realistic cat photo'].map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{p}</span>
                <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 50 + 10)} uses</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Creators</h3>
          <div className="space-y-3">
            {['@creative_ai', '@pixel_master', '@art_wizard', '@dream_maker', '@visual_pro'].map((u, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{u}</span>
                <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 30 + 5)} posts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
