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
    const { error } = await supabase.from('admin_settings').upsert({ key, value: newVal }, { onConflict: 'key' });
    if (error) { toast.error(error.message); return; }
    toast.success(`${key.replace(/_/g, ' ')} ${newVal === 'true' ? 'enabled' : 'disabled'}`);
    fetchSettings();
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('admin_settings').upsert({ key, value }, { onConflict: 'key' });
    if (error) { toast.error(error.message); return; }
    toast.success('Setting updated');
    fetchSettings();
  };

  const toggleSettings = [
    'enable_studio', 
    'enable_ads', 
    'enable_creator_profiles', 
    'watermark_enabled', 
    'show_get_pro',
    'enable_registration',
    'maintenance_mode',
    'enable_search',
    'enable_subscriptions'
  ];

  const labels: Record<string, string> = {
    enable_studio: 'Enable Studio',
    enable_ads: 'Enable Ads',
    enable_creator_profiles: 'Enable Creator Profiles',
    watermark_enabled: 'Enable Watermark',
    show_get_pro: 'Show Get Pro Button',
    enable_registration: 'Allow New Registrations',
    maintenance_mode: 'Maintenance Mode',
    enable_search: 'Enable Search Feature',
    enable_subscriptions: 'Enable Subscriptions',
  };

  const descriptions: Record<string, string> = {
    enable_studio: 'Allow users to access the AI generation studio',
    enable_ads: 'Show advertisements to free users',
    enable_creator_profiles: 'Enable public profiles for creators',
    watermark_enabled: 'Add a watermark to generated images',
    show_get_pro: 'Display the "GET PRO" button in the header',
    enable_registration: 'Allow new users to sign up for accounts',
    maintenance_mode: 'Put the app in maintenance mode (admin only access)',
    enable_search: 'Allow users to search for posts and prompts',
    enable_subscriptions: 'Allow users to buy subscriptions and credits',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const watermarkText = getValue('watermark_text');

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">App Controls</h2>
        <button 
          onClick={fetchSettings}
          className="text-xs font-medium text-primary hover:underline"
        >
          Refresh Settings
        </button>
      </div>

      <div className="grid gap-6">
        <section>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Feature Toggles</h3>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border shadow-sm">
            {toggleSettings.map(key => {
              const setting = settings.find(s => s.key === key);
              const value = setting?.value || 'false';
              return (
                <div key={key} className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex-1 pr-4">
                    <p className="text-sm text-foreground font-semibold">{labels[key] || key}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{descriptions[key] || `Toggle ${key.replace(/_/g, ' ')}`}</p>
                  </div>
                  <button
                    onClick={() => toggleSetting(key, value)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-200 ease-in-out ${value === 'true' ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${value === 'true' ? 'left-[26px]' : 'left-1'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Watermark Configuration</h3>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase">Watermark Text</label>
              <div className="flex gap-3">
                <input
                  value={watermarkText}
                  onChange={e => {
                    setSettings(prev => {
                      const exists = prev.find(s => s.key === 'watermark_text');
                      if (exists) {
                        return prev.map(s => s.key === 'watermark_text' ? { ...s, value: e.target.value } : s);
                      }
                      return [...prev, { id: 'temp', key: 'watermark_text', value: e.target.value }];
                    });
                  }}
                  placeholder="e.g. Qpixa AI"
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={() => updateSetting('watermark_text', watermarkText)}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase">Live Preview</label>
              <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-video flex items-center justify-center border border-border group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80')] bg-cover bg-center opacity-50 group-hover:opacity-60 transition-opacity" />
                <span className="relative z-10 text-white/40 text-sm font-medium italic">Sample Image Preview</span>
                {watermarkText && (
                  <span className="absolute bottom-4 right-4 text-white/40 text-[14px] font-bold tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none select-none uppercase">
                    {watermarkText}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}