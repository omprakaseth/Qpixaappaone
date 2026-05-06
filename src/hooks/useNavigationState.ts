import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Post, useAppState } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';

export function useNavigationState() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { posts, profile, user, fetchPostById } = useAppState();
  const { toast } = useToast();

  const [tabStacks, setTabStacks] = useState<Record<string, { selectedPost?: Post | null; viewingCreator?: string | null }>>({
    home: {},
    discover: {},
    shorts: {},
    studio: {},
    notifications: {},
    favorites: {},
    profile: {}
  });

  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/market')) return 'discover';
    if (path.startsWith('/shorts')) return 'shorts';
    if (path.startsWith('/studio')) return 'studio';
    if (path.startsWith('/notifications')) return 'notifications';
    if (path.startsWith('/favorites')) return 'favorites';
    if (path.startsWith('/profile')) return 'profile';
    return 'home';
  }, [location.pathname]);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewingCreator, setViewingCreator] = useState<string | null>(null);
  const [lastBackPress, setLastBackPress] = useState(0);

  const tabRootPaths: Record<string, string> = {
    home: '/',
    discover: '/market',
    shorts: '/shorts',
    studio: '/studio',
    notifications: '/notifications',
    favorites: '/favorites',
    profile: '/profile'
  };

  // Sync tab stacks
  useEffect(() => {
    const currentStack = tabStacks[activeTab];
    if (currentStack) {
      setSelectedPost(currentStack.selectedPost || null);
      setViewingCreator(currentStack.viewingCreator || null);
    }
  }, [activeTab]);

  useEffect(() => {
    setTabStacks(prev => ({
      ...prev,
      [activeTab]: {
        selectedPost,
        viewingCreator
      }
    }));
  }, [selectedPost, viewingCreator, activeTab]);

  useEffect(() => {
    const handleDeepLink = async () => {
      if (location.pathname.includes('/prompt/') && id) {
        const post = posts.find(p => p.id === id);
        if (post) {
          setSelectedPost(post);
        } else {
          const fetchedPost = await fetchPostById(id);
          if (fetchedPost) setSelectedPost(fetchedPost);
        }
      } else if (location.pathname.includes('/creator/') && id) {
        setViewingCreator(id);
      }
    };
    handleDeepLink();
  }, [location.pathname, id, posts, fetchPostById]);

  const pushHistory = useCallback((state: string, path?: string) => {
    window.history.pushState({ overlay: state, guard: true }, '', path);
  }, []);

  const getSubPath = useCallback((type: 'prompt' | 'creator', targetId: string) => {
    const root = tabRootPaths[activeTab];
    const prefix = root === '/' ? '/home' : root;
    return `${prefix}/${type}/${targetId}`;
  }, [activeTab]);

  const openPost = useCallback((post: Post) => {
    pushHistory('post', getSubPath('prompt', post.id));
    setSelectedPost(post);
  }, [pushHistory, getSubPath]);

  const openCreator = useCallback((creatorName: string, creatorId?: string) => {
    if (user && creatorId === user.id) {
      navigate('/profile', { replace: true });
      return;
    }
    const creatorIdToUse = creatorId || creatorName;
    pushHistory('creator', getSubPath('creator', creatorIdToUse));
    setSelectedPost(null);
    setViewingCreator(creatorIdToUse);
  }, [pushHistory, user, navigate, getSubPath]);

  const handleTabChange = useCallback((tab: string) => {
    if (tab === activeTab) {
      setTabStacks(prev => ({ ...prev, [tab]: {} }));
      navigate(tabRootPaths[tab], { replace: true });
      return;
    }
    navigate(tabRootPaths[tab], { replace: true });
  }, [navigate, activeTab]);

  return {
    isMobile,
    activeTab,
    selectedPost,
    setSelectedPost,
    viewingCreator,
    setViewingCreator,
    openPost,
    openCreator,
    handleTabChange,
    lastBackPress,
    setLastBackPress,
    tabRootPaths
  };
}
