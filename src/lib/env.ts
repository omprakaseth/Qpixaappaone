export const getEnv = (key: string) => {
  // Static access is required for Next.js build-time cleanup/optimization
  if (typeof window !== 'undefined') {
    const envMap: Record<string, string | undefined> = {
      'VITE_MIXPANEL_TOKEN': process.env.NEXT_PUBLIC_VITE_MIXPANEL_TOKEN || process.env.VITE_MIXPANEL_TOKEN,
      'VITE_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      'VITE_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
      'VITE_VAPID_PUBLIC_KEY': process.env.NEXT_PUBLIC_VITE_VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY,
    };
    return envMap[key];
  }

  // Server-side can use dynamic lookup, but we'll try static first
  if (key === 'VITE_SUPABASE_URL') return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (key === 'VITE_SUPABASE_ANON_KEY') return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  return process.env[key];
};

export const isDev = () => {
  if (typeof process !== 'undefined') return process.env.NODE_ENV === 'development';
  return false;
};
