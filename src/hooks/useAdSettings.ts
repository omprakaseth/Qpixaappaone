"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdSettings {
  enabled: boolean;
  frequency: number;
  rewardCredits: number;
  placementFeed: boolean;
  placementBanner: boolean;
  placementReward: boolean;
  adsensePublisherId: string;
  adsenseFeedSlot: string;
  adsenseBannerSlot: string;
  showGetPro: boolean;
  enableSubscriptions: boolean;
}

const defaults: AdSettings = {
  enabled: false,
  frequency: 5,
  rewardCredits: 3,
  placementFeed: true,
  placementBanner: false,
  placementReward: true,
  adsensePublisherId: '',
  adsenseFeedSlot: '',
  adsenseBannerSlot: '',
  showGetPro: true,
  enableSubscriptions: true,
};

function ensurePubPrefix(id: string): string {
  if (!id) return '';
  return id.startsWith('ca-pub-') ? id : `ca-pub-${id}`;
}

export function useAdSettings() {
  const [settings, setSettings] = useState<AdSettings>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', [
          'enable_ads', 'ad_frequency', 'ad_reward_credits',
          'ad_placement_feed', 'ad_placement_banner', 'ad_placement_reward',
          'adsense_publisher_id', 'adsense_feed_slot', 'adsense_banner_slot',
          'show_get_pro', 'enable_subscriptions',
        ]);

      if (data) {
        const m: Record<string, string> = {};
        data.forEach((r: any) => { m[r.key] = r.value; });
        setSettings({
          enabled: m.enable_ads === 'true',
          frequency: parseInt(m.ad_frequency) || 5,
          rewardCredits: parseInt(m.ad_reward_credits) || 3,
          placementFeed: m.ad_placement_feed !== 'false',
          placementBanner: m.ad_placement_banner === 'true',
          placementReward: m.ad_placement_reward !== 'false',
          adsensePublisherId: ensurePubPrefix(m.adsense_publisher_id || ''),
          adsenseFeedSlot: m.adsense_feed_slot || '',
          adsenseBannerSlot: m.adsense_banner_slot || '',
          showGetPro: m.show_get_pro !== 'false',
          enableSubscriptions: m.enable_subscriptions !== 'false',
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { settings, loading };
}
