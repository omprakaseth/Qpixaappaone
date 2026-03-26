import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SettingRow { id: string; key: string; value: string; }

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase.from('admin_settings').select('*');
    setSettings((data as SettingRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const getValue = (key: string) => settings.find(s => s.key === key)?.value || '';

  const toggleSetting = async (key: string, current: string) => {
    const newVal = current === 'true' ? 'false' : 'true';
    const { error } = await supabase.from('admin_settings').update({ value: newVal }).eq('key', key);
    if (error) { toast.error(error.message); return; }
    toast.success(`${key.replace(/_/g, ' ')} ${newVal === 'true' ? 'enabled' : 'disabled'}`);
    fetchSettings();
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('admin_settings').update({ value }).eq('key', key);
    if (error) { toast.error(error.message); return; }
    toast.success('Setting updated');
    fetchSettings();
  };

  const toggleSettings = ['enable_studio', 'enable_ads', 'enable_creator_profiles', 'watermark_enabled'];

  const labels: Record<string, string> = {
    enable_studio: 'Enable Studio',
    enable_ads: 'Enable Ads',
    enable_creator_profiles: 'Enable Creator Profiles',
    watermark_enabled: 'Enable Watermark',
  };

  if (loading) return <p className="text-muted-foreground">Loading settings...</p>;

  const watermarkText = getValue('watermark_text');

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Settings</h2>

      <div className="bg-card border border-border rounded-xl divide-y divide-border mb-6">
        {settings.filter(s => toggleSettings.includes(s.key)).map(s => (
          <div key={s.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm text-foreground font-medium">{labels[s.key] || s.key}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Toggle {s.key.replace(/_/g, ' ')}</p>
            </div>
            <button
              onClick={() => toggleSetting(s.key, s.value)}
              className={`w-11 h-6 rounded-full relative transition-colors ${s.value === 'true' ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${s.value === 'true' ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <h3 className="text-base font-bold text-foreground mb-3">Watermark Settings</h3>
      <div className="bg-card border border-border rounded-xl p-5 space-y-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">WATERMARK TEXT (optional)</label>
          <div className="flex gap-2">
            <input
              value={watermarkText}
              onChange={e => {
                setSettings(prev => prev.map(s => s.key === 'watermark_text' ? { ...s, value: e.target.value } : s));
              }}
              placeholder="Qpixa"
              className="flex-1 bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={() => updateSetting('watermark_text', watermarkText)}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            >
              Save
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">PREVIEW</label>
          <div className="relative rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Sample Image</span>
            {watermarkText && (
              <span className="absolute bottom-2 right-2 text-white/50 text-[11px] font-bold tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                {watermarkText}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}