import { useState, useEffect, useCallback } from 'react';
import { supabase, isPlaceholder } from '@/integrations/supabase/client';
import { useAppState } from '@/context/AppContext';

export function useFollows() {
  const { user } = useAppState();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchFollows = useCallback(async () => {
    if (!user || isPlaceholder) { setFollowingIds(new Set()); return; }
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    if (data) setFollowingIds(new Set(data.map(d => d.following_id)));
  }, [user]);

  useEffect(() => { fetchFollows(); }, [fetchFollows]);

  const toggleFollow = useCallback(async (targetUserId: string) => {
    if (!user || isPlaceholder) return;
    setLoading(true);
    const isFollowing = followingIds.has(targetUserId);
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      setFollowingIds(prev => { const s = new Set(prev); s.delete(targetUserId); return s; });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
      setFollowingIds(prev => new Set(prev).add(targetUserId));
    }
    setLoading(false);
  }, [user, followingIds]);

  const isFollowing = useCallback((id: string) => followingIds.has(id), [followingIds]);

  return { followingIds, isFollowing, toggleFollow, loading, refresh: fetchFollows };
}
