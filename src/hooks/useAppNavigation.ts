import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export const useAppNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navigateBack = useCallback(() => {
    // 1. If on a sub-route (prompt, creator, etc), go back
    const isSubRoute = pathname ? (pathname.includes('/prompt/') || pathname.includes('/creator/')) : false;
    
    if (isSubRoute) {
      router.back();
      return;
    }

    // 2. If on a main tab other than Home, go to Home
    const isMainTab = pathname ? ['/market', '/shorts', '/studio', '/notifications', '/favorites', '/profile'].includes(pathname) : false;
    
    if (isMainTab) {
      router.push('/');
      return;
    }

    // 3. Fallback or Home tab - can't really "exit" on web easily, but we can do nothing or reset
    if (pathname === '/') {
      // Logic for exit or no-op
      return;
    }

    router.back();
  }, [pathname, router]);

  const navigateToTab = useCallback((tab: string) => {
    const paths: Record<string, string> = {
      home: '/',
      discover: '/market',
      shorts: '/shorts',
      studio: '/studio',
      notifications: '/notifications',
      favorites: '/favorites',
      profile: '/profile'
    };
    
    const target = paths[tab];
    if (pathname !== target) {
      router.push(target);
    }
  }, [pathname, router]);

  return { navigateBack, navigateToTab, activePath: pathname };
};
