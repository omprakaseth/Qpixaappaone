import { useEffect, useState } from 'react';
import { Flag, Trash2, Ban, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function AdminReports({ setHasUnsavedChanges }: { setHasUnsavedChanges?: (val: boolean) => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    setReports((data as Report[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const handleIgnore = async (id: string) => {
    const { error } = await supabase.from('reports').update({ status: 'ignored' }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Report ignored');
    fetchReports();
  };

  const handleDeletePost = async (postId: string, reportId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
    toast.success('Post deleted & report resolved');
    fetchReports();
  };

  if (loading) return <p className="text-muted-foreground">Loading reports...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Reports</h2>
      {reports.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Flag size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No reports yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground font-medium">{r.reason}</p>
                <p className="text-xs text-muted-foreground mt-1">Post: {r.post_id.slice(0, 8)}... • {new Date(r.created_at).toLocaleDateString()}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  r.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : r.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'
                }`}>{r.status}</span>
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleIgnore(r.id)} className="p-2 rounded-lg hover:bg-secondary" title="Ignore">
                    <XCircle size={16} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDeletePost(r.post_id, r.id)} className="p-2 rounded-lg hover:bg-secondary" title="Delete post">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
