import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, ShieldCheck, Settings, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ALL_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tasks', label: 'Tasks & Orders' },
  { id: 'users', label: 'Users' },
  { id: 'content', label: 'Posts' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'reports', label: 'Reports' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'studio-api', label: 'Studio API' },
  { id: 'ads', label: 'Ads Manager' },
  { id: 'credits', label: 'Credits' },
  { id: 'settings', label: 'Settings' },
];

interface AdminRole {
  id: string;
  user_id: string;
  role: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  allowed_tabs?: string[];
}

export default function AdminManagement({ setHasUnsavedChanges }: { setHasUnsavedChanges?: (val: boolean) => void }) {
  const [admins, setAdmins] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingPerms, setEditingPerms] = useState<string | null>(null);
  const [editTabs, setEditTabs] = useState<string[]>([]);

  const fetchAdmins = async () => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .in('role', ['admin', 'super_admin']);

    if (roles) {
      const enriched = await Promise.all(
        roles.map(async (r: any) => {
          const [{ data: profile }, { data: perms }] = await Promise.all([
            supabase.from('profiles').select('username, display_name, avatar_url').eq('id', r.user_id).single(),
            supabase.from('admin_permissions').select('allowed_tabs').eq('user_id', r.user_id).single(),
          ]);
          return {
            ...r,
            email: profile?.username || r.user_id.slice(0, 8),
            display_name: profile?.display_name,
            avatar_url: profile?.avatar_url,
            allowed_tabs: perms?.allowed_tabs || ALL_TABS.map(t => t.id),
          };
        })
      );
      setAdmins(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const addAdmin = async () => {
    if (!email.trim()) return;
    setAdding(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', email.trim())
        .single();
      if (!profile) {
        toast.error('User not found');
        setAdding(false);
        return;
      }
      if (admins.find(a => a.user_id === profile.id)) {
        toast.info('Already an admin');
        setAdding(false);
        return;
      }
      const { error } = await supabase.from('user_roles').insert({ user_id: profile.id, role: 'admin' });
      if (error) throw error;

      // Set default limited permissions
      await supabase.from('admin_permissions').upsert({
        user_id: profile.id,
        allowed_tabs: ['dashboard', 'tasks', 'content', 'reports'],
      });

      toast.success('Admin added with limited access');
      setEmail('');
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  const removeAdmin = async (roleId: string, role: string) => {
    if (role === 'super_admin') {
      toast.error('Cannot remove Super Admin');
      return;
    }
    const { error } = await supabase.from('user_roles').delete().eq('id', roleId);
    if (error) { toast.error(error.message); return; }
    toast.success('Admin removed');
    fetchAdmins();
  };

  const openPerms = (admin: AdminRole) => {
    setEditingPerms(admin.user_id);
    setEditTabs(admin.allowed_tabs || []);
  };

  const toggleTab = (tabId: string) => {
    setEditTabs(prev => prev.includes(tabId) ? prev.filter(t => t !== tabId) : [...prev, tabId]);
  };

  const savePerms = async () => {
    if (!editingPerms) return;
    const { error } = await supabase.from('admin_permissions').upsert({
      user_id: editingPerms,
      allowed_tabs: editTabs,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Permissions updated');
    setEditingPerms(null);
    fetchAdmins();
  };

  if (loading) return <p className="text-muted-foreground">Loading admins...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Admin Management</h2>

      {/* Add Admin */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Add New Admin</h3>
        <p className="text-xs text-muted-foreground mb-3">New admins get limited access (Dashboard, Posts, Reports only). You can customize their permissions after adding.</p>
        <div className="flex gap-2">
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter username"
            className="flex-1 bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={addAdmin}
            disabled={adding || !email.trim()}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
          >
            <UserPlus size={15} />
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Admin List */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {admins.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground text-center">No admins found</p>
        ) : (
          admins.map(a => (
            <div key={a.id} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden ${a.role === 'super_admin' ? 'bg-primary/20' : 'bg-secondary'}`}>
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt={a.display_name || a.email || 'Admin'} className="w-full h-full object-cover" />
                    ) : a.role === 'super_admin' ? (
                      <ShieldCheck size={18} className="text-primary" />
                    ) : (
                      <Shield size={18} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.display_name || a.email}</p>
                    <p className="text-xs text-muted-foreground">@{a.email} · <span className="capitalize">{a.role.replace('_', ' ')}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {a.role !== 'super_admin' && (
                    <>
                      <button
                        onClick={() => openPerms(a)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Manage Permissions"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => removeAdmin(a.id, a.role)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  {a.role === 'super_admin' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">Full Access</span>
                  )}
                </div>
              </div>
              {/* Show allowed tabs */}
              {a.role !== 'super_admin' && (
                <div className="flex flex-wrap gap-1 mt-2 ml-12">
                  {(a.allowed_tabs || []).map(t => (
                    <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground font-medium capitalize">
                      {ALL_TABS.find(at => at.id === t)?.label || t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Permission Editor Modal */}
      {editingPerms && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditingPerms(null)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-foreground font-bold mb-1">Edit Permissions</h3>
            <p className="text-xs text-muted-foreground mb-4">Select which sections this admin can access</p>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {ALL_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => toggleTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    editTabs.includes(tab.id) ? 'bg-primary/10 text-foreground' : 'bg-secondary/50 text-muted-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  {editTabs.includes(tab.id) && <Check size={16} className="text-primary" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditingPerms(null)} className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">Cancel</button>
              <button onClick={savePerms} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
