import { useState } from 'react';
import { Plus, Trash2, Star, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Prompt { id: string; text: string; trending: boolean; featured: boolean; }

export default function AdminPrompts({ setHasUnsavedChanges }: { setHasUnsavedChanges?: (val: boolean) => void }) {
  const [prompts, setPrompts] = useState<Prompt[]>([
    { id: '1', text: 'Cyberpunk city at night with neon lights', trending: true, featured: false },
    { id: '2', text: 'Fantasy landscape with floating islands', trending: false, featured: true },
    { id: '3', text: 'Realistic portrait in studio lighting', trending: false, featured: false },
  ]);
  const [newPrompt, setNewPrompt] = useState('');

  const addPrompt = () => {
    if (!newPrompt.trim()) return;
    setPrompts(prev => [...prev, { id: Date.now().toString(), text: newPrompt.trim(), trending: false, featured: false }]);
    setNewPrompt('');
    toast.success('Prompt added');
  };

  const deletePrompt = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    toast.success('Prompt deleted');
  };

  const toggleTrending = (id: string) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, trending: !p.trending } : p));
  };

  const toggleFeatured = (id: string) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Prompts Management</h2>

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex gap-2">
          <input value={newPrompt} onChange={e => setNewPrompt(e.target.value)} placeholder="Add a new prompt..." className="flex-1 bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 outline-none placeholder:text-muted-foreground" />
          <button onClick={addPrompt} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5">
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {prompts.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm text-foreground flex-1 mr-4">{p.text}</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => toggleTrending(p.id)} className="p-1.5 rounded-lg hover:bg-secondary" title="Trending">
                <TrendingUp size={15} className={p.trending ? 'text-green-400' : 'text-muted-foreground'} />
              </button>
              <button onClick={() => toggleFeatured(p.id)} className="p-1.5 rounded-lg hover:bg-secondary" title="Featured">
                <Star size={15} className={p.featured ? 'text-primary fill-primary' : 'text-muted-foreground'} />
              </button>
              <button onClick={() => deletePrompt(p.id)} className="p-1.5 rounded-lg hover:bg-secondary" title="Delete">
                <Trash2 size={15} className="text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
