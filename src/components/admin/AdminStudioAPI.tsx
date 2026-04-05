import { useState } from 'react';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminStudioAPI({ setHasUnsavedChanges }: { setHasUnsavedChanges?: (val: boolean) => void }) {
  const [provider, setProvider] = useState('Lovable AI');
  const [endpoint, setEndpoint] = useState('https://api.lovable.dev/v1/generate');
  const [creditsPerGen, setCreditsPerGen] = useState(1);
  const [enabled, setEnabled] = useState(true);

  const handleSave = () => toast.success('Studio API settings saved');

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Studio API Control</h2>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">API Provider</label>
          <input value={provider} onChange={e => setProvider(e.target.value)} className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">API Endpoint</label>
          <input value={endpoint} onChange={e => setEndpoint(e.target.value)} className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Credits per Generation</label>
          <input type="number" value={creditsPerGen} onChange={e => setCreditsPerGen(Number(e.target.value))} className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 outline-none" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-foreground">Generation Enabled</span>
          <button onClick={() => setEnabled(!enabled)} className={`w-11 h-6 rounded-full relative transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        <button onClick={handleSave} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium mt-2">Save Settings</button>
      </div>
    </div>
  );
}
