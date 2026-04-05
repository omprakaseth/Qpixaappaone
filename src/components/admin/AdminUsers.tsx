import { useEffect, useState } from 'react';
import { Ban, Trash2, Plus, ShieldCheck, CheckSquare, Square, XSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export default function AdminUsers({ setHasUnsavedChanges }: { setHasUnsavedChanges?: (val: boolean) => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditsModal, setCreditsModal] = useState<{ userId: string; current: number } | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as UserProfile[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(u => u.id)));
    }
  };

  const handleBan = async (userId: string, currentBan: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_banned: !currentBan }).eq('id', userId);
    if (error) { toast.error(error.message); return; }
    toast.success(currentBan ? 'User unbanned' : 'User banned');
    fetchUsers();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user permanently?')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) { toast.error(error.message); return; }
    toast.success('User deleted');
    fetchUsers();
  };

  const handlePromoteAdmin = async (userId: string) => {
    if (!confirm('Promote this user to admin?')) return;
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
    if (error) { toast.error(error.message); return; }
    toast.success('User promoted to admin');
  };

  const handleAddCredits = async () => {
    if (!creditsModal) return;
    const { error } = await supabase.from('profiles')
      .update({ credits: creditsModal.current + creditsToAdd })
      .eq('id', creditsModal.userId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Added ${creditsToAdd} credits`);
    setCreditsModal(null);
    fetchUsers();
  };

  // Bulk actions
  const bulkBan = async () => {
    if (!confirm(`Ban ${selected.size} users?`)) return;
    for (const id of selected) {
      await supabase.from('profiles').update({ is_banned: true }).eq('id', id);
    }
    toast.success(`${selected.size} users banned`);
    setSelected(new Set());
    fetchUsers();
  };

  const bulkUnban = async () => {
    for (const id of selected) {
      await supabase.from('profiles').update({ is_banned: false }).eq('id', id);
    }
    toast.success(`${selected.size} users unbanned`);
    setSelected(new Set());
    fetchUsers();
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} users permanently?`)) return;
    for (const id of selected) {
      await supabase.from('profiles').delete().eq('id', id);
    }
    toast.success(`${selected.size} users deleted`);
    setSelected(new Set());
    fetchUsers();
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.display_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q));
  });

  if (loading) return <p className="text-muted-foreground">Loading users...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-foreground">Users ({users.length})</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="bg-secondary text-foreground text-sm rounded-lg px-3 py-2 outline-none w-48"
        />
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-primary/10 border border-primary/20 rounded-xl flex-wrap">
          <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
          <button onClick={bulkBan} className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium hover:bg-yellow-500/30">Ban All</button>
          <button onClick={bulkUnban} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30">Unban All</button>
          <button onClick={bulkDelete} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30">Delete All</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-medium">Clear</button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-3 py-3">
                <button onClick={selectAll} className="text-muted-foreground hover:text-foreground">
                  {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th className="px-4 py-3 text-muted-foreground font-medium">User</th>
              <th className="px-4 py-3 text-muted-foreground font-medium">Plan</th>
              <th className="px-4 py-3 text-muted-foreground font-medium">Credits</th>
              <th className="px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="px-4 py-3 text-muted-foreground font-medium">Joined</th>
              <th className="px-4 py-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className={`border-b border-border last:border-0 ${selected.has(u.id) ? 'bg-primary/5' : ''}`}>
                <td className="px-3 py-3">
                  <button onClick={() => toggleSelect(u.id)} className="text-muted-foreground hover:text-foreground">
                    {selected.has(u.id) ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground overflow-hidden">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : (u.display_name || u.username || '?')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-foreground font-medium">{u.display_name || u.username || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">@{u.username || 'user'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${u.subscription_plan === 'pro' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                    {u.subscription_plan === 'pro' ? 'PRO' : 'FREE'}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">{u.credits}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.is_banned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {u.is_banned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleBan(u.id, u.is_banned)} title={u.is_banned ? 'Unban' : 'Ban'} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Ban size={15} className={u.is_banned ? 'text-green-400' : 'text-yellow-400'} />
                    </button>
                    <button onClick={() => setCreditsModal({ userId: u.id, current: u.credits })} title="Add credits" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Plus size={15} className="text-blue-400" />
                    </button>
                    <button onClick={() => handlePromoteAdmin(u.id)} title="Promote to admin" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <ShieldCheck size={15} className="text-purple-400" />
                    </button>
                    <button onClick={() => handleDelete(u.id)} title="Delete" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Trash2 size={15} className="text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creditsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setCreditsModal(null)}>
          <div className="bg-card border border-border rounded-xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-foreground font-bold mb-4">Add Credits</h3>
            <p className="text-sm text-muted-foreground mb-3">Current: {creditsModal.current}</p>
            <input type="number" value={creditsToAdd} onChange={e => setCreditsToAdd(Number(e.target.value))} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm mb-4 outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setCreditsModal(null)} className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">Cancel</button>
              <button onClick={handleAddCredits} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
