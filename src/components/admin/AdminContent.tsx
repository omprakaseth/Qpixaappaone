import { useEffect, useState } from 'react';
import { Eye, EyeOff, Trash2, Star, CheckSquare, Square, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export default function AdminContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'featured' | 'hidden'>('all');

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    setPosts((data as Post[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = posts.filter(p => {
    if (filter === 'featured' && !p.is_featured) return false;
    if (filter === 'hidden' && !p.is_hidden) return false;
    if (search && !p.prompt.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  const handleToggleHide = async (id: string, current: boolean) => {
    const { error } = await supabase.from('posts').update({ is_hidden: !current }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(current ? 'Post visible' : 'Post hidden');
    fetchPosts();
  };

  const handleToggleFeature = async (id: string, current: boolean) => {
    const { error } = await supabase.from('posts').update({ is_featured: !current }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(current ? 'Unfeatured' : 'Featured');
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Post deleted');
    fetchPosts();
  };

  // Bulk actions
  const bulkHide = async () => {
    for (const id of selected) {
      await supabase.from('posts').update({ is_hidden: true }).eq('id', id);
    }
    toast.success(`${selected.size} posts hidden`);
    setSelected(new Set());
    fetchPosts();
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} posts permanently?`)) return;
    for (const id of selected) {
      await supabase.from('posts').delete().eq('id', id);
    }
    toast.success(`${selected.size} posts deleted`);
    setSelected(new Set());
    fetchPosts();
  };

  const bulkFeature = async () => {
    for (const id of selected) {
      await supabase.from('posts').update({ is_featured: true }).eq('id', id);
    }
    toast.success(`${selected.size} posts featured`);
    setSelected(new Set());
    fetchPosts();
  };

  if (loading) return <p className="text-muted-foreground">Loading posts...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-foreground">Posts ({posts.length})</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-lg overflow-hidden text-xs">
            {(['all', 'featured', 'hidden'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-secondary text-foreground text-sm rounded-lg px-3 py-1.5 outline-none w-36"
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-primary/10 border border-primary/20 rounded-xl flex-wrap">
          <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
          <button onClick={bulkFeature} className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium">Feature All</button>
          <button onClick={bulkHide} className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium">Hide All</button>
          <button onClick={bulkDelete} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium">Delete All</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-medium">Clear</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">No posts found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-3 py-3">
                  <button onClick={selectAll} className="text-muted-foreground hover:text-foreground">
                    {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Image</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Prompt</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Likes</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Views</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={`border-b border-border last:border-0 ${selected.has(p.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleSelect(p.id)} className="text-muted-foreground hover:text-foreground">
                      {selected.has(p.id) ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-secondary" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-[200px] truncate">{p.prompt}</td>
                  <td className="px-4 py-3 text-foreground">{p.likes}</td>
                  <td className="px-4 py-3 text-foreground">{p.views}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.is_hidden && <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-400">Hidden</span>}
                      {p.is_featured && <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-400">Featured</span>}
                      {!p.is_hidden && !p.is_featured && <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 text-green-400">Visible</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleToggleHide(p.id, p.is_hidden)} title={p.is_hidden ? 'Show' : 'Hide'} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        {p.is_hidden ? <Eye size={15} className="text-green-400" /> : <EyeOff size={15} className="text-yellow-400" />}
                      </button>
                      <button onClick={() => handleToggleFeature(p.id, p.is_featured)} title={p.is_featured ? 'Unfeature' : 'Feature'} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        <Star size={15} className={p.is_featured ? 'text-primary fill-primary' : 'text-muted-foreground'} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} title="Delete" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
