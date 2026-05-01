import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Save } from 'lucide-react';

export default function AdminAdsManager({ setHasUnsavedChanges }: { setHasUnsavedChanges?: (val: boolean) => void }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    const keys = [
      'enable_ads', 'ad_frequency', 'ad_reward_credits',
      'ad_placement_feed', 'ad_placement_banner', 'ad_placement_reward',
      'adsense_publisher_id', 'adsense_feed_slot', 'adsense_banner_slot',
    ];
    const { data } = await supabase.from('admin_settings').select('key, value').in('key', keys);
    if (data) {
      const m: Record<string, string> = {};
      data.forEach((r: any) => { m[r.key] = r.value; });
      setSettings(m);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('admin_settings').update({ value }).eq('key', key);
    if (error) { toast.error(error.message); return; }
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges?.(true);
  };

  const toggleSetting = (key: string) => {
    const newVal = settings[key] === 'true' ? 'false' : 'true';
    updateSetting(key, newVal);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Save all text fields that might have been changed locally
      const textFields = ['adsense_publisher_id', 'adsense_feed_slot', 'adsense_banner_slot', 'ad_frequency', 'ad_reward_credits'];
      for (const key of textFields) {
        if (settings[key] !== undefined) {
          await supabase.from('admin_settings').update({ value: settings[key] }).eq('key', key);
        }
      }
      toast.success('All ads settings saved successfully!');
      setHasUnsavedChanges?.(false);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  const isOn = (key: string) => settings[key] === 'true';

  const Toggle = ({ label, desc, settingKey }: { label: string; desc: string; settingKey: string }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm text-foreground font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={() => toggleSetting(settingKey)}
        className={`w-11 h-6 rounded-full relative transition-colors ${isOn(settingKey) ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isOn(settingKey) ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Ads Manager</h2>

      {/* Master Toggle */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <Toggle label="Enable Ads" desc="Show ads to free users" settingKey="enable_ads" />
      </div>

      {/* Ad Placements */}
      <h3 className="text-sm font-bold text-foreground mb-2">Ad Placements</h3>
      <div className="bg-card border border-border rounded-xl p-5 mb-4 divide-y divide-border">
        <Toggle label="Home Feed Ads" desc="Native ad cards between posts" settingKey="ad_placement_feed" />
        <Toggle label="Banner Ads" desc="Bottom banner above navigation" settingKey="ad_placement_banner" />
        <Toggle label="Rewarded Ads" desc="Users watch ad to earn credits" settingKey="ad_placement_reward" />
      </div>

      {/* Configuration */}
      <h3 className="text-sm font-bold text-foreground mb-2">Configuration</h3>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Ad Frequency (every N posts)</label>
          <input
            type="number"
            value={settings.ad_frequency || '5'}
            onChange={e => handleChange('ad_frequency', e.target.value)}
            className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Reward Credits per Ad Watch</label>
          <input
            type="number"
            value={settings.ad_reward_credits || '3'}
            onChange={e => handleChange('ad_reward_credits', e.target.value)}
            className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 outline-none"
          />
        </div>
      </div>

      {/* Google AdSense */}
      <h3 className="text-sm font-bold text-foreground mb-2">Google AdSense</h3>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Publisher ID (ca-pub-xxxxx)</label>
          <input
            value={settings.adsense_publisher_id || ''}
            onChange={e => handleChange('adsense_publisher_id', e.target.value)}
            placeholder="ca-pub-1234567890"
            className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Feed Ad Slot ID</label>
          <input
            value={settings.adsense_feed_slot || ''}
            onChange={e => handleChange('adsense_feed_slot', e.target.value)}
            placeholder="1234567890"
            className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Banner Ad Slot ID</label>
          <input
            value={settings.adsense_banner_slot || ''}
            onChange={e => handleChange('adsense_banner_slot', e.target.value)}
            placeholder="0987654321"
            className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 outline-none placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          💡 AdSense approve hone ke baad Publisher ID aur Slot IDs yahan daalo. Tab tak placeholder ads dikhenge.
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={saveAll}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? 'Saving...' : 'Save All Settings'}
      </button>

      {/* Stats placeholder */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Ad Stats</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-secondary rounded-lg">
            <p className="text-lg font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Impressions</p>
          </div>
          <div className="text-center p-3 bg-secondary rounded-lg">
            <p className="text-lg font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Clicks</p>
          </div>
          <div className="text-center p-3 bg-secondary rounded-lg">
            <p className="text-lg font-bold text-primary">$0</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
}
