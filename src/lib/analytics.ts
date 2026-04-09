import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

// Initialize Mixpanel
if (typeof window !== 'undefined' && MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
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
