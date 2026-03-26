import { useState, useEffect } from 'react';
import { Bell, Send, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  target_audience: string;
  created_at: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [sending, setSending] = useState(false);

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    setNotifications((data as Notification[]) || []);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) { toast.error('Fill in all fields'); return; }
    setSending(true);
    const { error } = await supabase.from('notifications').insert({ title, message, target_audience: audience });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Notification sent');
    setTitle(''); setMessage(''); setAudience('all');
    fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    toast.success('Deleted');
    fetchNotifications();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Notifications</h2>

      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Broadcast Notification</h3>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 outline-none mb-3 placeholder:text-muted-foreground" />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" rows={3} className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 outline-none mb-3 resize-none placeholder:text-muted-foreground" />
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-muted-foreground">Audience:</span>
          {['all', 'creators', 'free'].map(a => (
            <button key={a} onClick={() => setAudience(a)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${audience === a ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
          <Send size={14} /> {sending ? 'Sending...' : 'Send Notification'}
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map(n => (
          <div key={n.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between">
            <div>
              <p className="text-sm text-foreground font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/20 text-primary font-medium">{n.target_audience}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg hover:bg-secondary"><Trash2 size={15} className="text-red-400" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
