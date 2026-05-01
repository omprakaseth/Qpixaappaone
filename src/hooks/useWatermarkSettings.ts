"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WatermarkSettings {
  enabled: boolean;
  text: string;
}

export function useWatermarkSettings() {
  const [settings, setSettings] = useState<WatermarkSettings>({
    enabled: true,
    text: 'Qpixa',
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['watermark_enabled', 'watermark_text']);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });
        setSettings({
          enabled: map.watermark_enabled !== 'false',
          text: map.watermark_text || 'Qpixa',
        });
      }
    };
    fetch();
  }, []);

  return settings;
}