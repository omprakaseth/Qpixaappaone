import mixpanel from 'mixpanel-browser';
import { getEnv, isDev } from './env';

const MIXPANEL_TOKEN = getEnv('VITE_MIXPANEL_TOKEN');

// Initialize Mixpanel
if (MIXPANEL_TOKEN && typeof window !== 'undefined') {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: isDev(),
    track_pageview: true,
    persistence: 'localStorage',
  });
}

export const analytics = {
  identify: (userId: string, traits?: Record<string, any>) => {
    if (!MIXPANEL_TOKEN) return;
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.people.set(traits);
    }
  },

  track: (eventName: string, properties?: Record<string, any>) => {
    if (!MIXPANEL_TOKEN) return;
    mixpanel.track(eventName, properties);
  },

  trackPrompt: (prompt: string, style?: string, model?: string) => {
    analytics.track('Generate Image', {
      prompt,
      style,
      model,
      length: prompt.length,
    });
  },

  trackUserGrowth: (userId: string, email?: string, method: string = 'google') => {
    analytics.identify(userId, {
      $email: email,
      'Signup Method': method,
      'Signup Date': new Date().toISOString(),
    });
    analytics.track('User Signup', { method });
  },

  trackPostPublished: (postId: string, category: string, isShort: boolean) => {
    analytics.track('Post Published', {
      postId,
      category,
      isShort,
    });
  },

  reset: () => {
    if (!MIXPANEL_TOKEN) return;
    mixpanel.reset();
  }
};
