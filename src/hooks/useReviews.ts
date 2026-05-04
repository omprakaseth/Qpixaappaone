import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppState } from '@/context/AppContext';
import { toast } from 'sonner';

export interface Review {
  id: string;
  user_id: string;
  prompt_id: string;
  rating: number;
  comment: string;
  created_at: string;
  username?: string;
}

export function useReviews(promptId: string) {
  const { user } = useAppState();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!promptId) return;
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });
    
    if (data && data.length > 0) {
      // Fetch usernames
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name || p.username || 'User']) || []);
      setReviews(data.map(r => ({ ...r, username: profileMap.get(r.user_id) || 'User' })));
    } else {
      setReviews([]);
    }
    setLoading(false);
  }, [promptId]);

  const addReview = useCallback(async (rating: number, comment: string) => {
    if (!user || !promptId) return false;
    const { error } = await supabase
      .from('reviews')
      .upsert({ user_id: user.id, prompt_id: promptId, rating, comment }, { onConflict: 'user_id,prompt_id' });
    if (error) {
      toast.error('Failed to submit review');
      return false;
    }
    toast.success('Review submitted!');
    await fetchReviews();
    return true;
  }, [user, promptId, fetchReviews]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return { reviews, loading, fetchReviews, addReview, avgRating, count: reviews.length };
}
